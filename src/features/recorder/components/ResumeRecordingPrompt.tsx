import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from '@/lib/i18n/useTranslation';

type ResumeRecordingPromptProps = {
  onResume: () => void;
  onDiscard: () => void;
};

/**
 * UI prompt for resuming a paused recording session.
 * Implements AC: 5 (Show resume prompt with Resume/Discard options)
 */
export function ResumeRecordingPrompt({
  onResume,
  onDiscard,
}: ResumeRecordingPromptProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <View className="mx-4 rounded-2xl bg-white p-6 shadow-lg">
      <AppText className="mb-2 text-2xl font-bold text-gray-900">
        {t('Recorder.resumePrompt.title', { defaultValue: 'Continue your recording?' })}
      </AppText>
      <AppText className="mb-6 text-base text-gray-600">
        {t('Recorder.resumePrompt.subtitle', { defaultValue: 'You have an unfinished recording. Would you like to continue?' })}
      </AppText>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onDiscard}
          className="flex-1 items-center rounded-xl bg-gray-100 py-4 active:bg-gray-200">
          <AppText className="text-base font-semibold text-gray-700">
            {t('Recorder.resumePrompt.discard', { defaultValue: 'Discard' })}
          </AppText>
        </Pressable>

        <Pressable
          onPress={onResume}
          className="flex-1 items-center rounded-xl bg-blue-600 py-4 active:bg-blue-700">
          <AppText className="text-base font-semibold text-white">
            {t('Recorder.resumePrompt.resume', { defaultValue: 'Resume Recording' })}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
