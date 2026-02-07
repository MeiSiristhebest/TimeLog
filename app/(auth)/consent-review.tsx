/**
 * Consent Review Screen
 *
 * Allows users to view and modify their consent settings.
 */

import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import Animated from 'react-native-reanimated';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useConsentReviewLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS, ConsentItem } from '@/features/auth/data/mockAuthData';

function ConsentCard({ item }: { item: ConsentItem }): JSX.Element {
  const theme = useHeritageTheme();

  return (
    <View style={[styles.consentCard, { borderColor: theme.colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
        <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <AppText style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          {item.title}
        </AppText>
        <AppText style={[styles.cardDescription, { color: `${theme.colors.onSurface}80` }]}>
          {item.description}
        </AppText>
        <View style={styles.consentInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#7D9D7A" />
          <AppText style={styles.consentDate}>Consented on {item.consentedAt}</AppText>
        </View>
      </View>
    </View>
  );
}

export default function ConsentReviewScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useConsentReviewLogic();
  const { scrollY, consentItems } = state;
  const { scrollHandler } = actions;
  const STRINGS = AUTH_STRINGS.consentReview;

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
        <AppText style={[styles.headerText, { color: theme.colors.onSurface }]}>
          {STRINGS.header}
        </AppText>
        <AppText style={[styles.subText, { color: `${theme.colors.onSurface}80` }]}>
          {STRINGS.subheader}
        </AppText>

        {consentItems.map((item) => (
          <ConsentCard key={item.id} item={item} />
        ))}

        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
          <AppText style={[styles.infoText, { color: theme.colors.onSurface }]}>
            {STRINGS.infoBox}
          </AppText>
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
  consentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  consentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consentDate: {
    fontSize: 13,
    color: '#7D9D7A',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
