import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { useRoleLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';
import { AppText } from '@/components/ui/AppText';
import { StyleSheet } from 'react-native';
import { View, Pressable, ScrollView } from 'react-native';

export default function RoleScreen(): JSX.Element {
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
        style={[
          styles.container,
          { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
        ]}>
        <AppText style={{ fontSize: 16, color: colors.textMuted }}>{STRINGS.loading}</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.backAccessibility}>
          <Ionicons name="arrow-back" size={28} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.titleContainer}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>{STRINGS.title}</AppText>
        </Animated.View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Storyteller Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ width: '100%' }}>
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
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
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
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          animatedStyle,
        ]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={84} color={colors.primary} />
        </View>
        <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>{title}</AppText>
        <AppText style={[styles.cardSubtitle, { color: colors.textMuted }]}>{subtitle}</AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: PALETTE.overlayLight,
  },
  backButtonPressed: {
    backgroundColor: PALETTE.overlayMedium,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  titleContainer: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 42,
    lineHeight: 48, // Tight leading
    letterSpacing: -0.5,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    width: '100%',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderRadius: 20, // Approx 'xl' in tailwind
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow isn't on the original request but makes it pop slightly in RN
    shadowColor: PALETTE.shadowNeutral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 24,
    // Add optional hover/scale effect logic here if using Reanimated,
    // but simple press scale on parent is usually enough for native feels.
  },
  cardTitle: {
    fontSize: 24, // 3xl approx
    fontFamily: 'Fraunces_600SemiBold',
    fontWeight: 'normal',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '500',
    textAlign: 'center',
  },
});
