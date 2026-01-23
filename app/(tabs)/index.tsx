import { Link, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Text, View, AppState, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Animated, { useSharedValue, useAnimatedScrollHandler, FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { Container } from '@/components/ui/Container';
import { HomeNotification } from '@/features/home/components/HomeNotification';
import {
  InsufficientStorageError,
  startRecordingStream,
  type RecordingHandle,
} from '@/features/recorder/services/recorderService';
import { WaveformVisualizer } from '@/features/recorder/components/WaveformVisualizer';
import { RecordingControls } from '@/features/recorder/components/RecordingControls';
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
import { updateAppBadge } from '@/lib/notifications/badgeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { ActiveRecordingView } from '@/features/recorder/components/ActiveRecordingView';
import { StorySavedView } from '@/features/recorder/components/StorySavedView';
import { useHeritageTheme } from '@/theme/heritage';
import { Activity } from '@/features/home/services/activityService';
import { useWeather } from '@/features/home/hooks/useWeather';

// Helper: Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Helper: Format date as "January 18th"
const formatDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31 ? 'st' :
      day === 2 || day === 22 ? 'nd' :
        day === 3 || day === 23 ? 'rd' : 'th';
  return `${months[date.getMonth()]} ${day}${suffix}`;
};

// Helper: Format activity message
const formatActivityMessage = (activity: Activity | undefined): string => {
  if (!activity) return 'No new activity';
  const { type, actorName, storyTitle } = activity;
  switch (type) {
    case 'reaction':
      return `${actorName} liked "${storyTitle}".`;
    case 'comment':
      return `${actorName} commented on "${storyTitle}".`;
    case 'story_share':
      return `${actorName} shared "${storyTitle}".`;
    default:
      return `${actorName} interacted with "${storyTitle}".`;
  }
}


// Helper: Get category title
const getCategoryTitle = (category?: string): string => {
  switch (category) {
    case 'childhood': return 'My Childhood';
    case 'family': return 'My Family';
    case 'career': return 'My Career';
    case 'memories': return 'My Memories';
    case 'wisdom': return 'My Wisdom';
    default: return 'My Story';
  }
};

export default function HomeTab() {
  const params = useLocalSearchParams<{ topicId?: string }>();
  const [recordingHandle, setRecordingHandle] = useState<RecordingHandle | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [silenceNotice, setSilenceNotice] = useState<string | null>(null);

  const { currentAmplitude, updateAmplitude } = useAudioAmplitude();
  const weather = useWeather();
  const enqueueRecording = useSyncStore((state) => state.enqueueRecording);

  const theme = useHeritageTheme();
  const { colors, spacing, radius } = theme;

  const handleSilenceDetected = useCallback(() => {
    setSilenceNotice('Listening... (Silence detected)');
  }, []);

  // Handle selected topic from discovery if provided
  const initialQuestion = useMemo(() => {
    if (params.topicId) {
      return getQuestionById(params.topicId);
    }
    return undefined;
  }, [params.topicId]);

  // TTS Hook
  const {
    currentQuestion,
    isSpeaking,
    replay,
    stop: stopTTS,
    newTopic,
  } = useTTS({
    autoPlay: true,
    initialQuestion,
  });

  useEffect(() => {
    void initializeSoundCue();
    return () => {
      void cleanupSoundCue();
    };
  }, []);

  const router = useRouter();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { activities, hasUnread, refetch } = useUnreadActivities();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (sessionUserId) {
          void updateAppBadge(sessionUserId);
          refetch();
        }
      }
      appState.current = nextAppState;
    });

    if (sessionUserId) {
      void updateAppBadge(sessionUserId);
    }

    return () => subscription.remove();
  }, [sessionUserId, refetch]);


  // Recording Handlers
  const handleStart = useCallback(async () => {
    stopTTS();
    setIsBusy(true);
    try {
      setSilenceNotice(null);
      const handle = await startRecordingStream({
        onSilence: () => { },
        onSilenceThreshold: handleSilenceDetected,
        onMetering: (metering) => {
          updateAmplitude(metering);
        },
      });
      setRecordingHandle(handle);
      setIsPaused(false);
      setLastSavedId(null);
      // 2026 UX: Heavy haptic on recording start for physicality
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      if (error instanceof InsufficientStorageError) {
        showErrorToast(error.message);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to start recording. Please try again.';
        showErrorToast(message);
      }
    } finally {
      setIsBusy(false);
    }
  }, [stopTTS, updateAmplitude, handleSilenceDetected]);

  const handlePause = async () => {
    if (!recordingHandle) return;
    try {
      await recordingHandle.pause();
      setIsPaused(true);
      setSilenceNotice('Recording paused. Tap Resume to continue.');
    } catch (error) {
      console.error('Failed to pause', error);
    }
  };

  const handleResume = async () => {
    if (!recordingHandle) return;
    try {
      await recordingHandle.resume();
      setIsPaused(false);
      setSilenceNotice(null);
    } catch (error) {
      console.error('Failed to resume', error);
    }
  };

  const handleStop = async () => {
    if (!recordingHandle) return;
    setIsBusy(true);
    try {
      const finalized = await recordingHandle.stop();
      await enqueueRecording(finalized.id, finalized.filePath);
      await playSuccess();
      // 2026 UX: Success haptic notification on story saved
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastSavedId(finalized.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop recording. Please try again.';
      showErrorToast(message);
    } finally {
      setRecordingHandle(null);
      setSilenceNotice(null);
      setIsPaused(false);
      setIsBusy(false);
      updateAmplitude(-160);
    }
  };

  // -- Views --

  // Active Recording View (New Heritage Hybrid Design)
  if (recordingHandle) {
    return (
      <ActiveRecordingView
        amplitude={currentAmplitude}
        questionText={currentQuestion?.text}
        onStop={handleStop}
      // We can add pause support later if design allows, for now design only shows STOP.
      // If pause is needed, we'd add controls to ActiveView or handle gestures.
      // Design explicitly requested "Giant HFE Pill Button - Stop Recording".
      />
    );
  }

  // Story Saved Success View
  if (lastSavedId) {
    return (
      <StorySavedView
        onDismiss={() => setLastSavedId(null)}
        storyTitle={getCategoryTitle(currentQuestion?.category)}
        category={currentQuestion?.category}
      />
    );
  }

  // Idle Home View (New Design)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.onSurface }]}>{getGreeting()}</Text>
          <View style={styles.dateRow}>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(new Date())}</Text>
            {!weather.isLoading && !weather.error && (
              <>
                <View style={[styles.dot, { backgroundColor: `${colors.textMuted}50` }]} />
                <View style={styles.weatherContainer}>
                  <Ionicons
                    name={weather.condition === 'sunny' ? 'sunny' : weather.condition === 'rainy' ? 'rainy' : weather.condition === 'snowy' ? 'snow' : 'partly-sunny'}
                    size={18}
                    color={colors.warning}
                    accessibilityLabel={`Weather: ${weather.condition}, ${weather.temperature} degrees Celsius`}
                  />
                  <Text style={[styles.weatherText, { color: colors.textMuted }]}>{weather.temperature}°C</Text>
                </View>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-sharp" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Notification Card - Dynamic based on activities */}
        {/* Notification Card - Dynamic based on activities */}
        {hasUnread && activities.length > 0 && (
          <HomeNotification
            onPress={() => {
              const firstActivity = activities[0];
              if (firstActivity?.storyId) {
                router.push(`/story/${firstActivity.storyId}`);
              }
            }}
            actorName={activities[0]?.actorName}
            storyTitle={activities[0]?.storyTitle}
            actionText={activities[0]?.type === 'reaction' ? 'liked' : 'commented on'}
          />
        )}

        {/* Question Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ flex: 1, justifyContent: 'center', marginTop: 8 }}>
          <View style={[styles.paperCard, { borderColor: colors.border, backgroundColor: colors.surfaceWarm }]}>
            {/* Decorative elements */}
            <View style={styles.clipIcon}>
              <Ionicons name="attach" size={48} color={colors.handle} style={{ transform: [{ rotate: '-12deg' }] }} />
            </View>
            <View style={[styles.tape, { backgroundColor: `${colors.surfaceDim}80` }]} />

            <Text style={[styles.questionText, { color: colors.onSurface }]}>
              {currentQuestion ? currentQuestion.text : "What was your favorite toy?"}
            </Text>

            <View style={{ marginTop: 8 }}>
              <HeritageButton
                title="New Question"
                onPress={newTopic}
                variant="outline"
                size="medium"
                icon="refresh"
                accessibilityLabel="Get a new question prompt"
              />
            </View>
          </View>
        </Animated.View>

        {/* Record Button Area */}
        <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.recordArea}>
          <View style={styles.recordButtonContainer}>
            <View style={[styles.recordGlow, { backgroundColor: `${colors.primary}30` }]} />
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              onPress={handleStart}
              activeOpacity={0.9}
              accessibilityLabel="Start recording your story"
              accessibilityRole="button"
              accessibilityHint="Tap to begin recording audio"
            >
              <Ionicons name="mic" size={52} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.tapToRecord, { color: colors.onSurface }]}>Tap to Record</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed - use dynamic colors.surface from theme via inline style
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28, // md:text-3xl
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 96, // Space for tab bar
    gap: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  paperCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 24,
    // Note: box-shadow and gradient are harder in pure RN styles without SVG/LinearGradient, 
    // keeping close with simple shadow
    elevation: 4,
  },
  clipIcon: {
    position: 'absolute',
    right: 24,
    top: -4,
    zIndex: 10,
  },
  tape: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -48, // w-24 / 2
    width: 96,
    height: 32,
    transform: [{ rotate: '1deg' }],
  },
  questionText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 30, // text-3xl
    textAlign: 'center',
    lineHeight: 36,
    marginTop: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  recordArea: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  recordButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  recordGlow: {
    position: 'absolute',
    width: 130, // blurred glow
    height: 130,
    borderRadius: 65,
    opacity: 0.8,
  },
  recordButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C26B4A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tapToRecord: {
    fontSize: 18,
    fontWeight: '600',
    // removed Fraunces to match button style (Sans)
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  }

});
