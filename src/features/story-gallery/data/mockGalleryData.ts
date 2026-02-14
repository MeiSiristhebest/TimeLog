/**
 * Mock Data for Story Gallery
 * Adhering to reactcomponents skill
 */
import { Ionicons } from '@/components/ui/Icon';

export type FilterCategory =
  | 'all'
  | 'travel'
  | 'education'
  | 'wisdom'
  | 'celebration'
  | 'hobbies'
  | 'food'
  | 'friendship'
  | 'history'
  | 'childhood';

export const GALLERY_STRINGS = {
  header: {
    title: 'My Stories',
    subtitleSuffix: ' memories recorded',
    sortButton: 'Sort',
    searchPlaceholder: 'Search title, transcript, or topic',
  },
  emptyState: {
    message: 'No stories found for this search',
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
  colorKey: 'primary' | 'blueAccent' | 'amberCustom' | 'sageGreen' | 'primaryMuted' | 'textMuted';
}[] = [
    { id: 'all', label: 'All', colorKey: 'textMuted' },
    { id: 'travel', label: 'Travel', icon: 'map', colorKey: 'primary' },
    { id: 'education', label: 'Education', icon: 'school', colorKey: 'blueAccent' },
    { id: 'wisdom', label: 'Wisdom', icon: 'leaf', colorKey: 'amberCustom' },
    { id: 'celebration', label: 'Celebration', icon: 'wine', colorKey: 'primaryMuted' },
    { id: 'hobbies', label: 'Hobbies', icon: 'color-palette', colorKey: 'sageGreen' },
    { id: 'food', label: 'Food', icon: 'restaurant', colorKey: 'amberCustom' },
    { id: 'friendship', label: 'Friendship', icon: 'people', colorKey: 'blueAccent' },
    { id: 'history', label: 'History', icon: 'time', colorKey: 'textMuted' },
    // Keeping Childhood as distinct or merging? User listed it above but also in the list
    // Wait, the user's list was: Travel, Education, Wisdom, Celebration, Hobbies (incl Food?), Friendship, History.
    // Childhood was in the old list. I will keep it for backward compat or if it fits 'History'? 
    // User list mentions: Hobbies -> Food (indented?), maybe Food is sub? But usually flat list is better for UI pill bar.
    // I will make Food top level.
    { id: 'childhood', label: 'Childhood', icon: 'home', colorKey: 'sageGreen' },
  ];

/**
 * Maps raw question categories (from database/questions) to UI Filter Categories.
 * Centralized logic to ensure consistent behavior between FilterBar and Card UI.
 */
export function mapRawCategoryToFilter(raw: string): FilterCategory {
  if (!raw) return 'wisdom';

  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'childhood': return 'childhood';

    // Family & Social
    case 'family':
    case 'relatives':
      return 'celebration'; // Based on previous decision, although 'family' -> 'celebration' is a bit weird. 
    // User requested "Friendship" separately. 
    // Let's improve this based on user's new list:
    // Travel, Education, Wisdom, Celebration, Hobbies(Food), Friendship, History.

    case 'food': return 'food';
    case 'celebration':
    case 'celebrations':
      return 'celebration';
    case 'friend':
    case 'friends':
    case 'friendship':
    case 'friendships':
      return 'friendship';

    // Hobbies & Lifestyle
    case 'travel': return 'travel';
    case 'adventures': return 'travel';
    case 'hobbies': return 'hobbies';
    case 'general': return 'hobbies'; // Fallback for misc

    // Wisdom & Reflections
    case 'wisdom': return 'wisdom';
    case 'fun':
    case 'reflections':
      return 'wisdom';
    case 'memory':
    case 'memories':
    case 'family_history':
      return 'history'; // Past memories -> history
    case 'history': return 'history';

    // Milestones
    case 'career':
    case 'education': return 'education';

    default:
      return 'wisdom'; // Default fallback
  }
}
