import React from 'react';
import { View, Text, Pressable } from 'react-native';

type ResumeRecordingPromptProps = {
  onResume: () => void;
  onDiscard: () => void;
};

/**
 * UI prompt for resuming a paused recording session.
 * Implements AC: 5 (Show resume prompt with Resume/Discard options)
 */
export const ResumeRecordingPrompt: React.FC<ResumeRecordingPromptProps> = ({
  onResume,
  onDiscard,
}) => {
  return (
    <View className="bg-white rounded-2xl p-6 shadow-lg mx-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Continue your recording?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        You have an unfinished recording. Would you like to continue?
      </Text>
      
      <View className="flex-row gap-3">
        <Pressable
          onPress={onDiscard}
          className="flex-1 bg-gray-100 rounded-xl py-4 items-center active:bg-gray-200"
        >
          <Text className="text-base font-semibold text-gray-700">
            Discard
          </Text>
        </Pressable>
        
        <Pressable
          onPress={onResume}
          className="flex-1 bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
        >
          <Text className="text-base font-semibold text-white">
            Resume Recording
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
