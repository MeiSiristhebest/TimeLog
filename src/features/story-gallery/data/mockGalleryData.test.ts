import { mapRawCategoryToFilter } from './mockGalleryData';
import { CATEGORY_COVERS } from './mockStoryData';

describe('mapRawCategoryToFilter', () => {
  it('maps friendship aliases to friendship filter', () => {
    expect(mapRawCategoryToFilter('friendship')).toBe('friendship');
    expect(mapRawCategoryToFilter('friends')).toBe('friendship');
    expect(mapRawCategoryToFilter('Friendships')).toBe('friendship');
  });

  it('maps celebration aliases to celebration filter', () => {
    expect(mapRawCategoryToFilter('celebration')).toBe('celebration');
    expect(mapRawCategoryToFilter('celebrations')).toBe('celebration');
  });

  it('maps family history alias to history filter', () => {
    expect(mapRawCategoryToFilter('family_history')).toBe('history');
    expect(mapRawCategoryToFilter('family-history')).toBe('history');
  });

  it('maps all known recorder/inspiration source categories to filters with covers', () => {
    const sourceCategories = [
      'career',
      'celebrations',
      'childhood',
      'education',
      'family',
      'food',
      'friendship',
      'friends',
      'history',
      'hobbies',
      'memories',
      'travel',
      'wisdom',
    ];

    for (const source of sourceCategories) {
      const mapped = mapRawCategoryToFilter(source);
      expect(CATEGORY_COVERS[mapped]).toBeDefined();
    }
  });

  it('has cover assets for every gallery filter category', () => {
    const filterKeys = [
      'travel',
      'education',
      'wisdom',
      'celebration',
      'hobbies',
      'food',
      'friendship',
      'history',
      'childhood',
    ];

    for (const key of filterKeys) {
      expect(CATEGORY_COVERS[key]).toBeDefined();
    }
  });
});
