/**
 * Mock Data for Discovery / Topics Feature
 * Adhering to reactcomponents skill
 */

import { Ionicons } from '@/components/ui/Icon';

export const DISCOVERY_STRINGS = {
  header: {
    title: 'Topic Discovery',
  },
  card: {
    badge: 'ASKED BY MICHAEL',
    helperText: 'Share your thoughts with the grandkids. Did you enjoy it?',
  },
  actions: {
    recordAnswer: 'Record Answer',
    tryAnother: 'Next',
  },
} as const;

export const CATEGORY_META: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: 'sageGreen' | 'amberCustom' | 'primary' | 'textMuted' | 'tertiary' | 'primaryMuted';
  }
> = {
  default: { icon: 'chatbubbles', colorKey: 'primaryMuted' },
  childhood: { icon: 'bicycle', colorKey: 'sageGreen' },
  family: { icon: 'heart', colorKey: 'amberCustom' },
  career: { icon: 'briefcase', colorKey: 'tertiary' },
  education: { icon: 'school', colorKey: 'tertiary' },
  wisdom: { icon: 'leaf', colorKey: 'amberCustom' },
  travel: { icon: 'airplane', colorKey: 'primary' },
  hobbies: { icon: 'color-palette', colorKey: 'textMuted' },
  food: { icon: 'restaurant', colorKey: 'amberCustom' },
  friendship: { icon: 'people', colorKey: 'tertiary' },
  history: { icon: 'time', colorKey: 'textMuted' },
  celebrations: { icon: 'wine', colorKey: 'primaryMuted' },
  memories: { icon: 'time', colorKey: 'textMuted' },
  family_history: { icon: 'time', colorKey: 'textMuted' },
  fun: { icon: 'happy', colorKey: 'primaryMuted' },
  general: { icon: 'chatbubbles', colorKey: 'primaryMuted' },
};

// Mock user request for the "Asked by Michael" badge
export const MOCK_FAMILY_REQUEST = {
  isRequest: true,
  author: 'Michael',
  avatar: null, // Removed hardcoded URL - should fetch from profile when needed
};
