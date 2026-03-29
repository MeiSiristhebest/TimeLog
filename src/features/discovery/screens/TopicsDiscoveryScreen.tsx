import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHeritageTheme } from '@/theme/heritage';
import { useDiscoveryLogic } from '@/features/discovery/hooks/useDiscoveryLogic';
import { CategoryFilter } from '@/features/discovery/components/CategoryFilter';
import { AppText } from '@/components/ui/AppText';
import { Image } from 'expo-image';
import { Pressable, View, ScrollView, TextInput } from 'react-native';
import { useIsTopicAnswered } from '@/features/recorder/hooks/useAnsweredTopics';
import {
  DISCOVERY_STRINGS,
  MOCK_FAMILY_REQUEST,
} from '@/features/discovery/data/mockDiscoveryData';

// Paper texture asset - could typically be moved to a shared asset constant but acceptable here or via theme
const PAPER_TEXTURE = require('../../../../assets/images/paper-texture.png');

export default function TopicsDiscoveryScreen() {
  const { colors } = useHeritageTheme();
  const pressedOverlayColor = `${colors.onSurface}0D`;
  const goldBadgeBackground = `${colors.warning}14`;
  const goldBadgeBorder = `${colors.warning}33`;
  const goldBadgeShadow = `${colors.warning}66`;
  const goldBadgeText = colors.warning;
  const helperTextColor = colors.textMuted;
  const answeredBadgeBackground = `${colors.success}1F`;

  // Logic Separation
  const { state, actions } = useDiscoveryLogic();
  const { currentCard, animatedCardStyle, meta, selectedCategories } = state;
  const isTopicAnswered = useIsTopicAnswered(currentCard?.id);
  const isFamilyTopic =
    !!currentCard &&
    (currentCard.category === 'family_history' ||
      currentCard.category === 'family' ||
      currentCard.tags?.includes('family'));

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.surfaceDim }}
      edges={['top']}>
      {/* 1. Header (Simple) */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={actions.goBack}
          className="p-2 rounded-full"
          style={({ pressed }) => [
            { backgroundColor: pressed ? pressedOverlayColor : 'transparent' },
          ]}>
          <Ionicons name="arrow-back" size={28} color={colors.textMuted} />
        </Pressable>
        <AppText variant="title" className="font-serif" style={{ color: colors.onSurface }}>
          {DISCOVERY_STRINGS.header.title}
        </AppText>
        <Pressable className="p-2 rounded-full">
          <Ionicons name="settings-outline" size={28} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* 1.5 Category Filter */}
      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoryToggle={actions.handleCategoryToggle}
      />

      {/* 2. Main Card Deck */}
      <View className="flex-1 items-center justify-center p-6 pb-10">
        <Animated.View
          className="w-full flex-1 max-h-[500px] max-w-[400px] shadow-lg"
          style={[{ shadowColor: colors.shadowNeutral }, animatedCardStyle]}>
          {/* Paper Card */}
          <View
            className="flex-1 rounded-[32px] border p-8 items-center justify-between overflow-hidden"
            style={[
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.onSurface}0D`,
              },
            ]}>
            {/* Texture Overlay */}
            <Image source={PAPER_TEXTURE} className="absolute inset-0 opacity-40" contentFit="cover" />

            {/* Top: Icon */}
            <View className="w-full items-center mt-[-8px]">
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                <Ionicons
                  name={meta.icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={meta.color}
                />
              </View>
            </View>

            {/* Middle: Content */}
            <ScrollView
              className="flex-1 w-full"
              contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, width: '100%', gap: 24 }}
              showsVerticalScrollIndicator={false}>
              {/* Gold Badge */}
              {isFamilyTopic ? (
                <View
                  className="flex-row items-center border rounded-full pl-1 pr-4 py-1 shadow-sm gap-2"
                  style={[
                    {
                      backgroundColor: goldBadgeBackground,
                      borderColor: goldBadgeBorder,
                      shadowColor: goldBadgeShadow,
                    },
                  ]}>
                  {MOCK_FAMILY_REQUEST.avatar ? (
                    <Image
                      source={{ uri: MOCK_FAMILY_REQUEST.avatar }}
                      className="w-8 h-8 rounded-full border-[1.5px]"
                      style={{ borderColor: colors.surface }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="w-8 h-8 rounded-full border-[1.5px] items-center justify-center"
                      style={{ borderColor: colors.surface, backgroundColor: `${colors.warning}24` }}>
                      <Ionicons name="people" size={16} color={goldBadgeText} />
                    </View>
                  )}
                  <AppText className="text-[13px] font-bold tracking-widest uppercase" style={{ color: goldBadgeText }}>
                    {DISCOVERY_STRINGS.card.badge}
                  </AppText>
                </View>
              ) : null}

              {/* Question */}
              <AppText variant="headline" className="font-serif text-center leading-10" style={{ color: colors.onSurface }}>
                {currentCard?.text ?? 'No topics found for selected categories'}
              </AppText>

              {/* Helper Text */}
              <AppText variant="title" className="text-center max-w-[280px]" style={{ color: helperTextColor }}>
                {DISCOVERY_STRINGS.card.helperText}
              </AppText>

              {isTopicAnswered ? (
                <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: answeredBadgeBackground }}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <AppText className="text-[13px] font-bold" style={{ color: colors.success }}>
                    Answered
                  </AppText>
                </View>
              ) : null}
            </ScrollView>

            {/* Bottom Decor */}
            <View className="w-12 h-1.5 rounded-sm opacity-50 mt-4" style={{ backgroundColor: colors.border }} />
          </View>
        </Animated.View>
      </View>

      {/* 3. Actions */}
      <View className="px-6 pb-4 gap-3" style={{ backgroundColor: colors.surfaceDim }}>
        {/* Primary Record Button */}
        <DiscoveryButton
          onPress={actions.handleSelectTopic}
          variant="primary"
          icon="mic"
          label={DISCOVERY_STRINGS.actions.recordAnswer}
          disabled={!currentCard}
        />

        {/* Secondary Try Another */}
        <DiscoveryButton
          onPress={actions.handleNextCard}
          variant="secondary"
          label={DISCOVERY_STRINGS.actions.tryAnother}
          disabled={!currentCard}
        />
      </View>
    </SafeAreaView>
  );
}

// Interactive Button Component with Spring Physics
function DiscoveryButton({
  onPress,
  variant,
  label,
  icon,
  disabled = false,
}: {
  onPress: () => void;
  variant: 'primary' | 'secondary';
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(variant === 'primary' ? 0.96 : 0.98, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  // Styles based on variant
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Animated.View
        className={isPrimary 
          ? "h-16 rounded-[32px] flex-row items-center justify-center shadow-lg" 
          : "h-12 rounded-3xl items-center justify-center border-2 border-transparent"}
        style={[
          isPrimary
            ? { backgroundColor: colors.primary, shadowColor: colors.primary }
            : null,
          disabled ? { opacity: 0.5 } : null,
          animatedStyle,
        ]}>
        {icon && <Ionicons name={icon} size={26} color={colors.onPrimary} className="mr-2" />}
        <AppText
          className={isPrimary 
            ? "text-xl font-bold tracking-tight" 
            : "text-base font-semibold"}
          style={
            isPrimary
              ? { color: colors.onPrimary }
              : { color: colors.textMuted }
          }>
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}
