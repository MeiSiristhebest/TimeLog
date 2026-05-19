/**
 * Help & FAQ Screen
 *
 * Provides user assistance and frequently asked questions.
 */

import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { useHelpLogic, useFAQAccordion } from '@/features/settings/hooks/useHelpLogic';
import { HELP_STRINGS, FAQItem } from '@/features/settings/data/mockHelpData';
import { useTranslation } from '@/lib/i18n/useTranslation';

function FAQAccordion({ item }: { item: FAQItem }): JSX.Element {
  const { isExpanded, toggle } = useFAQAccordion(item.id);
  const theme = useHeritageTheme();
  const { t } = useTranslation();

  const question = t(`Auth.help.faq.q_${item.id}`, { defaultValue: item.question });
  const answer = t(`Auth.help.faq.a_${item.id}`, { defaultValue: item.answer });

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.faqItem,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceCard },
      ]}>
      <View style={styles.faqHeader}>
        <AppText style={[styles.faqQuestion, { color: theme.colors.onSurface }]}>
          {question}
        </AppText>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.primary}
        />
      </View>
      {isExpanded && (
        <AppText
          style={[
            styles.faqAnswer,
            { color: `${theme.colors.onSurface}CC`, borderTopColor: theme.colors.border },
          ]}>
          {answer}
        </AppText>
      )}
    </Pressable>
  );
}

export default function HelpScreen(): JSX.Element {
  const theme = useHeritageTheme();
  const { t } = useTranslation();

  // Logic Separation
  const { state, actions } = useHelpLogic();
  const { scrollY, faqItems } = state;
  const { scrollHandler, handleContactSupport } = actions;
  const STRINGS = HELP_STRINGS;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title={t('Auth.help.title', { defaultValue: STRINGS.headerTitle })}
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
        <AppText style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('Auth.help.faqTitle', { defaultValue: STRINGS.faq.title })}
        </AppText>

        {faqItems.map((item) => (
          <FAQAccordion key={item.id} item={item} />
        ))}

        <View style={[styles.contactSection, { backgroundColor: `${theme.colors.primary}14` }]}>
          <AppText style={[styles.contactTitle, { color: theme.colors.onSurface }]}>
            {t('Auth.help.contactTitle', { defaultValue: STRINGS.contact.title })}
          </AppText>
          <AppText style={[styles.contactText, { color: `${theme.colors.onSurface}80` }]}>
            {t('Auth.help.contactSubtitle', { defaultValue: STRINGS.contact.subtitle })}
          </AppText>
          <HeritageButton
            title={t('Auth.help.contactButton', { defaultValue: STRINGS.contact.button })}
            icon="mail"
            variant="primary"
            onPress={handleContactSupport}
            style={{ marginTop: 16 }}
          />
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
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: 20,
  },
  faqItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  contactSection: {
    marginTop: 32,
    padding: 24,
    backgroundColor: 'transparent',
    borderRadius: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
