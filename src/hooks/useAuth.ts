import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthState } from '../types';

const AUTH_KEY = '@coopeer/auth_user';

export function useAuth(): AuthState & {
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY)
      .then((raw) => {
        if (raw) {
          const user: User = JSON.parse(raw);
          setState({ user, isLoading: false, isAuthenticated: true });
        } else {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      })
      .catch(() => {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  async function signIn(user: User) {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    setState({ user, isLoading: false, isAuthenticated: true });
  }

  async function signOut() {
    await AsyncStorage.removeItem(AUTH_KEY);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }

  return { ...state, signIn, signOut };
}
