import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import Animated from 'react-native-reanimated';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { useHeritageTheme } from '@/theme/heritage';

import { useInviteLogic } from '@/features/family/hooks/useFamilyLogic';
import { FAMILY_STRINGS } from '@/features/family/data/mockFamilyData';

export default function InviteScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useInviteLogic();
  const { email, inviteLink, loading, error, scrollY, isSubmitDisabled } = state;

  const STRINGS = FAMILY_STRINGS.invite;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title={STRINGS.title}
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 100 }}
        onScroll={actions.scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center gap-8 lg:max-w-xl lg:self-center">
          <View className="gap-3">
            <AppText
              className="text-center font-semibold"
              style={{
                fontSize: 28,
                color: theme.colors.onSurface,
                fontFamily: 'Fraunces_600SemiBold',
              }}>
              {STRINGS.header}
            </AppText>
            <AppText
              className="text-center text-base leading-relaxed"
              style={{ color: `${theme.colors.onSurface}99` }}>
              {STRINGS.subText}
            </AppText>
          </View>

          <View className="gap-6">
            <HeritageInput
              label={STRINGS.emailLabel}
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={STRINGS.emailPlaceholder}
              leftIcon="mail-outline"
            />

            {error ? (
              <View
                className="flex-row items-center rounded-lg p-3"
                style={{ backgroundColor: `${theme.colors.error}15` }}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <AppText className="ml-2 flex-1" style={{ color: theme.colors.error }}>
                  {error}
                </AppText>
              </View>
            ) : null}

            <HeritageButton
              title={loading ? STRINGS.generateButton.loading : STRINGS.generateButton.idle}
              onPress={actions.handleCreateInvite}
              disabled={isSubmitDisabled}
              loading={loading}
              variant="primary"
            />
          </View>

          {inviteLink ? (
            <View
              className="gap-4 rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 10,
              }}>
              <AppText
                className="text-lg font-semibold"
                style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
                {STRINGS.inviteReady.title}
              </AppText>

              <View
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: `${theme.colors.primary}08`,
                  borderColor: `${theme.colors.primary}20`,
                }}>
                <AppText
                  selectable
                  className="font-mono text-sm"
                  style={{ color: theme.colors.onSurface }}>
                  {inviteLink}
                </AppText>
              </View>

              {__DEV__ ? (
                <AppText
                  className="text-center text-xs"
                  style={{ color: `${theme.colors.onSurface}60` }}>
                  {STRINGS.inviteReady.devNote}
                </AppText>
              ) : null}

              <View className="gap-3">
                <HeritageButton
                  title={STRINGS.inviteReady.shareButton}
                  onPress={actions.handleShare}
                  variant="primary"
                  icon="share-outline"
                />
                <HeritageButton
                  title={STRINGS.inviteReady.openButton}
                  onPress={actions.handleOpen}
                  variant="outline"
                  icon="open-outline"
                />
              </View>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
