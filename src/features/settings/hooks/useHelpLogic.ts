import { useState } from 'react';
import { Linking } from 'react-native';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { HELP_STRINGS } from '@/features/settings/data/mockHelpData';
import { devLog } from '@/lib/devLogger';

export function useHelpLogic() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleContactSupport = async () => {
    const { email, subject } = HELP_STRINGS.contact;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      devLog.warn('Cannot open mail client');
      // Ideally show toast here, but simple logic for now
    }
  };

  return {
    state: { scrollY, faqItems: HELP_STRINGS.faq.items },
    actions: { scrollHandler, handleContactSupport },
  };
}

export function useFAQAccordion(id: string) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggle = () => setIsExpanded(!isExpanded);

  return {
    isExpanded,
    toggle,
  };
}
