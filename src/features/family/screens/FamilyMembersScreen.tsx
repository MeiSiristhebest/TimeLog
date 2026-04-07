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
}: SpringPressableProps): JSX.Element {
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
}): JSX.Element {
  const theme = useHeritageTheme();

  return (
    <View
      style={[
        styles.memberCard,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceCard },
      ]}>
      <View style={styles.memberInfo}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View
            style={[styles.avatarPlaceholder, { backgroundColor: `${theme.colors.primary}20` }]}>
            <AppText style={[styles.avatarInitial, { color: theme.colors.primary }]}>
              {member.name.charAt(0)}
            </AppText>
          </View>
        )}
        <View style={styles.memberDetails}>
          <View style={styles.nameRow}>
            <AppText style={[styles.memberName, { color: theme.colors.onSurface }]}>
              {member.name}
            </AppText>
            {member.role === 'admin' && (
              <View style={[styles.adminBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                <AppText style={[styles.adminText, { color: theme.colors.primary }]}>
                  {FAMILY_STRINGS.familyMembers.adminBadge}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={[styles.memberEmail, { color: `${theme.colors.onSurface}60` }]}>
            {member.email}
          </AppText>
          <AppText style={[styles.linkedDate, { color: `${theme.colors.onSurface}40` }]}>
            {FAMILY_STRINGS.familyMembers.linkedSince.replace('{date}', member.linkedAt)}
          </AppText>
        </View>
      </View>
      {member.role !== 'admin' && (
        <SpringPressable
          onPress={() => onRemove(member.id, member.name)}
          style={styles.removeButton}>
          <Ionicons name="close" size={20} color={theme.colors.error} />
        </SpringPressable>
      )}
    </View>
  );
}

export default function FamilyMembersScreen(): JSX.Element {
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
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title={FAMILY_STRINGS.familyMembers.title}
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <Animated.View style={{ opacity: 0.6 }}>
            <Ionicons name="hourglass" size={32} color={theme.colors.primary} />
          </Animated.View>
          <AppText style={{ marginTop: 16, color: theme.colors.textMuted }}>
            {FAMILY_STRINGS.familyMembers.loadingText}
          </AppText>
        </View>
      ) : (
        <Animated.FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={actions.scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <AppText style={[styles.headerText, { color: theme.colors.onSurface }]}>
                {FAMILY_STRINGS.familyMembers.headerTitle}
              </AppText>
              <AppText style={[styles.subText, { color: `${theme.colors.onSurface}80` }]}>
                {FAMILY_STRINGS.familyMembers.subText}
              </AppText>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={`${theme.colors.onSurface}30`} />
              <AppText style={[styles.emptyText, { color: `${theme.colors.onSurface}60` }]}>
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 100,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  linkedDate: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
