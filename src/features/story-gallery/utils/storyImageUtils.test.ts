import { CATEGORY_COVERS, getCategoryCover } from './storyImageUtils';

describe('storyImageUtils', () => {
  it('resolves friends alias to friendship cover', () => {
    expect(getCategoryCover('friends')).toBe(CATEGORY_COVERS.friendship);
  });
});
