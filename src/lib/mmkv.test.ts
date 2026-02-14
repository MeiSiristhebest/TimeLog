describe('mmkv wrapper', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('supports MMKV v4 createMMKV instances that expose remove() instead of delete()', () => {
    const storage = {
      getString: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      clearAll: jest.fn(),
    };

    jest.doMock('react-native-mmkv', () => ({
      createMMKV: jest.fn(() => storage),
    }));

    const { mmkv } = require('./mmkv');
    mmkv.delete('legacy-key');

    expect(storage.remove).toHaveBeenCalledWith('legacy-key');
  });
});
