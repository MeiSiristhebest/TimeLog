/**
 * useLiveKitDialog Hook
 * 
 * Comprehensive React Hook for managing LiveKit AI dialog session.
 * Integrates all services: LiveKit, Orchestrator, Network Monitor, Transcript Sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveKitClient, TranscriptionSegment, LiveKitConnectionState } from '@/lib/livekit/LiveKitClient';
import { livekitTokenService } from '@/lib/livekit/LiveKitTokenService';
import { startAudioSession, stopAudioSession } from '@/lib/livekit/audioSession';
import { AiDialogOrchestrator, DialogMode } from '@/features/recorder/services/AiDialogOrchestrator';
import { NetworkQualityService, NetworkQuality, NetworkMetrics } from '@/features/recorder/services/NetworkQualityService';
import { transcriptSyncService } from '@/features/recorder/services/TranscriptSyncService';
import { playOfflineCue } from '@/features/recorder/services/soundCueService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getCurrentUserId } from '@/features/auth/services/sessionService';
import { devLog } from '@/lib/devLogger';

const AGENT_PARTICIPANT_TIMEOUT_MS = 2500;

export interface UseLiveKitDialogOptions {
  storyId?: string;
  topicText?: string;
  language?: string;
  onModeChange?: (mode: DialogMode) => void;
  onNetworkQualityChange?: (quality: NetworkQuality) => void;
  onError?: (error: Error) => void;
}

export interface UseLiveKitDialogReturn {
  connect: (storyIdOverride?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  connectionState: LiveKitConnectionState;
  skip: () => void;
  continueDialog: () => void;
  startWaitingForAiResponse: () => void;
  dialogMode: DialogMode;
  networkQuality: NetworkQuality | null;
  networkMetrics: NetworkMetrics | null;
  transcripts: TranscriptionSegment[];
  error: Error | null;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
}

export function useLiveKitDialog(options: UseLiveKitDialogOptions): UseLiveKitDialogReturn {
  const { storyId, topicText, language, onModeChange, onNetworkQualityChange, onError } = options;

  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  const clientRef = useRef<LiveKitClient | null>(null);
  const orchestratorRef = useRef<AiDialogOrchestrator | null>(null);
  const networkServiceRef = useRef<NetworkQualityService | null>(null);

  const [connectionState, setConnectionState] = useState<LiveKitConnectionState>('disconnected');
  const [dialogMode, setDialogMode] = useState<DialogMode>('DIALOG');
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const resolveIdentity = useCallback(async (): Promise<string> => {
    if (sessionUserId) {
      return sessionUserId;
    }

    const fallbackUserId = await getCurrentUserId();
    if (fallbackUserId) {
      return fallbackUserId;
    }

    const err = new Error('User not authenticated');
    setError(err);
    onError?.(err);
    throw err;
  }, [sessionUserId, onError]);

  const waitForAgentPresence = useCallback((client: LiveKitClient): Promise<void> => {
    if (client.getRemoteParticipantCount() > 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        unsubscribe?.();
      };

      unsubscribe = client.onParticipantConnected(() => {
        cleanup();
        resolve();
      });

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('AI agent worker is not available'));
      }, AGENT_PARTICIPANT_TIMEOUT_MS);
    });
  }, []);

  const connect = useCallback(async (storyIdOverride?: string) => {
    const resolvedStoryId = storyIdOverride ?? storyId;
    devLog.info(`[useLiveKitDialog] Connecting session for StoryId: ${resolvedStoryId}`);
    if (!resolvedStoryId) {
      const err = new Error('Missing story id for LiveKit dialog session');
      setError(err);
      onError?.(err);
      throw err;
    }

    try {
      // Safety: Ensure any existing connection is closed before starting a new one
      await disconnect();

      setError(null);
      setTranscripts([]);
      const identity = await resolveIdentity();

      // Start audio session
      await startAudioSession();

      // Initialize services
      const orchestrator = new AiDialogOrchestrator();
      const networkService = new NetworkQualityService();

      orchestratorRef.current = orchestrator;
      networkServiceRef.current = networkService;

      // Setup orchestrator listeners
      orchestrator.onModeChange((event) => {
        setDialogMode(event.newMode);
        onModeChange?.(event.newMode);
      });

      orchestrator.onTimeout(() => {
        void playOfflineCue();
      });

      // Setup network monitor
      networkService.onQualityChange((metrics) => {
        setNetworkQuality(metrics.quality);
        setNetworkMetrics(metrics);
        onNetworkQualityChange?.(metrics.quality);

        if (metrics.quality === 'OFFLINE' || metrics.quality === 'POOR') {
          orchestrator.setMode('DEGRADED', `Network quality ${metrics.quality.toLowerCase()}`);
          return;
        }

        if (
          (metrics.quality === 'EXCELLENT' || metrics.quality === 'GOOD') &&
          orchestrator.getState().mode === 'DEGRADED'
        ) {
          orchestrator.setMode('DIALOG', 'Network quality recovered');
        }
      });
      networkService.start();

      // Fetch LiveKit token
      const roomName = `story_${resolvedStoryId}`;
      devLog.info(`[useLiveKitDialog] Fetching token for room: ${roomName}`);
      const tokenData = await livekitTokenService.fetchToken({
        roomName,
        identity,
        storyId: resolvedStoryId,
        topicText,
        language,
      });
      devLog.info('[useLiveKitDialog] Token fetched, connecting client...');

      // Create and connect LiveKit client
      const client = new LiveKitClient();
      clientRef.current = client;

      // Setup connection state listener
      client.onConnectionStateChange((state) => {
        setConnectionState(state);
      });

      // Setup transcription listener
      let segmentIndex = 0;
      client.onTranscription((segment) => {
        setTranscripts((prev) => [...prev, segment]);

        // Save to SQLite
        void transcriptSyncService.saveSegment(resolvedStoryId, segment, segmentIndex++);

        // Handle AI response timing
        if (segment.speaker === 'agent' && segment.isFinal) {
          orchestrator.handleAiResponse();
        } else if (segment.speaker === 'user' && segment.isFinal) {
          orchestrator.startWaitingForResponse();
        }
      });

      // Connect to room
      await client.connect({
        url: tokenData.url,
        token: tokenData.token,
      });

      // Initialize microphone hardware (only once per session)
      await client.startMicrophoneHardware();

      devLog.info('[useLiveKitDialog] Waiting for AI agent presence...');
      // Hard gate: room connected but no remote worker means AI is unavailable.
      await waitForAgentPresence(client);
      devLog.info('[useLiveKitDialog] AI agent presence confirmed, session ready');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error);
      onError?.(error);

      // Cleanup on error
      if (clientRef.current) {
        await clientRef.current.disconnect();
        clientRef.current.destroy();
        clientRef.current = null;
      }
      if (orchestratorRef.current) {
        orchestratorRef.current.destroy();
        orchestratorRef.current = null;
      }
      if (networkServiceRef.current) {
        networkServiceRef.current.destroy();
        networkServiceRef.current = null;
      }
      await stopAudioSession();
      throw error;
    }
  }, [
    storyId,
    topicText,
    language,
    resolveIdentity,
    onModeChange,
    onNetworkQualityChange,
    onError,
    waitForAgentPresence,
  ]);

  const disconnect = useCallback(async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.disconnect();
        clientRef.current.destroy();
        clientRef.current = null;
      }

      if (orchestratorRef.current) {
        orchestratorRef.current.destroy();
        orchestratorRef.current = null;
      }

      if (networkServiceRef.current) {
        networkServiceRef.current.destroy();
        networkServiceRef.current = null;
      }

      await stopAudioSession();
      setConnectionState('disconnected');
      setDialogMode('DIALOG');
      setNetworkQuality(null);
      setNetworkMetrics(null);
      setTranscripts([]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disconnect');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  const skip = useCallback(() => {
    orchestratorRef.current?.handleSkip();
  }, []);

  const continueDialog = useCallback(() => {
    orchestratorRef.current?.handleContinue();
  }, []);

  const startWaitingForAiResponse = useCallback(() => {
    orchestratorRef.current?.startWaitingForResponse();
  }, []);

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    if (!clientRef.current) {
      devLog.warn('[useLiveKitDialog] Cannot set mic: client not initialized');
      return;
    }
    devLog.info(`[useLiveKitDialog] Setting microphone enabled: ${enabled}`);
    if (enabled) {
      await clientRef.current.enableMicrophone();
    } else {
      await clientRef.current.disableMicrophone();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected: connectionState === 'connected',
    connectionState,
    skip,
    continueDialog,
    startWaitingForAiResponse,
    dialogMode,
    networkQuality,
    networkMetrics,
    transcripts,
    error,
    setMicrophoneEnabled,
  };
}
