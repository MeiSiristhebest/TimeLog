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
import { useAuthStore } from '@/features/auth/store/authStore';

export interface UseLiveKitDialogOptions {
  storyId: string;
  onModeChange?: (mode: DialogMode) => void;
  onNetworkQualityChange?: (quality: NetworkQuality) => void;
  onError?: (error: Error) => void;
}

export interface UseLiveKitDialogReturn {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  connectionState: LiveKitConnectionState;
  skip: () => void;
  continueDialog: () => void;
  dialogMode: DialogMode;
  networkQuality: NetworkQuality | null;
  networkMetrics: NetworkMetrics | null;
  transcripts: TranscriptionSegment[];
  error: Error | null;
}

export function useLiveKitDialog(options: UseLiveKitDialogOptions): UseLiveKitDialogReturn {
  const { storyId, onModeChange, onNetworkQualityChange, onError } = options;
  
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

  const connect = useCallback(async () => {
    if (!sessionUserId) {
      const err = new Error('User not authenticated');
      setError(err);
      onError?.(err);
      return;
    }

    try {
      setError(null);

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

      // Setup network monitor
      networkService.onQualityChange((metrics) => {
        setNetworkQuality(metrics.quality);
        setNetworkMetrics(metrics);
        onNetworkQualityChange?.(metrics.quality);
      });
      networkService.start();

      // Fetch LiveKit token
      const roomName = `story_${storyId}`;
      const tokenData = await livekitTokenService.fetchToken({
        roomName,
        identity: sessionUserId,
      });

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
        void transcriptSyncService.saveSegment(storyId, segment, segmentIndex++);

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

      // Enable microphone
      await client.enableMicrophone();
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
    }
  }, [storyId, sessionUserId, onModeChange, onNetworkQualityChange, onError]);

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
    dialogMode,
    networkQuality,
    networkMetrics,
    transcripts,
    error,
  };
}
