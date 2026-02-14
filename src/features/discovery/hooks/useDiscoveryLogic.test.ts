import { getRandomNextIndex } from './useDiscoveryLogic';

describe('getRandomNextIndex', () => {
  it('keeps current index when deck has one or fewer cards', () => {
    expect(getRandomNextIndex(0, 0)).toBe(0);
    expect(getRandomNextIndex(0, 1)).toBe(0);
  });

  it('returns a different index when deck has multiple cards', () => {
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.5) // same as current index = 1 when deckSize=2
      .mockReturnValueOnce(0.0); // next index = 0

    const result = getRandomNextIndex(1, 2);

    expect(result).toBe(0);
    expect(result).not.toBe(1);
    randomSpy.mockRestore();
  });
});
