import React from 'react';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import {
  DEFAULT_FONT_SCALE_INDEX,
  FONT_SCALE_LABELS,
  FONT_SCALE_STEPS,
  useHeritageTheme,
} from '@/theme/heritage';
import { useDisplaySettingsLogic } from '../hooks/useSettingsLogic';
import { useProfile } from '../hooks/useProfile';

export function FontSizeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHeritageTheme();
  const { state, actions } = useDisplaySettingsLogic();
  const { updateProfileData } = useProfile();
  const { fontScaleIndex } = state;
  const [previewIndex, setPreviewIndex] = React.useState(fontScaleIndex);

  React.useEffect(() => {
    setPreviewIndex(fontScaleIndex);
  }, [fontScaleIndex]);

  const palette = {
    bg: colors.surfaceDim,
    surface: colors.surfaceCard,
    sentBubble: colors.success,
    receivedBubble: colors.surfaceCard,
    textPrimary: colors.onSurface,
    textSecondary: colors.textMuted,
    divider: colors.border,
    sliderTrack: colors.handle,
    tick: colors.handle,
    accent: colors.success,
    buttonText: colors.onPrimary,
    sentText: colors.onPrimary,
    avatarBackground: `${colors.onSurface}20`,
    thumb: isDark ? colors.handleActive : colors.surfaceCard,
  } as const;

  const messages = [
    { id: 1, type: 'sent' as const, text: 'Preview your font size' },
    { id: 2, type: 'received' as const, text: 'Drag the slider below to adjust text size.' },
    {
      id: 3,
      type: 'received' as const,
      text: 'This changes reading and chat text size across the app instantly.',
    },
  ];

  const maxIndex = FONT_SCALE_LABELS.length - 1;
  const clampIndex = (index: number): number => {
    return Math.max(0, Math.min(maxIndex, Math.round(index)));
  };

  const currentLabel =
    FONT_SCALE_LABELS[previewIndex] ?? FONT_SCALE_LABELS[DEFAULT_FONT_SCALE_INDEX];
  const currentPreviewScale =
    FONT_SCALE_STEPS[previewIndex] ?? FONT_SCALE_STEPS[DEFAULT_FONT_SCALE_INDEX];
  const previewBodySize = Math.round(16 * currentPreviewScale);
  const previewBodyLineHeight = Math.round(26 * currentPreviewScale);
  const previewTitleSize = Math.round(17 * currentPreviewScale);
  const headerTitleSize = Math.max(18, Math.round(18 * currentPreviewScale));
  const headerButtonSize = Math.max(12, Math.round(14 * currentPreviewScale));
  const helperSize = Math.max(13, Math.round(15 * currentPreviewScale));
  const leftLabelSize = Math.max(12, Math.round(13 * currentPreviewScale));
  const rightLabelSize = Math.max(24, Math.round(28 * currentPreviewScale));
  const previewIconSize = Math.max(16, Math.round(18 * currentPreviewScale));
  const previewAvatarIconSize = Math.max(18, Math.round(20 * currentPreviewScale));

  const handleDone = async () => {
    const next = clampIndex(previewIndex);
    actions.setFontScaleIndex(next);
    await updateProfileData({ fontScaleIndex: next });
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bg }}>
      <View
        className="px-4 pb-3 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 10 }}>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full">
          <Ionicons name="chevron-back" size={22} color={palette.textPrimary} />
        </Pressable>

        <Text style={{ color: palette.textPrimary, fontSize: headerTitleSize, fontWeight: '500' }}>
          Font Size
        </Text>

        <Pressable
          onPress={handleDone}
          className="px-4 h-8 rounded items-center justify-center"
          style={{ backgroundColor: palette.accent }}>
          <Text style={{ fontSize: headerButtonSize, color: palette.buttonText, fontWeight: '500' }}>
            Done
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            gap: 14,
          }}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`flex-row ${msg.type === 'sent' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.type === 'received' ? (
                <View
                  className="rounded items-center justify-center"
                  style={{
                    width: Math.round(40 * currentPreviewScale),
                    height: Math.round(40 * currentPreviewScale),
                    backgroundColor: palette.accent,
                  }}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={previewIconSize}
                    color={palette.buttonText}
                  />
                </View>
              ) : null}

              <View
                className="max-w-[75%] px-4 py-3 rounded-md"
                style={{
                  backgroundColor:
                    msg.type === 'sent' ? palette.sentBubble : palette.receivedBubble,
                }}>
                {msg.type === 'sent' ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: -6,
                      width: 0,
                      height: 0,
                      borderTopWidth: 6,
                      borderBottomWidth: 6,
                      borderLeftWidth: 6,
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderLeftColor: palette.sentBubble,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: -6,
                      width: 0,
                      height: 0,
                      borderTopWidth: 6,
                      borderBottomWidth: 6,
                      borderRightWidth: 6,
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderRightColor: palette.receivedBubble,
                    }}
                  />
                )}
                <Text
                  style={{
                    color: msg.type === 'sent' ? palette.sentText : palette.textPrimary,
                    fontSize: previewBodySize,
                    lineHeight: previewBodyLineHeight,
                    fontWeight: msg.type === 'sent' ? '500' : '400',
                  }}>
                  {msg.text}
                </Text>
              </View>

              {msg.type === 'sent' ? (
                <View
                  className="rounded items-center justify-center"
                  style={{
                    width: Math.round(40 * currentPreviewScale),
                    height: Math.round(40 * currentPreviewScale),
                    backgroundColor: palette.avatarBackground,
                  }}>
                  <Ionicons name="person" size={previewAvatarIconSize} color={palette.buttonText} />
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </View>

      <View
        className="px-6 pt-4 pb-8 border-t"
        style={{
          backgroundColor: palette.surface,
          borderTopColor: palette.divider,
        }}>
        <View className="flex-row justify-between items-end mb-3 px-2">
          <Text style={{ color: palette.textPrimary, fontSize: leftLabelSize }}>
            A
          </Text>
          <Text style={{ color: palette.textPrimary, fontSize: previewTitleSize }}>
            {currentLabel}
          </Text>
          <Text style={{ color: palette.textPrimary, fontSize: rightLabelSize }}>
            A
          </Text>
        </View>

        <View className="relative h-10 justify-center">
          <View className="absolute left-[14px] right-[14px] flex-row justify-between">
            {Array.from({ length: FONT_SCALE_LABELS.length }).map((_, index) => (
              <View
                key={index}
                className="w-[1px] h-[8px]"
                style={{ backgroundColor: palette.tick }}
              />
            ))}
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            value={previewIndex}
            minimumValue={0}
            maximumValue={maxIndex}
            step={1}
            onValueChange={(value) => {
              setPreviewIndex(clampIndex(value));
            }}
            onSlidingComplete={(value) => {
              const next = clampIndex(value);
              actions.setFontScaleIndex(next);
              setPreviewIndex(next);
              void updateProfileData({ fontScaleIndex: next });
            }}
            minimumTrackTintColor={palette.sliderTrack}
            maximumTrackTintColor={palette.sliderTrack}
            thumbTintColor={palette.thumb}
          />
        </View>

        <Text
          style={{ color: palette.textSecondary, fontSize: helperSize, textAlign: 'center', marginTop: 12 }}>
          Changes apply immediately to reading and chat text.
        </Text>
      </View>
    </View>
  );
}
