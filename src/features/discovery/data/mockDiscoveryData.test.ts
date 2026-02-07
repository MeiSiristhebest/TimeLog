import { CATEGORY_META } from './mockDiscoveryData';

describe('CATEGORY_META', () => {
  it('includes a default fallback category', () => {
    expect(CATEGORY_META.default).toBeDefined();
  });

  it('covers all current inspiration/discovery category ids', () => {
    const categories = [
      'childhood',
      'family',
      'career',
      'wisdom',
      'travel',
      'education',
      'hobbies',
      'celebrations',
      'food',
      'friendship',
      'history',
    ];

    for (const category of categories) {
      expect(CATEGORY_META[category]).toBeDefined();
    }
  });
});
