import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkv } from './mmkv';

interface AccessibilityState {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      isHighContrast: false,
      toggleHighContrast: () => set((state) => ({ isHighContrast: !state.isHighContrast })),
      setHighContrast: (enabled) => set({ isHighContrast: enabled }),
    }),
    {
      name: 'accessibility-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => mmkv.getString(name) ?? null,
        setItem: (name, value) => mmkv.set(name, value),
        removeItem: (name) => mmkv.delete(name),
      })),
    }
  )
);
