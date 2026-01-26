/**
 * Mock Data for Story Gallery
 * Adhering to reactcomponents skill
 */
import { Ionicons } from '@/components/ui/Icon';

export type FilterCategory =
  | 'all'
  | 'adventures'
  | 'reflections'
  | 'milestones'
  | 'childhood'
  | 'family';

export const GALLERY_STRINGS = {
  header: {
    title: 'My Stories',
    subtitleSuffix: ' memories recorded',
    sortButton: 'Sort',
  },
  emptyState: {
    message: 'No stories found',
  },
  toasts: {
    unavailable: 'Content unavailable offline',
    deleteFailed: 'Delete failed, please try again',
    restoreSuccess: 'Story restored',
    restoreFailed: 'Restore failed, please try again',
  },
  deleteModal: {
    title: 'Delete Story', // Assuming modal needs this, though mostly dynamic
  },
} as const;

export const CATEGORY_DATA: {
  id: FilterCategory;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  // Colors will be mapped in the component to use Theme Tokens, avoiding hex here if possible,
  // OR we map semantic names here and resolve to tokens in View.
  // For 'reactcomponents' skill, data should be pure.
  // Let's use semantic color keys.
  colorKey: 'primary' | 'blueAccent' | 'amberCustom' | 'sageGreen' | 'primaryMuted' | 'textMuted';
}[] = [
  { id: 'all', label: 'All Stories', colorKey: 'textMuted' },
  { id: 'adventures', label: 'Adventures', icon: 'sparkles', colorKey: 'primary' },
  { id: 'reflections', label: 'Reflections', icon: 'bulb', colorKey: 'blueAccent' },
  { id: 'milestones', label: 'Milestones', icon: 'star', colorKey: 'amberCustom' },
  { id: 'childhood', label: 'Childhood', icon: 'home', colorKey: 'sageGreen' },
  { id: 'family', label: 'Family', icon: 'heart', colorKey: 'primaryMuted' },
];
