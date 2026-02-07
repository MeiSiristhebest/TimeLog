/**
 * Live Transcript Panel
 * 
 * Displays real-time transcription from AI dialog.
 * - User speech in left-aligned bubbles
 * - Agent speech in right-aligned bubbles
 * - Auto-scroll to latest segment
 * - Large text for elderly users (24pt minimum)
 * 
 * Accessibility: High contrast, dynamic type support, VoiceOver compatible
 */

import React, { useEffect, useRef } from 'react';
import { useHeritageTheme } from '@/theme/heritage';
import type { TranscriptionSegment } from '@/lib/livekit/LiveKitClient';
import { View, Text, ScrollView } from 'react-native';

export interface LiveTranscriptPanelProps {
  segments: TranscriptionSegment[];
  maxHeight?: number;
}

export function LiveTranscriptPanel({ segments, maxHeight = 300 }: LiveTranscriptPanelProps) {
  const theme = useHeritageTheme();
  const { colors } = theme;
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to latest segment
  useEffect(() => {
    if (segments.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [segments]);

  if (segments.length === 0) {
    return (
      <View
        className="items-center justify-center rounded-2xl p-6"
        style={{
          backgroundColor: colors.surfaceAccent,
          minHeight: 120,
        }}
      >
        <Text
          className="text-center text-lg"
          style={{ color: colors.textMuted }}
          maxFontSizeMultiplier={1.5}
        >
          等待对话开始...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      className="rounded-2xl p-4"
      style={{
        backgroundColor: colors.surfaceAccent,
        maxHeight,
      }}
      contentContainerStyle={{ gap: 12 }}
      showsVerticalScrollIndicator
      accessible
      accessibilityLabel="Live transcript"
      accessibilityRole="scrollbar"
    >
      {segments.map((segment, index) => (
        <TranscriptBubble
          key={`${segment.timestamp}-${index}`}
          segment={segment}
        />
      ))}
    </ScrollView>
  );
}

interface TranscriptBubbleProps {
  segment: TranscriptionSegment;
}

const TranscriptBubble = React.memo(function TranscriptBubble({ segment }: TranscriptBubbleProps) {
  const theme = useHeritageTheme();
  const { colors } = theme;

  const isUser = segment.speaker === 'user';

  return (
    <View
      className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'self-start' : 'self-end'}`}
      style={{
        backgroundColor: isUser ? colors.surfaceCard : colors.primary,
      }}
      accessible
      accessibilityLabel={`${isUser ? 'You said' : 'AI responded'}: ${segment.text}`}
      accessibilityRole="text"
    >
      {/* Speaker label */}
      <Text
        className="mb-1 text-xs font-semibold uppercase"
        style={{
          color: isUser ? colors.textMuted : colors.onPrimary,
          opacity: 0.7,
        }}
        maxFontSizeMultiplier={1.3}
      >
        {isUser ? '您' : 'AI'}
      </Text>

      {/* Transcript text */}
      <Text
        className="text-xl leading-relaxed"
        style={{
          color: isUser ? colors.onSurface : colors.onPrimary,
        }}
        maxFontSizeMultiplier={1.5}
      >
        {segment.text}
        {!segment.isFinal && (
          <Text style={{ opacity: 0.5 }}> ...</Text>
        )}
      </Text>

      {/* Timestamp */}
      <Text
        className="mt-1 text-xs"
        style={{
          color: isUser ? colors.textMuted : colors.onPrimary,
          opacity: 0.6,
        }}
        maxFontSizeMultiplier={1.2}
      >
        {new Date(segment.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
});
