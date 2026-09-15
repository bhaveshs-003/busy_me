import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCurrentUser } from '@/data/mockUsers';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  avatarUrl?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  pendingEmail: string;
  pendingName: string;
  isAuthenticated: boolean;
  loginAsDemo: () => void;
  loginWithSSO: (provider: 'google' | 'apple') => void;
  startEmailFlow: (email: string, name?: string) => void;
  completeAuth: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      pendingEmail: '',
      pendingName: '',
      isAuthenticated: false,

      loginAsDemo: () => {
        set({
          user: {
            id: mockCurrentUser.id,
            email: mockCurrentUser.email,
            displayName: mockCurrentUser.displayName,
            firstName: mockCurrentUser.firstName,
            avatarUrl: null,
          },
          isAuthenticated: true,
        });
      },

      loginWithSSO: (provider) => {
        void provider;
        const u = mockCurrentUser;
        set({
          user: {
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            firstName: u.firstName,
            avatarUrl: null,
          },
          isAuthenticated: true,
        });
      },

      startEmailFlow: (email, name) => {
        set({ pendingEmail: email, pendingName: name ?? '' });
      },

      completeAuth: () => {
        set((state) => ({
          user: {
            id: mockCurrentUser.id,
            email: state.pendingEmail || mockCurrentUser.email,
            displayName: state.pendingName || mockCurrentUser.displayName,
            firstName: state.pendingName
              ? state.pendingName.split(' ')[0]
              : mockCurrentUser.firstName,
            avatarUrl: null,
          },
          isAuthenticated: true,
          pendingEmail: '',
          pendingName: '',
        }));
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, pendingEmail: '', pendingName: '' });
      },
    }),
    { name: 'busy-me-auth' }
  )
);
