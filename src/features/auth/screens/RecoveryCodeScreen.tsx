/**
 * Recovery Code Screen
 *
 * Allows family users to generate and manage recovery codes for seniors.
 */

import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { useRecoveryCodeLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';

export default function RecoveryCodeScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useRecoveryCodeLogic();
  const { recoveryCode, isGenerating, scrollY } = state;
  const { handleGenerateCode, handleCopyCode, handleShareCode, scrollHandler } = actions;
  const STRINGS = AUTH_STRINGS.recoveryCode;

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
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Ionicons name="key" size={32} color={theme.colors.primary} />
          <AppText style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
            {STRINGS.infoTitle}
          </AppText>
          <AppText style={[styles.infoText, { color: `${theme.colors.onSurface}80` }]}>
            {STRINGS.infoText}
          </AppText>
        </View>

        {recoveryCode ? (
          <View
            style={[
              styles.codeCard,
              { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceCard },
            ]}>
            <AppText style={[styles.codeLabel, { color: `${theme.colors.onSurface}60` }]}>
              {STRINGS.codeLabel}
            </AppText>
            <AppText style={[styles.codeText, { color: theme.colors.primary }]}>
              {recoveryCode}
            </AppText>
            <View style={styles.codeActions}>
              <HeritageButton
                title="Copy"
                icon="copy"
                variant="secondary"
                onPress={handleCopyCode}
                style={{ flex: 1 }}
              />
              <HeritageButton
                title="Share"
                icon="share"
                variant="secondary"
                onPress={handleShareCode}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.noCodeCard,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceCard },
            ]}>
            <Ionicons name="key" size={48} color={`${theme.colors.onSurface}30`} />
            <AppText style={[styles.noCodeText, { color: `${theme.colors.onSurface}60` }]}>
              {STRINGS.noCode}
            </AppText>
          </View>
        )}

        <HeritageButton
          title={isGenerating ? STRINGS.generateButton.generating : STRINGS.generateButton.idle}
          icon="refresh"
          variant="primary"
          fullWidth
          onPress={handleGenerateCode}
          disabled={isGenerating}
          style={{ marginTop: 24 }}
        />

        <View style={[styles.warningBox, { backgroundColor: `${theme.colors.error}15` }]}>
          <Ionicons name="warning" size={20} color={theme.colors.error} />
          <AppText style={[styles.warningText, { color: theme.colors.error }]}>{STRINGS.warning}</AppText>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
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
  infoCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 22,
    fontFamily: 'Fraunces_600SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 20,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  noCodeCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  noCodeText: {
    fontSize: 16,
    marginTop: 16,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'transparent',
  },
});
