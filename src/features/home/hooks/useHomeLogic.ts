import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import { mmkv } from '@/lib/mmkv';
import { useWeather } from '@/features/home/hooks/useWeather';
import type { WeatherCondition } from '@/features/home/services/weatherService';
import type { TopicQuestion } from '@/types/entities';
import { NetworkQualityService } from '@/features/recorder/services/NetworkQualityService';
import { markQuestionAsAnswered } from '@/features/recorder/services/topicService';
import { useLiveKitDialog } from '@/features/recorder/hooks/useLiveKitDialog';
import type { DialogMode } from '@/features/recorder/services/AiDialogOrchestrator';
import { getCloudSettings } from '@/features/settings/services/cloudSettingsService';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { resolveUploadAsset, type UploadAsset } from '@/lib/sync-engine/transcode';
import { secureRecordingAssetsAtRest } from '@/lib/audioEncryption';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES, toStoryRoute } from '@/features/app/navigation/routes';
import { HOME_STRINGS, MONTH_NAMES } from '../data/mockHomeData';
import { isCloudAiEnabledLocally } from '@/lib/cloudPolicy';

type RecordingMode = 'basic' | 'ai';
const RECORDING_MODE_KEY = 'recording.mode';
const TRANSCODE_TIMEOUT_MS = 8000;

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

function normalizeTopicCategory(raw?: string): TopicQuestion['category'] | undefined {
  if (!raw) return undefined;

  const normalized = raw.toLowerCase();
  const supported: TopicQuestion['category'][] = [
    'childhood',
    'family',
    'career',
    'memories',
    'wisdom',
    'general',
    'milestones',
    'adventures',
    'reflections',
    'travel',
    'education',
    'hobbies',
    'celebrations',
    'food',
    'friendship',
    'history',
  ];

  return supported.find((category) => category === normalized);
}

