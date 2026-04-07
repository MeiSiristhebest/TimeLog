import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

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
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { mmkv } from '@/lib/mmkv';
import { getCloudSettings } from '@/features/settings/services/cloudSettingsService';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { resolveUploadAsset, type UploadAsset } from '@/lib/sync-engine/transcode';
import { secureRecordingAssetsAtRest } from '@/lib/audioEncryption';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES, toStoryRoute } from '@/features/app/navigation/routes';
import { HOME_STRINGS } from '../data/mockHomeData';
import { isCloudAiEnabledLocally } from '@/lib/cloudPolicy';
import { markQuestionAsAnswered } from '@/features/recorder/services/topicService';
import { prepareRecordingTarget } from '@/features/recorder/services/recorderService';
import type { TopicQuestion } from '@/types/entities';

import { useHomeDisplayData } from './useHomeDisplayData';
import { useAiDialogSession } from './useAiDialogSession';
import { useRecordingSession } from './useRecordingSession';

type RecordingMode = 'basic' | 'ai';
const RECORDING_MODE_KEY = 'recording.mode';
const TRANSCODE_TIMEOUT_MS = 8000;

// Helpers
async function resolveUploadAssetWithTimeout(filePath: string): Promise<UploadAsset> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const fallbackAsset: UploadAsset = { localPath: filePath, extension: 'wav' };

  try {
    const timeoutPromise = new Promise<UploadAsset>((resolve) => {
      timeoutId = setTimeout(() => {
        devLog.warn('[useHomeLogic] Opus conversion timeout; fallback to wav upload');
        resolve(fallbackAsset);
      }, TRANSCODE_TIMEOUT_MS);
    });
    return await Promise.race([resolveUploadAsset(filePath), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getCategoryTitle(category?: string): string {
  switch (category) {
    case 'childhood': return HOME_STRINGS.categories.childhood;
    case 'family': return HOME_STRINGS.categories.family;
    case 'career': return HOME_STRINGS.categories.career;
    case 'memories': return HOME_STRINGS.categories.memories;
    case 'wisdom': return HOME_STRINGS.categories.wisdom;
    default: return HOME_STRINGS.categories.default;
  }
}

function normalizeTopicCategory(raw?: string): TopicQuestion['category'] | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase();
  const supported: TopicQuestion['category'][] = [
    'childhood', 'family', 'career', 'memories', 'wisdom', 'general',
    'milestones', 'adventures', 'reflections', 'travel', 'education',
    'hobbies', 'celebrations', 'food', 'friendship', 'history',
  ];
  return supported.find((cat) => cat === normalized);
}

export function useHomeLogic() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicId?: string;
    topicText?: string;
    topicCategory?: string;
    topicFamily?: string;
  }>();

  // --- Persistent State ---
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(() => {
    const stored = mmkv.getString(RECORDING_MODE_KEY);
    return stored === 'ai' || stored === 'basic' ? stored : 'basic';
  });
  const [cloudAIEnabled, setCloudAIEnabled] = useState(false);
  const [appRole, setAppRole] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  
  // --- Stores & Profile ---
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { profile } = useProfile();
  const { activities, hasUnread, refetch } = useUnreadActivities();
  const enqueueRecording = useSyncStore((state) => state.enqueueRecording);
  const isSyncOnline = useSyncStore((state) => state.isOnline);

  // --- Display Data Housekeeping ---
  const { greeting, formattedDate, weather, weatherIconName } = useHomeDisplayData();

  // --- TTS & Topic Selection ---
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

  const tts = useTTS({ autoPlay: true, initialQuestion });
  const isCurrentTopicAnswered = useIsTopicAnswered(tts.currentQuestion?.id);

  // --- AI Availability Logic ---
  const hasCloudAiInfra = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const isAiAvailable = hasCloudAiInfra && cloudAIEnabled;
  const canEnableAiMode = isAiAvailable && isSyncOnline;
  const aiLanguage = profile?.language?.trim() || Intl.DateTimeFormat().resolvedOptions().locale || 'en';

  const aiDialogRef = useRef<any>(null);

  // --- Recording Session Management ---
  const recording = useRecordingSession({
    userId: sessionUserId ?? undefined,
    topicId: tts.currentQuestion?.id,
    onSilence: () => {
      const ad = aiDialogRef.current;
      if (recordingMode === 'ai' && ad?.isConnected && ad?.dialogMode === 'DIALOG') return;
      void tts.replay();
    },
    onSilenceThreshold: () => {
      const ad = aiDialogRef.current;
      if (recordingMode === 'ai' && ad?.isConnected && ad?.dialogMode === 'DIALOG') {
        ad.startWaitingForAiResponse();
        return;
      }
      void tts.newTopic();
    },
    onPause: async () => {
      if (aiDialogRef.current?.isConnected) await aiDialogRef.current.setMicrophoneEnabled(false);
    },
    onResume: async () => {
      if (aiDialogRef.current?.isConnected) await aiDialogRef.current.setMicrophoneEnabled(true);
    },
    onStop: async (finalized) => {
      // 1. Immediate UI Feedback
      setLastSavedId(finalized.id);
      void playSuccess();
      
      // 2. Immediate non-blocking AI cleanup
      if (aiDialogRef.current?.isConnected) {
        void aiDialogRef.current.disconnect();
      }

      // 3. Move heavy processing to background
      // This allows the UI to transition immediately
      (async () => {
        try {
          const uploadAsset = await resolveUploadAssetWithTimeout(finalized.filePath).catch(() => ({ 
            localPath: finalized.filePath, 
            extension: 'wav' as const 
          }));

          const securedAssets = await secureRecordingAssetsAtRest({
            recordingId: finalized.id,
            filePath: finalized.filePath,
            uploadPath: uploadAsset.localPath,
            uploadExtension: uploadAsset.extension,
          }).catch(() => ({
            encryptedFilePath: finalized.filePath,
            encryptedUploadPath: uploadAsset.localPath,
          }));

          if (tts.currentQuestion?.isFromFamily) {
            await markQuestionAsAnswered(tts.currentQuestion.id, finalized.id).catch(err => 
              devLog.warn('[useHomeLogic] Mark answered failed', err)
            );
          }

          await enqueueRecording(finalized.id, securedAssets.encryptedFilePath, {
            uploadPath: securedAssets.encryptedUploadPath,
            uploadExtension: uploadAsset.extension,
            transcodeStatus: uploadAsset.extension === 'opus' ? 'ready' : 'fallback_wav',
          });
          
          devLog.info(`[useHomeLogic] Background save complete for ${finalized.id}`);
        } catch (error) {
          devLog.error('[useHomeLogic] Background processing failed', error);
          showErrorToast('Recording saved. Optimization will continue in background.');
        }
      })();
    }
  });

  // --- AI Session Management ---
  const aiDialog = useAiDialogSession({
    storyId: recording.recordingHandle?.metadata.id,
    topicText: tts.currentQuestion?.text ?? HOME_STRINGS.questionCard.defaultQuestion,
    language: aiLanguage,
    isAiAvailable,
    isRecorderOnline: isSyncOnline,
    recordingMode,
    setRecordingMode,
  });
  aiDialogRef.current = aiDialog;

  // --- Composition & Orchestration ---

  // Handle AppState & Badge
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && sessionUserId) {
        void updateAppBadge(sessionUserId);
        refetch();
      }
    });
    if (sessionUserId) void updateAppBadge(sessionUserId);
    return () => sub.remove();
  }, [sessionUserId, refetch]);

  // Handle Initial Data
  useEffect(() => {
    void getCloudSettings().then(s => setCloudAIEnabled(s.cloudAIEnabled));
    void getStoredRole().then(r => setAppRole(r));
    void initializeSoundCue();
    return () => { void cleanupSoundCue(); };
  }, []);

  // Handle Recording Interruptions
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('recording-interruption', (event: { recordingId?: string; isPaused?: boolean }) => {
      if (event.recordingId !== recording.recordingHandle?.metadata.id) return;
      if (event.isPaused && !recording.isPaused) void recording.pause();
      if (!event.isPaused && recording.isPaused) void recording.resume();
    });
    return () => sub.remove();
  }, [recording]);

  const handleStartRecording = useCallback(async () => {
    tts.stop();
    
    // Start local recording IMMEDIATELY.
    // The aiDialog (useAiDialogSession) will auto-connect reactively 
    // when it detects a recording is active in AI mode.
    await recording.start();
  }, [recording, tts]);

  const setRecordingModeAndPersist = useCallback((mode: RecordingMode) => {
    const effectiveCloudAiEnabled = isCloudAiEnabledLocally();
    if (effectiveCloudAiEnabled !== cloudAIEnabled) setCloudAIEnabled(effectiveCloudAiEnabled);

    if (mode === 'ai') {
      if (!hasCloudAiInfra) { showErrorToast('AI mode not configured.'); return; }
      if (!effectiveCloudAiEnabled) { showErrorToast('Enable AI in Settings first.'); return; }
      if (!isSyncOnline) { showErrorToast('Network unavailable.'); return; }
    }

    setRecordingMode(mode);
    mmkv.set(RECORDING_MODE_KEY, mode);
    if (mode === 'basic' && aiDialog.isConnected) void aiDialog.disconnect();
  }, [cloudAIEnabled, hasCloudAiInfra, isSyncOnline, aiDialog]);

  return useMemo(() => ({
    state: {
      recordingHandle: recording.recordingHandle,
      isRecordingPaused: recording.isPaused,
      lastSavedId,
      currentAmplitude: recording.amplitude,
      currentQuestion: tts.currentQuestion,
      isSpeaking: tts.isSpeaking,
      words: tts.words,
      currentWordIndex: tts.currentWordIndex,
      isCurrentTopicAnswered,
      formattedDate,
      greeting,
      weather,
      weatherIcon: weatherIconName,
      storyCategoryTitle: getCategoryTitle(tts.currentQuestion?.category),
      activities,
      hasUnread,
      isOnline: isSyncOnline,
      recordingMode,
      isAiAvailable,
      canEnableAiMode,
      shouldRecommendAi: isAiAvailable && recordingMode === 'basic',
      cloudAIEnabled,
      cloudDialogMode: aiDialog.dialogMode,
      cloudNetworkQuality: aiDialog.networkQuality,
      isCloudDialogConnected: aiDialog.isConnected,
      cloudDialogError: aiDialog.error,
      transcripts: aiDialog.transcripts,
      recordingDurationSec: recording.durationSec,
      isStoppingRecording: recording.isStopping,
      isPauseTransitioning: recording.isTransitioning,
      isStartingRecording: recording.isStarting,
      isRecordAllowed: appRole !== 'family' && appRole !== 'listener',
    },
    actions: {
      setLastSavedId,
      handleStartRecording,
      handleStopRecording: recording.stop,
      handlePauseRecording: recording.pause,
      handleResumeRecording: recording.resume,
      setRecordingMode: setRecordingModeAndPersist,
      newTopic: tts.newTopic,
      replayQuestion: tts.replay,
      navigateToSettings: () => router.push(APP_ROUTES.SETTINGS),
      navigateToListen: () => router.push(APP_ROUTES.GALLERY),
      navigateToFamilyTab: () => router.replace(APP_ROUTES.FAMILY_TAB),
      navigateToStory: (id: string) => router.push(toStoryRoute(id)),
      navigateToEditTimeCapsule: (id: string) => router.push(`/story/${id}?editTimeCapsule=true`),
    },
  }), [
    recording, lastSavedId, tts, isCurrentTopicAnswered, formattedDate, greeting, 
    weather, weatherIconName, activities, hasUnread, isSyncOnline, recordingMode, 
    isAiAvailable, canEnableAiMode, cloudAIEnabled, aiDialog, appRole, 
    handleStartRecording, setRecordingModeAndPersist, router
  ]);
}
