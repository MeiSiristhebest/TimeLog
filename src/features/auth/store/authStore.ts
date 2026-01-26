import { create } from 'zustand';

type AuthState = {
  status: 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';
  sessionUserId?: string;
  error?: string;
  setRestoring: () => void;
  setAuthenticated: (userId?: string) => void;
  setUnauthenticated: (error?: string) => void;
};

export const useAuthStore = create<AuthState>(function useAuthStoreState(set) {
  return {
    status: 'idle',
    sessionUserId: undefined,
    error: undefined,
    setRestoring: () => set({ status: 'restoring', error: undefined }),
    setAuthenticated: (userId) =>
      set({ status: 'authenticated', sessionUserId: userId, error: undefined }),
    setUnauthenticated: (error) =>
      set({ status: 'unauthenticated', sessionUserId: undefined, error }),
  };
});