async function resolveUploadAssetWithTimeout(filePath: string): Promise<UploadAsset> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const fallbackAsset: UploadAsset = {
    localPath: filePath,
    extension: 'wav',
  };

  try {
    const timeoutPromise = new Promise<UploadAsset>((resolve) => {
      timeoutId = setTimeout(() => {
        devLog.warn('[useHomeLogic] Opus conversion timeout; fallback to wav upload');
        resolve(fallbackAsset);
      }, TRANSCODE_TIMEOUT_MS);
    });

    return await Promise.race([
      resolveUploadAsset(filePath),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function useHomeLogic() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicId?: string;
    topicText?: string;
    topicCategory?: string;
    topicFamily?: string;
  }>();
  const [recordingHandle, setRecordingHandle] = useState<RecordingHandle | null>(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingStartedAtMs, setRecordingStartedAtMs] = useState<number | null>(null);
  const [recordingPausedAtMs, setRecordingPausedAtMs] = useState<number | null>(null);
  const [recordingTotalPausedMs, setRecordingTotalPausedMs] = useState(0);
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [isPauseTransitioning, setIsPauseTransitioning] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null); // For success view
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(() => {
    const stored = mmkv.getString(RECORDING_MODE_KEY);
    return stored === 'ai' || stored === 'basic' ? stored : 'basic';
  });
  const recordingModeRef = useRef<RecordingMode>(recordingMode);

  const { currentAmplitude, updateAmplitude } = useAudioAmplitude();
  const weather = useWeather();
  const enqueueRecording = useSyncStore((state) => state.enqueueRecording);
  const syncEngineOnline = useSyncStore((state) => state.isOnline);
  const [isRecorderOnline, setIsRecorderOnline] = useState(syncEngineOnline);
  const recorderOnlineRef = useRef(syncEngineOnline);
  const networkQualityServiceRef = useRef<NetworkQualityService | null>(null);
  const [cloudAIEnabled, setCloudAIEnabled] = useState(false);
  const cloudAIEnabledRef = useRef(false);
  const cloudDialogModeRef = useRef<DialogMode>('DIALOG');
  const cloudDialogConnectedRef = useRef(false);
  const cloudDialogConnectInFlightRef = useRef(false);
  const recordingHandleRef = useRef<RecordingHandle | null>(null);
  const isRecordingPausedRef = useRef(false);
  const recordingPausedAtMsRef = useRef<number | null>(null);
  const isStartingRecordingRef = useRef(false);
  const isStoppingRecordingRef = useRef(false);
  const isPauseTransitioningRef = useRef(false);

  // Authentication & Notifications
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { profile } = useProfile();
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

  useEffect(() => {
    let mounted = true;

    void getCloudSettings()
      .then((settings) => {
        if (!mounted) return;
        setCloudAIEnabled(settings.cloudAIEnabled);
      })
      .catch((error) => {
        devLog.warn('[useHomeLogic] Failed to resolve cloud settings; using default disabled', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    cloudAIEnabledRef.current = cloudAIEnabled;
  }, [cloudAIEnabled]);

  useEffect(() => {
    recordingModeRef.current = recordingMode;
  }, [recordingMode]);

  useEffect(() => {
    recorderOnlineRef.current = isRecorderOnline;
  }, [isRecorderOnline]);

  useEffect(() => {
    recordingHandleRef.current = recordingHandle;
  }, [recordingHandle]);

  useEffect(() => {
    isRecordingPausedRef.current = isRecordingPaused;
  }, [isRecordingPaused]);

  useEffect(() => {
    recordingPausedAtMsRef.current = recordingPausedAtMs;
  }, [recordingPausedAtMs]);

  useEffect(() => {
    if (!recordingHandle) {
      setIsRecorderOnline(syncEngineOnline);
    }
  }, [recordingHandle, syncEngineOnline]);

  useEffect(() => {
    if (!recordingHandle) {
      networkQualityServiceRef.current?.destroy();
      networkQualityServiceRef.current = null;
      return;
    }

    const qualityService = new NetworkQualityService();
    networkQualityServiceRef.current = qualityService;
    setIsRecorderOnline(syncEngineOnline);

    const unsubscribe = qualityService.onQualityChange((metrics) => {
      setIsRecorderOnline(metrics.quality !== 'OFFLINE');
    });

    qualityService.start();

    return () => {
      unsubscribe();
      qualityService.destroy();
      if (networkQualityServiceRef.current === qualityService) {
        networkQualityServiceRef.current = null;
      }
    };
  }, [recordingHandle, syncEngineOnline]);

  // TTS & Questions
  const initialQuestion = useMemo(() => {
    if (params.topicId) {
      const existing = getQuestionById(params.topicId);
      if (existing) return existing;
    }

    if (params.topicText) {
      return {
        id: params.topicId ?? `custom-topic-${params.topicText}`,
        text: params.topicText,
        category: normalizeTopicCategory(params.topicCategory),
        isFromFamily: params.topicFamily === '1',
      } satisfies TopicQuestion;
    }

    return undefined;
  }, [params.topicId, params.topicText, params.topicCategory, params.topicFamily]);

  const {
    currentQuestion,
    isSpeaking,
    words,
    currentWordIndex,
    replay,
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
  const hasCloudAiInfra = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  const isAiAvailable = hasCloudAiInfra && cloudAIEnabled;
  const canEnableAiMode = isAiAvailable && isRecorderOnline;
  const shouldRecommendAi = hasCloudAiInfra && cloudAIEnabled && recordingMode === 'basic';
  const aiLanguage = profile?.language?.trim() || Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  const handleCloudDialogError = useCallback((error: Error) => {
    devLog.warn('[useHomeLogic] Cloud dialog session failed', error);
  }, []);

  const {
    connect: connectCloudDialog,
    disconnect: disconnectCloudDialog,
    isConnected: isCloudDialogConnected,
    dialogMode: cloudDialogMode,
    networkQuality: cloudNetworkQuality,
    startWaitingForAiResponse,
    transcripts,
    error: cloudDialogError,
  } = useLiveKitDialog({
    storyId: recordingHandle?.metadata.id,
    topicText: currentQuestion?.text ?? HOME_STRINGS.questionCard.defaultQuestion,
    language: aiLanguage,
    onError: handleCloudDialogError,
  });

  useEffect(() => {
    cloudDialogModeRef.current = cloudDialogMode;
  }, [cloudDialogMode]);

  useEffect(() => {
    cloudDialogConnectedRef.current = isCloudDialogConnected;
  }, [isCloudDialogConnected]);

  useEffect(() => {
    if (recordingMode !== 'ai') {
      return;
    }

    if (recordingHandle || isStartingRecording) {
      return;
    }

    if (!canEnableAiMode) {
      setRecordingMode('basic');
      recordingModeRef.current = 'basic';
      mmkv.set(RECORDING_MODE_KEY, 'basic');
    }
  }, [recordingMode, recordingHandle, isStartingRecording, canEnableAiMode]);

  useEffect(() => {
    const shouldConnectCloudDialog =
      recordingMode === 'ai' &&
      Boolean(recordingHandle) &&
      cloudAIEnabled &&
      hasCloudAiInfra &&
      isRecorderOnline &&
      !isCloudDialogConnected &&
      !cloudDialogConnectInFlightRef.current;

    if (!shouldConnectCloudDialog || !recordingHandle) {
      return;
    }

    cloudDialogConnectInFlightRef.current = true;
    void connectCloudDialog(recordingHandle.metadata.id)
      .catch((error: unknown) => {
        devLog.warn('[useHomeLogic] Failed to connect cloud dialog from reactive connector', error);
        setRecordingMode('basic');
        recordingModeRef.current = 'basic';
        mmkv.set(RECORDING_MODE_KEY, 'basic');
        showErrorToast('AI agent is unavailable. Staying in Classic mode.');
      })
      .finally(() => {
        cloudDialogConnectInFlightRef.current = false;
      });
  }, [
    recordingMode,
    recordingHandle,
    cloudAIEnabled,
    hasCloudAiInfra,
    isRecorderOnline,
    isCloudDialogConnected,
    connectCloudDialog,
  ]);

  useEffect(() => {
    if (!recordingHandle || !recordingStartedAtMs) {
      setRecordingDurationSec(0);
      return;
    }

    const computeDurationSec = (): number => {
      const effectiveNow = recordingPausedAtMs ?? Date.now();
      const elapsedMs = Math.max(0, effectiveNow - recordingStartedAtMs - recordingTotalPausedMs);
      return Math.floor(elapsedMs / 1000);
    };

    setRecordingDurationSec(computeDurationSec());
    const interval = setInterval(() => {
      setRecordingDurationSec(computeDurationSec());
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingHandle, recordingStartedAtMs, recordingPausedAtMs, recordingTotalPausedMs]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'recording-interruption',
      (event: { recordingId?: string; isPaused?: boolean }) => {
        const activeId = recordingHandleRef.current?.metadata.id;
        if (!activeId || event.recordingId !== activeId) {
          return;
        }

        if (event.isPaused) {
          if (!isRecordingPausedRef.current) {
            setIsRecordingPaused(true);
          }
          if (!recordingPausedAtMsRef.current) {
            const now = Date.now();
            setRecordingPausedAtMs(now);
            recordingPausedAtMsRef.current = now;
          }
          return;
        }

        const pausedAt = recordingPausedAtMsRef.current;
        if (pausedAt) {
          setRecordingTotalPausedMs((current) => current + (Date.now() - pausedAt));
        }
        setRecordingPausedAtMs(null);
        recordingPausedAtMsRef.current = null;
        if (isRecordingPausedRef.current) {
          setIsRecordingPaused(false);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // Recording Actions
  const handleStartRecording = useCallback(async () => {
    if (
      isStartingRecordingRef.current ||
      isStoppingRecordingRef.current ||
      recordingHandleRef.current
    ) {
      devLog.warn('[useHomeLogic] Ignoring duplicate start request');
      return;
    }

    isStartingRecordingRef.current = true;
    setIsStartingRecording(true);
    stopTTS();

    const canStartAiMode = recordingMode === 'ai' && isAiAvailable && recorderOnlineRef.current;
    if (recordingMode === 'ai' && !canStartAiMode) {
      setRecordingMode('basic');
      recordingModeRef.current = 'basic';
      mmkv.set(RECORDING_MODE_KEY, 'basic');
      showErrorToast('AI mode is unavailable now. Switched to Classic mode.');
    }

    try {
      const handle = await startRecordingStream({
        topicId: currentQuestion?.id,
        userId: sessionUserId ?? undefined,
        onSilence: () => {
          if (recordingModeRef.current !== 'ai') {
            return;
          }

          const canUseCloudFollowUp =
            cloudAIEnabledRef.current &&
            hasCloudAiInfra &&
            recorderOnlineRef.current &&
            cloudDialogConnectedRef.current &&
            cloudDialogModeRef.current === 'DIALOG';

          if (canUseCloudFollowUp || cloudDialogModeRef.current === 'SILENT') {
            return;
          }

          void replay();
        },
        onSilenceThreshold: () => {
          if (recordingModeRef.current !== 'ai') {
            return;
          }

          const canUseCloudFollowUp =
            cloudAIEnabledRef.current &&
            hasCloudAiInfra &&
            recorderOnlineRef.current &&
            cloudDialogConnectedRef.current &&
            cloudDialogModeRef.current === 'DIALOG';

          if (canUseCloudFollowUp) {
            startWaitingForAiResponse();
            return;
          }

          if (cloudDialogModeRef.current === 'SILENT') {
            return;
          }

          void newTopic();
        },
        onMetering: (metering) => {
          updateAmplitude(metering);
        },
      });

      setRecordingHandle(handle);
      setIsRecordingPaused(false);
      setRecordingStartedAtMs(handle.metadata.startedAt.getTime());
      setRecordingPausedAtMs(null);
      setRecordingTotalPausedMs(0);
      setRecordingDurationSec(0);
      setIsStoppingRecording(false);
      setIsPauseTransitioning(false);
      isStoppingRecordingRef.current = false;
      isPauseTransitioningRef.current = false;
      setLastSavedId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      devLog.error('[useHomeLogic] Failed to start recording:', error);
      if (error instanceof InsufficientStorageError) {
        showErrorToast(error.message);
      } else {
        const message = error instanceof Error ? error.message : HOME_STRINGS.recording.startError;
        showErrorToast(message);
      }
    } finally {
      isStartingRecordingRef.current = false;
      setIsStartingRecording(false);
    }
  }, [
    stopTTS,
    currentQuestion?.id,
    sessionUserId,
    recordingMode,
    replay,
    newTopic,
    updateAmplitude,
    hasCloudAiInfra,
    isAiAvailable,
    startWaitingForAiResponse,
  ]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingHandle || isStoppingRecordingRef.current) return;
    isStoppingRecordingRef.current = true;
    setIsStoppingRecording(true);

    try {
      const finalized = await recordingHandle.stop();

      // Release recording UI immediately after native stop succeeds.
      setRecordingHandle(null);
      setIsRecordingPaused(false);
      setRecordingStartedAtMs(null);
      setRecordingPausedAtMs(null);
      setRecordingTotalPausedMs(0);
      setRecordingDurationSec(0);
      updateAmplitude(-160);
      setLastSavedId(finalized.id);

      const uploadAsset = await resolveUploadAssetWithTimeout(finalized.filePath).catch((error: unknown) => {
        devLog.warn('[useHomeLogic] Post-recording transcode failed; fallback to wav upload', error);
        return { localPath: finalized.filePath, extension: 'wav' as const };
      });
      const securedAssets = await secureRecordingAssetsAtRest({
        recordingId: finalized.id,
        filePath: finalized.filePath,
        uploadPath: uploadAsset.localPath,
        uploadExtension: uploadAsset.extension,
      }).catch((error: unknown) => {
        devLog.warn('[useHomeLogic] Failed to encrypt recording assets; keeping plaintext fallback', error);
        return {
          encryptedFilePath: finalized.filePath,
          encryptedUploadPath: uploadAsset.localPath,
        };
      });

      if (currentQuestion?.isFromFamily) {
        try {
          await markQuestionAsAnswered(currentQuestion.id, finalized.id);
        } catch (error) {
          devLog.warn('[useHomeLogic] Failed to mark family question as answered', error);
        }
      }

      // Parallelize DB op and UI feedback (Vercel best practice)
      await Promise.all([
        enqueueRecording(finalized.id, securedAssets.encryptedFilePath, {
          uploadPath: securedAssets.encryptedUploadPath,
          uploadExtension: uploadAsset.extension,
          transcodeStatus: uploadAsset.extension === 'opus' ? 'ready' : 'fallback_wav',
        }),
        playSuccess(),
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : HOME_STRINGS.recording.stopError;
      if (message.toLowerCase().includes('recording is not active')) {
        devLog.warn('[useHomeLogic] Duplicate stop ignored: recording already inactive');
      } else {
        showErrorToast(message);
      }
    } finally {
      if (isCloudDialogConnected) {
        void disconnectCloudDialog().catch((error: unknown) => {
          devLog.warn('[useHomeLogic] Failed to disconnect cloud dialog session', error);
        });
      }
      setRecordingHandle(null);
      setIsRecordingPaused(false);
      setRecordingStartedAtMs(null);
      setRecordingPausedAtMs(null);
      setRecordingTotalPausedMs(0);
      setRecordingDurationSec(0);
      setIsStoppingRecording(false);
      setIsPauseTransitioning(false);
      isStoppingRecordingRef.current = false;
      isPauseTransitioningRef.current = false;
      updateAmplitude(-160);
    }
  }, [
    recordingHandle,
    currentQuestion,
    enqueueRecording,
    updateAmplitude,
    isCloudDialogConnected,
    disconnectCloudDialog,
  ]);

  const handlePauseRecording = useCallback(async () => {
    if (
      !recordingHandle ||
      isPauseTransitioningRef.current ||
      isStoppingRecordingRef.current
    ) {
      return;
    }

    isPauseTransitioningRef.current = true;
    setIsPauseTransitioning(true);
    try {
      await recordingHandle.pause();
      setIsRecordingPaused(true);
      setRecordingPausedAtMs(Date.now());
    } catch (error) {
      devLog.warn('[useHomeLogic] Failed to pause recording', error);
      showErrorToast('Unable to pause right now. Recording is still running.');
    } finally {
      isPauseTransitioningRef.current = false;
      setIsPauseTransitioning(false);
    }
  }, [recordingHandle]);

  const handleResumeRecording = useCallback(async () => {
    if (
      !recordingHandle ||
      isPauseTransitioningRef.current ||
      isStoppingRecordingRef.current
    ) {
      return;
    }

    isPauseTransitioningRef.current = true;
    setIsPauseTransitioning(true);
    try {
      await recordingHandle.resume();
      if (recordingPausedAtMs) {
        setRecordingTotalPausedMs((current) => current + (Date.now() - recordingPausedAtMs));
      }
      setRecordingPausedAtMs(null);
      setIsRecordingPaused(false);
    } catch (error) {
      devLog.warn('[useHomeLogic] Failed to resume recording', error);
      showErrorToast('Unable to resume right now. Please try again.');
    } finally {
      isPauseTransitioningRef.current = false;
      setIsPauseTransitioning(false);
    }
  }, [recordingHandle, recordingPausedAtMs]);

  const setRecordingModeAndPersist = useCallback((mode: RecordingMode) => {
    const effectiveCloudAiEnabled = isCloudAiEnabledLocally();

    if (effectiveCloudAiEnabled !== cloudAIEnabled) {
      setCloudAIEnabled(effectiveCloudAiEnabled);
    }

    if (mode === 'ai') {
      devLog.info('[useHomeLogic] AI mode gate check', {
        hasCloudAiInfra,
        cloudAIEnabledInMemory: cloudAIEnabled,
        cloudAIEnabledEffective: effectiveCloudAiEnabled,
        isRecorderOnline,
      });
    }

    if (mode === 'ai' && !hasCloudAiInfra) {
      showErrorToast('AI mode is not configured on this build.');
      return;
    }

    if (mode === 'ai' && !effectiveCloudAiEnabled) {
      showErrorToast('Enable Cloud AI Processing in Settings > Data & Storage first.');
      return;
    }

    if (mode === 'ai' && !isAiAvailable) {
      showErrorToast('AI mode is temporarily unavailable.');
      return;
    }

    if (mode === 'ai' && !isRecorderOnline) {
      showErrorToast('Network unavailable. AI mode needs internet.');
      return;
    }

    setRecordingMode(mode);
    recordingModeRef.current = mode;
    mmkv.set(RECORDING_MODE_KEY, mode);
    if (mode === 'ai') {
      return;
    }

    if (isCloudDialogConnected) {
      void disconnectCloudDialog().catch((error: unknown) => {
        devLog.warn('[useHomeLogic] Failed to disconnect cloud dialog on mode switch', error);
      });
    }
  }, [
    isAiAvailable,
    hasCloudAiInfra,
    cloudAIEnabled,
    isRecorderOnline,
    isCloudDialogConnected,
    disconnectCloudDialog,
  ]);

  const formattedDate = formatDate(new Date());
  const greeting = getGreeting();
  const weatherIcon = getWeatherIconName(weather.condition);
  const storyCategoryTitle = getCategoryTitle(currentQuestion?.category);

  return useMemo(
    () => ({
      state: {
        recordingHandle,
        isRecordingPaused,
        lastSavedId,
        currentAmplitude,
        currentQuestion,
        isSpeaking,
        words,
        currentWordIndex,
        isCurrentTopicAnswered,
        formattedDate,
        greeting,
        weather,
        weatherIcon,
        storyCategoryTitle,
        activities,
        hasUnread,
        isOnline: isRecorderOnline,
        recordingMode,
        isAiAvailable,
        canEnableAiMode,
        shouldRecommendAi,
        cloudAIEnabled,
        cloudDialogMode,
        cloudNetworkQuality,
        isCloudDialogConnected,
        cloudDialogError,
        transcripts,
        recordingDurationSec,
        isStoppingRecording,
        isPauseTransitioning,
        isStartingRecording,
      },
      actions: {
        setLastSavedId,
        handleStartRecording,
        handleStopRecording,
        handlePauseRecording,
        handleResumeRecording,
        setRecordingMode: setRecordingModeAndPersist,
        newTopic,
        replayQuestion: replay,
        navigateToSettings: () => router.push(APP_ROUTES.SETTINGS),
        navigateToListen: () => router.push(APP_ROUTES.GALLERY),
        navigateToStory: (storyId: string) => router.push(toStoryRoute(storyId)),
      },
    }),
    [
      recordingHandle,
      isRecordingPaused,
      lastSavedId,
      currentAmplitude,
      currentQuestion,
      isSpeaking,
      words,
      currentWordIndex,
      isCurrentTopicAnswered,
      formattedDate,
      greeting,
      weather,
      weatherIcon,
      storyCategoryTitle,
      activities,
      hasUnread,
      isRecorderOnline,
      recordingMode,
      isAiAvailable,
      canEnableAiMode,
      shouldRecommendAi,
      cloudAIEnabled,
        cloudDialogMode,
        cloudNetworkQuality,
      isCloudDialogConnected,
        cloudDialogError,
        transcripts,
      recordingDurationSec,
      isStoppingRecording,
      isPauseTransitioning,
      isStartingRecording,
      handleStartRecording,
      handleStopRecording,
      handlePauseRecording,
      handleResumeRecording,
      setRecordingModeAndPersist,
      newTopic,
      replay,
      router,
    ]
  );
}
