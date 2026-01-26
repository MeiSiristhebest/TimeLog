import { AppText } from '@/components/ui/AppText';
import { View, ScrollView } from 'react-native';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useAcceptInviteLogic } from '@/features/family/hooks/useFamilyLogic';
import { FAMILY_STRINGS } from '@/features/family/data/mockFamilyData';

export default function AcceptInviteScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useAcceptInviteLogic();
  const { token, loading, error, missingToken } = state;
  const STRINGS = FAMILY_STRINGS.acceptInvite;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title={STRINGS.headerTitle} showBack={false} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingBottom: 60,
        }}>
        <View style={{ gap: 32, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
          {/* Header Text */}
          <View style={{ gap: 12 }}>
            <AppText
              style={{
                textAlign: 'center',
                fontSize: 32,
                fontFamily: 'Fraunces_600SemiBold',
                color: theme.colors.onSurface,
              }}>
              {STRINGS.title}
            </AppText>
            <AppText
              style={{
                textAlign: 'center',
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.textMuted,
                paddingHorizontal: 16,
              }}>
              {STRINGS.subText}
            </AppText>
          </View>

          {/* Token Card */}
          <View
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceDim,
              padding: 24,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 2,
              gap: 12,
            }}>
            <AppText
              style={{
                fontSize: 16,
                fontFamily: 'Fraunces_600SemiBold',
                color: theme.colors.onSurface,
              }}>
              {STRINGS.tokenLabel}
            </AppText>
            <View
              style={{
                backgroundColor: `${theme.colors.primary}08`,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}15`,
                padding: 16,
              }}>
              <AppText
                selectable
                style={{ fontFamily: 'System', fontSize: 14, color: theme.colors.onSurface }}>
                {token || STRINGS.noToken}
              </AppText>
            </View>
          </View>

          {error ? (
            <AppText
              style={{
                textAlign: 'center',
                fontSize: 15,
                fontWeight: '500',
                color: theme.colors.error,
              }}>
              {error}
            </AppText>
          ) : null}

          {/* Actions */}
          <View style={{ gap: 16 }}>
            <HeritageButton
              title={loading ? STRINGS.buttons.joining : STRINGS.buttons.accept}
              onPress={actions.handleAccept}
              disabled={missingToken || loading}
              variant="primary"
              size="large"
              fullWidth
            />
            <HeritageButton
              title={STRINGS.buttons.home}
              onPress={actions.handleBackHome}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
