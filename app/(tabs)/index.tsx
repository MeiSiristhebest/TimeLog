import { Link } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import {
  InsufficientStorageError,
  startRecordingStream,
  type RecordingHandle,
} from '@/features/recorder/services/recorderService';

export default function HomeTab() {
  const [recordingHandle, setRecordingHandle] = useState<RecordingHandle | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [silenceNotice, setSilenceNotice] = useState<string | null>(null);

  const handleStart = async () => {
    setIsBusy(true);
    try {
      setSilenceNotice(null);
      const handle = await startRecordingStream({
        onSilence: () => {
          setSilenceNotice('Silence detected, but still recording. Keep speaking.');
        },
      });
      setRecordingHandle(handle);
      setLastSaved(null);
    } catch (error) {
      if (error instanceof InsufficientStorageError) {
        Alert.alert('Insufficient Storage', error.message);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to start recording. Please try again.';
        Alert.alert('Recording Failed', message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    if (!recordingHandle) return;
    setIsBusy(true);
    try {
      const finalized = await recordingHandle.stop();
      setLastSaved(finalized.filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop recording. Please try again.';
      Alert.alert('Stop Failed', message);
    } finally {
      setRecordingHandle(null);
      setSilenceNotice(null);
      setIsBusy(false);
    }
  };

  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-headline font-bold text-onSurface">Recorder Home</Text>
        <Text className="text-center text-body text-onSurface">
          Voice-first recording lives here. Use the tabs below to explore the app shell.
        </Text>
        <Link href={{ pathname: '/details', params: { name: 'Dan' } }} asChild>
          <Button title="Show Details" />
        </Link>

        <View className="w-full max-w-md gap-3 rounded-2xl border border-primary/20 bg-white/80 p-4 shadow-sm">
          <Text className="text-body font-semibold text-onSurface">Quick Record (WAV)</Text>
          <View className="flex-row gap-3">
            <Button
              title={recordingHandle ? 'Recording…' : 'Start Recording'}
              onPress={handleStart}
              disabled={!!recordingHandle || isBusy}
              className="flex-1"
            />
            <Button
              title="Stop"
              onPress={handleStop}
              disabled={!recordingHandle || isBusy}
              className="flex-1 bg-error/80"
            />
          </View>
          {lastSaved ? (
            <Text className="text-body text-success">Saved: {lastSaved}</Text>
          ) : (
            <Text className="text-body text-onSurface/60">
              {recordingHandle ? 'Recording in progress…' : 'Tap start to record WAV to disk.'}
            </Text>
          )}
          {recordingHandle && silenceNotice ? (
            <Text className="text-body text-onSurface/80">{silenceNotice}</Text>
          ) : null}
        </View>
      </View>
    </Container>
  );
}
