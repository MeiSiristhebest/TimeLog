import {
  Participant,
  Room,
  RoomEvent,
  RemoteParticipant,
  ParticipantEvent,
  TrackPublication,
  TranscriptionSegment as LiveKitTranscriptionSegment,
} from 'livekit-client';
import { devLog } from '../devLogger';

export type LiveKitConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface TranscriptionSegment {
  id: string;
  text: string;
  speaker: 'user' | 'agent';
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
  startTimeMs?: number;
  endTimeMs?: number;
}

type LiveKitListener = (...args: unknown[]) => void;

/**
 * Enhanced LiveKit Client for Expo with strict typing.
 */
export class LiveKitClient {
  private room: Room;
  private listeners: Map<string, LiveKitListener[]> = new Map();

  constructor() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
  }

  onConnectionStateChange(callback: (state: LiveKitConnectionState) => void): () => void {
    const handleStateChange = () => {
      callback(this.room.state as LiveKitConnectionState);
    };

    this.room.on(RoomEvent.Connected, handleStateChange);
    this.room.on(RoomEvent.Reconnecting, handleStateChange);
    this.room.on(RoomEvent.Reconnected, handleStateChange);
    this.room.on(RoomEvent.Disconnected, handleStateChange);

    return () => {
      this.room.off(RoomEvent.Connected, handleStateChange);
      this.room.off(RoomEvent.Reconnecting, handleStateChange);
      this.room.off(RoomEvent.Reconnected, handleStateChange);
      this.room.off(RoomEvent.Disconnected, handleStateChange);
    };
  }

  onTranscription(callback: (segment: TranscriptionSegment) => void): () => void {
    const handleTranscription = (
      segments: LiveKitTranscriptionSegment[],
      participant?: Participant,
      _publication?: TrackPublication
    ) => {
      if (!participant) return;

      segments.forEach((seg) => {
        callback({
          id: seg.id,
          text: seg.text,
          speaker: participant.identity.includes('agent') ? 'agent' : 'user',
          isFinal: seg.final,
          timestamp: Date.now(),
          confidence: undefined, // LiveKit SDK segment might not have it directly
          startTimeMs: undefined,
          endTimeMs: undefined,
        });
      });
    };

    this.room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      this.room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }

  async connect(options: { url: string; token: string }): Promise<void> {
    await this.room.connect(options.url, options.token);
  }

  async disconnect(): Promise<void> {
    await this.room.disconnect();
  }

  destroy(): void {
    this.room.removeAllListeners();
  }

  getRemoteParticipantCount(): number {
    return this.room.remoteParticipants.size;
  }

  onParticipantConnected(callback: (participant: RemoteParticipant) => void): () => void {
    this.room.on(RoomEvent.ParticipantConnected, callback);
    return () => {
      this.room.off(RoomEvent.ParticipantConnected, callback);
    };
  }

  async startMicrophoneHardware(): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  async enableMicrophone(): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  async disableMicrophone(): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(false);
  }
}
