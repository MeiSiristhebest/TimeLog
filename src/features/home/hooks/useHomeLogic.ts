import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';

import {
  startRecordingStream,
  type RecordingHandle,
  InsufficientStorageError,
} from '@/features/recorder/services/recorderService';
import { useAudioAmplitude } from '@/features/recorder/hooks/useAudioAmplitude';
import { useTTS } from '@/features/recorder/hooks/useTTS';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';
import {
  initializeSoundCue,
  playSuccess,
  cleanupSoundCue,
} from '@/features/recorder/services/soundCueService';
import { useSyncStore } from '@/lib/sync-engine/store';
import { useUnreadActivities } from '@/features/home/hooks/useUnreadActivities';
import { useIsTopicAnswered } from '@/features/recorder/hooks/useAnsweredTopics';
import { updateAppBadge } from '@/lib/notifications/badgeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { useWeather } from '@/features/home/hooks/useWeather';
import type { WeatherCondition } from '@/features/home/services/weatherService';
import { HOME_STRINGS, MONTH_NAMES } from '../data/mockHomeData';

// Helpers
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return HOME_STRINGS.greetings.morning;
  if (hour < 17) return HOME_STRINGS.greetings.afternoon;
  return HOME_STRINGS.greetings.evening;
}

function getDaySuffix(day: number): string {
  if (day === 1 || day === 21 || day === 31) return 'st';
  if (day === 2 || day === 22) return 'nd';
  if (day === 3 || day === 23) return 'rd';
  return 'th';
}

function formatDate(date: Date): string {
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return `${MONTH_NAMES[date.getMonth()]} ${day}${suffix}`;
}

function getWeatherIconName(condition: WeatherCondition): string {
  switch (condition) {
    case 'sunny':
      return 'sunny';
    case 'rainy':
      return 'rainy';
    case 'snowy':
      return 'snow';
    case 'cloudy':
      return 'cloud';
    case 'partly-cloudy':
      return 'partly-sunny';
    default:
      return 'partly-sunny';
  }
}

function getCategoryTitle(category?: string): string {
  switch (category) {
    case 'childhood':
      return HOME_STRINGS.categories.childhood;
    case 'family':
      return HOME_STRINGS.categories.family;
    case 'career':
      return HOME_STRINGS.categories.career;
    case 'memories':
      return HOME_STRINGS.categories.memories;
    case 'wisdom':
      return HOME_STRINGS.categories.wisdom;
    default:
      return HOME_STRINGS.categories.default;
  }
}

export function useHomeLogic() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topicId?: string }>();
  const [recordingHandle, setRecordingHandle] = useState<RecordingHandle | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null); // For success view

  const { currentAmplitude, updateAmplitude } = useAudioAmplitude();
  const weather = useWeather();
  const enqueueRecording = useSyncStore((state) => state.enqueueRecording);

  // Authentication & Notifications
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { activities, hasUnread, refetch } = useUnreadActivities();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (sessionUserId) {
          void updateAppBadge(sessionUserId);
          refetch();
        }
      }
      appState.current = nextAppState; // Fix: Assign string directly
    });

    if (sessionUserId) {
      void updateAppBadge(sessionUserId);
    }
    return () => subscription.remove();
  }, [sessionUserId, refetch]);

  // TTS & Questions
  const initialQuestion = useMemo(() => {
    if (params.topicId) {
      return getQuestionById(params.topicId);
    }
    return undefined;
  }, [params.topicId]);

  const {
    currentQuestion,
    stop: stopTTS,
    newTopic,
  } = useTTS({
    autoPlay: true,
    initialQuestion,
  });

  // Sound Cues
  useEffect(() => {
    void initializeSoundCue();
    return () => {
      void cleanupSoundCue();
    };
  }, []);

  // Answer Status
  const isCurrentTopicAnswered = useIsTopicAnswered(currentQuestion?.id);

  // Recording Actions
  const handleStartRecording = useCallback(async () => {
    stopTTS();
    try {
      const handle = await startRecordingStream({
        onSilence: () => {},
        onSilenceThreshold: () => {},
        onMetering: (metering) => {
          updateAmplitude(metering);
        },
      });
      setRecordingHandle(handle);
      setLastSavedId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      if (error instanceof InsufficientStorageError) {
        showErrorToast(error.message);
      } else {
        const message = error instanceof Error ? error.message : HOME_STRINGS.recording.startError;
        showErrorToast(message);
      }
    }
  }, [stopTTS, updateAmplitude]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingHandle) return;
    try {
      const finalized = await recordingHandle.stop();
      await enqueueRecording(finalized.id, finalized.filePath);
      await playSuccess();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastSavedId(finalized.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : HOME_STRINGS.recording.stopError;
      showErrorToast(message);
    } finally {
      setRecordingHandle(null);
      updateAmplitude(-160);
    }
  }, [recordingHandle, enqueueRecording, updateAmplitude]);

  const formattedDate = formatDate(new Date());
  const greeting = getGreeting();
  const weatherIcon = getWeatherIconName(weather.condition);
  const storyCategoryTitle = getCategoryTitle(currentQuestion?.category);

  return useMemo(
    () => ({
      state: {
        recordingHandle,
        lastSavedId,
        currentAmplitude,
        currentQuestion,
        isCurrentTopicAnswered,
        formattedDate,
        greeting,
        weather,
        weatherIcon,
        storyCategoryTitle,
        activities,
        hasUnread,
      },
      actions: {
        setLastSavedId,
        handleStartRecording,
        handleStopRecording,
        newTopic,
        navigateToSettings: () => router.push('/(tabs)/settings'),
        navigateToStory: (storyId: string) => router.push(`/story/${storyId}`),
      },
    }),
    [
      recordingHandle,
      lastSavedId,
      currentAmplitude,
      currentQuestion,
      isCurrentTopicAnswered,
      formattedDate,
      greeting,
      weather,
      weatherIcon,
      storyCategoryTitle,
      activities,
      hasUnread,
      handleStartRecording,
      handleStopRecording,
      newTopic,
      router,
    ]
  );
}
