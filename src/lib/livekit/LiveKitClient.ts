/**
 * LiveKit Client
 * 
 * Wraps LiveKit Room connection, track management, and event handling.
 * Manages dual audio path: local recording (@siteed) + LiveKit streaming (mic).
 */

import { Room, RoomEvent, RemoteAudioTrack } from 'livekit-client';
import type { ConnectionQuality } from 'livekit-client';

export type LiveKitConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface LiveKitConfig {
  url: string;
  token: string;
}

export interface TranscriptionSegment {
  speaker: 'user' | 'agent';
  text: string;
  isFinal: boolean;
  timestamp: number;
}

type LiveKitListener = (...args: unknown[]) => void;

function isConnectionState(value: unknown): value is LiveKitConnectionState {
  return (
    value === 'disconnected' ||
    value === 'connecting' ||
    value === 'connected' ||
    value === 'reconnecting'
  );
}

export class LiveKitClient {
  private room: Room;
  private connectionState: LiveKitConnectionState = 'disconnected';
  private listeners: Map<string, Set<LiveKitListener>> = new Map();

  constructor() {
    this.room = new Room({
      // Optimize for voice (not video)
      adaptiveStream: true,
      dynacast: true,
      
      // Audio settings for elderly users
      audioCaptureDefaults: {
        autoGainControl: true,
        // Keep assistant voice audible in local story recordings (AI mode).
        // Echo cancellation can aggressively suppress speaker output from capture.
        echoCancellation: false,
        noiseSuppression: true,
      },
    });

    this.setupEventListeners();
  }

  /**
   * Connect to LiveKit room
   */
  async connect(config: LiveKitConfig): Promise<void> {
    this.connectionState = 'connecting';
    this.emit('connectionStateChange', this.connectionState);

    try {
      await this.room.connect(config.url, config.token);
      this.connectionState = 'connected';
      this.emit('connectionStateChange', this.connectionState);
    } catch (error) {
      this.connectionState = 'disconnected';
      this.emit('connectionStateChange', this.connectionState);
      throw error;
    }
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    await this.room.disconnect();
    this.connectionState = 'disconnected';
    this.emit('connectionStateChange', this.connectionState);
  }

  /**
   * Enable microphone (LiveKit streaming path)
   */
  async enableMicrophone(): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  /**
   * Disable microphone
   */
  async disableMicrophone(): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(false);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): LiveKitConnectionState {
    return this.connectionState;
  }

  /**
   * Get network quality
   */
  getNetworkQuality(): ConnectionQuality {
    return this.room.localParticipant.connectionQuality;
  }

  /**
   * Subscribe to agent audio output
   */
  onAgentAudio(callback: (track: RemoteAudioTrack) => void): () => void {
    const handler: LiveKitListener = (track) => {
      if (track instanceof RemoteAudioTrack) {
        callback(track);
      }
    };

    this.on('trackSubscribed', handler);
    
    return () => this.off('trackSubscribed', handler);
  }

  /**
   * Subscribe to remote participant join events.
   * In TimeLog rooms this effectively signals agent worker presence.
   */
  onParticipantConnected(callback: () => void): () => void {
    const handler: LiveKitListener = () => {
      callback();
    };

    this.on('participantConnected', handler);
    return () => this.off('participantConnected', handler);
  }

  /**
   * Current remote participant count.
   */
  getRemoteParticipantCount(): number {
    return this.room.remoteParticipants.size;
  }

  /**
   * Subscribe to transcription updates
   */
  onTranscription(callback: (segment: TranscriptionSegment) => void): () => void {
    const handler = (segments: any[], participant: any, publication: any) => {
      // LiveKit sends transcription as array of segments
      segments.forEach((seg: any) => {
        callback({
          speaker: participant.isLocal ? 'user' : 'agent',
          text: seg.text || '',
          isFinal: seg.final || false,
          timestamp: Date.now(),
        });
      });
    };

    this.room.on(RoomEvent.TranscriptionReceived, handler);

    return () => this.room.off(RoomEvent.TranscriptionReceived, handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: (state: LiveKitConnectionState) => void): () => void {
    const handler: LiveKitListener = (state) => {
      if (isConnectionState(state)) {
        callback(state);
      }
    };

    this.on('connectionStateChange', handler);
    return () => this.off('connectionStateChange', handler);
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      this.emit('trackSubscribed', track, publication, participant);
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      this.emit('participantConnected', participant);
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.connectionState = 'disconnected';
      this.emit('connectionStateChange', this.connectionState);
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this.connectionState = 'reconnecting';
      this.emit('connectionStateChange', this.connectionState);
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.connectionState = 'connected';
      this.emit('connectionStateChange', this.connectionState);
    });
  }

  /**
   * Generic event emitter
   */
  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  /**
   * Register event listener
   */
  private on(event: string, handler: LiveKitListener): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);
  }

  /**
   * Unregister event listener
   */
  private off(event: string, handler: LiveKitListener): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.room.removeAllListeners();
    this.listeners.clear();
  }
}
