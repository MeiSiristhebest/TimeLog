import { Animated } from '@/tw/animated';
import { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { useRoleLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';
import { AppText } from '@/components/ui/AppText';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';

export default function RoleScreen() {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions, constants } = useRoleLogic();
  const { loading } = state;
  const { handleSelect, handleBack } = actions;
  const { ROLE_STORYTELLER, ROLE_FAMILY } = constants;
  const STRINGS = AUTH_STRINGS.role;

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.surface }}>
        <View className="w-[72%] items-center gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: `${colors.primary}14` }}>
            <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
          </View>
          <AppText
            variant="title"
            className="font-semibold"
            style={{ color: colors.onSurface }}>
            {STRINGS.loading}
          </AppText>
          <View className="w-full gap-2.5">
            <HeritageSkeleton variant="text" width="100%" />
            <HeritageSkeleton variant="text" width="84%" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      {/* Header with Back Button */}
      <View className="px-6 pt-4 pb-2">
        <Pressable
          onPress={handleBack}
          className="w-12 h-12 items-center justify-center rounded-full active:opacity-70"
          style={({ pressed }) => ({
            backgroundColor: pressed ? PALETTE.overlayMedium : PALETTE.overlayLight,
          })}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.backAccessibility}>
          <Ionicons name="arrow-back" size={28} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}>
        {/* Title Section */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="px-8 pt-2 pb-8">
          <AppText
            className="font-serif text-[42px] leading-[48px] -tracking-[0.5px]"
            style={{ color: colors.onSurface }}>
            {STRINGS.title}
          </AppText>
        </Animated.View>

        {/* Role Cards */}
        <View className="px-6 gap-4">
          {/* Storyteller Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} className="w-full">
            <RoleCard
              title={STRINGS.storyteller.title}
              subtitle={STRINGS.storyteller.subtitle}
              icon="mic"
              onPress={() => handleSelect(ROLE_STORYTELLER)}
              accessibilityLabel={STRINGS.storyteller.accessibilityLabel}
              baseDelay={200}
            />
          </Animated.View>

          {/* Listener Card */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} className="w-full">
            <RoleCard
              title={STRINGS.listener.title}
              subtitle={STRINGS.listener.subtitle}
              icon="headset"
              onPress={() => handleSelect(ROLE_FAMILY)}
              accessibilityLabel={STRINGS.listener.accessibilityLabel}
              baseDelay={400}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Extracted Card Component for cleaner animation logic
function RoleCard({
  title,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  baseDelay: number;
}) {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Animated.View
        className="w-full py-12 px-6 border-2 rounded-[20px] items-center justify-center shadow-sm"
        style={[
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: PALETTE.shadowNeutral,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          },
          animatedStyle,
        ]}>
        <View className="mb-6">
          <Ionicons name={icon} size={84} color={colors.primary} />
        </View>
        <AppText
          className="text-2xl font-serif text-center mb-2 -tracking-[0.5px]"
          style={{ color: colors.onSurface }}>
          {title}
        </AppText>
        <AppText
          className="text-lg font-medium text-center"
          style={{ color: colors.textMuted }}>
          {subtitle}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

