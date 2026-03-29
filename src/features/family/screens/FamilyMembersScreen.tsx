/**
 * Family Members Screen
 *
 * Displays list of connected family members with management options.
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  View,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { FAMILY_STRINGS, FamilyMemberMock } from '@/features/family/data/mockFamilyData';
import { useFamilyMembersLogic } from '@/features/family/hooks/useFamilyLogic';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useRouter } from 'expo-router';
import { APP_ROUTES, toUpgradeAccountRoute } from '@/features/app/navigation/routes';

type SpringPressableProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function SpringPressable({
  children,
  onPress,
  style,
  ...props
}: SpringPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  return (
    <Animated.Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...props}>
      {children}
    </Animated.Pressable>
  );
}

function MemberCard({
  member,
  onRemove,
}: {
  member: FamilyMemberMock;
  onRemove: (id: string, name: string) => void;
}) {
  const theme = useHeritageTheme();

  return (
    <View
      className="flex-row items-center justify-between rounded-2xl border p-4 mb-3"
      style={[
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceCard },
      ]}>
      <View className="flex-row items-center flex-1 gap-3">
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} className="w-12 h-12 rounded-full" contentFit="cover" />
        ) : (
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}>
            <AppText className="text-xl font-semibold" style={{ color: theme.colors.primary }}>
              {member.name.charAt(0)}
            </AppText>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="text-[17px] font-semibold" style={{ color: theme.colors.onSurface }}>
              {member.name}
            </AppText>
            {member.role === 'admin' && (
              <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <AppText className="text-[11px] font-semibold" style={{ color: theme.colors.primary }}>
                  {FAMILY_STRINGS.familyMembers.adminBadge}
                </AppText>
              </View>
            )}
          </View>
          <AppText className="text-sm mt-0.5" style={{ color: `${theme.colors.onSurface}60` }}>
            {member.email}
          </AppText>
          <AppText className="text-xs mt-0.5" style={{ color: `${theme.colors.onSurface}40` }}>
            {FAMILY_STRINGS.familyMembers.linkedSince.replace('{date}', member.linkedAt)}
          </AppText>
        </View>
      </View>
      {member.role !== 'admin' && (
        <SpringPressable
          onPress={() => onRemove(member.id, member.name)}
          className="p-2 ml-2">
          <Ionicons name="close" size={20} color={theme.colors.error} />
        </SpringPressable>
      )}
    </View>
  );
}

export default function FamilyMembersScreen() {
  const theme = useHeritageTheme();
  const router = useRouter();
  const { profile } = useProfile();
  const [prompted, setPrompted] = useState(false);

  // Logic Separation
  const { state, actions } = useFamilyMembersLogic();
  const { members, scrollY, isLoading } = state;

  useEffect(() => {
    if (!profile?.isAnonymous || prompted) return;
    setPrompted(true);
    HeritageAlert.show({
      title: 'Complete Your Account',
      message: 'To manage family members, please set up a permanent account first.',
      variant: 'warning',
      primaryAction: {
        label: 'Set Up Now',
        onPress: () => {
          router.replace(toUpgradeAccountRoute(APP_ROUTES.FAMILY_MEMBERS));
        },
      },
      secondaryAction: {
        label: 'Not now',
        onPress: () => router.back(),
      },
    });
  }, [profile?.isAnonymous, prompted, router]);

  const renderMember = useCallback(
    ({ item }: { item: FamilyMemberMock }) => (
      <MemberCard member={item} onRemove={actions.handleRemoveMember} />
    ),
    [actions.handleRemoveMember]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title={FAMILY_STRINGS.familyMembers.title}
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center pt-[100px]">
          <Animated.View className="opacity-60">
            <Ionicons name="hourglass" size={32} color={theme.colors.primary} />
          </Animated.View>
          <AppText className="mt-4" style={{ color: theme.colors.textMuted }}>
            {FAMILY_STRINGS.familyMembers.loadingText}
          </AppText>
        </View>
      ) : (
        <Animated.FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingTop: 100 }}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={actions.scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <AppText variant="headline" className="mb-2" style={{ color: theme.colors.onSurface }}>
                {FAMILY_STRINGS.familyMembers.headerTitle}
              </AppText>
              <AppText className="text-[15px] leading-[22px] mb-6" style={{ color: `${theme.colors.onSurface}80` }}>
                {FAMILY_STRINGS.familyMembers.subText}
              </AppText>
            </>
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={48} color={`${theme.colors.onSurface}30`} />
              <AppText className="text-base mt-4" style={{ color: `${theme.colors.onSurface}60` }}>
                {FAMILY_STRINGS.familyMembers.emptyText}
              </AppText>
            </View>
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </View>
  );
}


