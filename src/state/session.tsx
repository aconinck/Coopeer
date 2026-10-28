import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { NewProfile, User } from './models';
import { hasBackend, supabase } from '../lib/supabase';
import * as api from './api';

// Phone-only login. With Supabase keys set it uses Supabase phone auth (SMS via Twilio);
// without them it falls back to `mockAuth` so the app still runs on demo data.
const mockAuth = {
  async sendCode(_phone: string) {
    await new Promise((resolve) => setTimeout(resolve, 700));
  },
  // Any 6-digit code works except 000000, which simulates a wrong code.
  async verify(phone: string, code: string): Promise<{ existing: User } | { isNew: true }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (code.length !== 6 || code === '000000') {
      throw new Error("That code didn't work. Check the text and try again.");
    }
    const known = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '{}') as Record<string, string>;
    return known[phone] ? { existing: { id: phone, phone, name: known[phone] } } : { isNew: true };
  },
  async remember(user: User) {
    const known = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '{}') as Record<string, string>;
    known[user.phone] = user.name;
    await AsyncStorage.setItem(KNOWN_KEY, JSON.stringify(known));
  },
};

const USER_KEY = 'session.user';
const KNOWN_KEY = 'mock.knownUsers';

interface Session {
  isReady: boolean;
  user: User | null;
  isSignedIn: boolean;
  sendCode: (phone: string) => Promise<void>;
  /** Resolves true when the phone is new and we still need a name. */
  verify: (phone: string, code: string) => Promise<boolean>;
  completeProfile: (profile: NewProfile) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => void;
  /** Runs `action` now if signed in, otherwise opens phone login and runs it afterwards. */
  requireAuth: (action: () => void) => void;
  /** Called by the login screen when it finishes. */
  finishAuth: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isReady, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pendingPhone = useRef<string | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  const pendingUid = useRef<string | null>(null);

  useEffect(() => {
    if (supabase) {
      const client = supabase;
      (async () => {
        try {
          const { data } = await client.auth.getSession();
          const authUser = data.session?.user;
          // A session without a profile means sign-up was not finished: treat as signed out.
          if (authUser) setUser(await api.loadProfile(authUser.id, authUser.phone ?? ''));
        } catch (error) {
          console.warn('Could not restore session', error);
        }
        setReady(true);
      })();
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') setUser(null);
      });
      return () => data.subscription.unsubscribe();
    }
    (async () => {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) setUser(JSON.parse(storedUser) as User);
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (next: User) => {
    setUser(next);
    pendingPhone.current = null;
    pendingUid.current = null;
    if (!hasBackend) await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<Session>(
    () => ({
      isReady,
      user,
      isSignedIn: user !== null,
      sendCode: async (phone) => {
        if (!supabase) return mockAuth.sendCode(phone);
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw new Error(error.message);
      },
      verify: async (phone, code) => {
        if (supabase) {
          const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
          if (error || !data.user) throw new Error("That code didn't work. Check the text and try again.");
          const existing = await api.loadProfile(data.user.id, phone);
          if (existing) {
            await signIn(existing);
            return false;
          }
          pendingPhone.current = phone;
          pendingUid.current = data.user.id;
          return true;
        }
        const result = await mockAuth.verify(phone, code);
        if ('existing' in result) {
          await signIn(result.existing);
          return false;
        }
        pendingPhone.current = phone;
        return true;
      },
      completeProfile: async (profile) => {
        const phone = pendingPhone.current;
        if (!phone) return;
        const uid = pendingUid.current;
        const next: User = { id: uid ?? phone, phone, ...profile, name: profile.name.trim() };
        if (uid) await api.saveProfile(uid, phone, { ...profile, name: next.name });
        else await mockAuth.remember(next);
        await signIn(next);
      },
      updateName: async (name) => {
        if (!user) return;
        const next = { ...user, name: name.trim() };
        if (hasBackend) await api.updateProfileName(user.id, next.name);
        else await mockAuth.remember(next);
        await signIn(next);
      },
      signOut: () => {
        setUser(null);
        // The root layout's auth guard sends signed-out users back to /welcome.
        if (supabase) supabase.auth.signOut();
        else AsyncStorage.removeItem(USER_KEY);
      },
      requireAuth: (action) => {
        if (user) {
          action();
          return;
        }
        pendingAction.current = action;
        router.push('/auth');
      },
      finishAuth: () => {
        const action = pendingAction.current;
        pendingAction.current = null;
        action?.();
      },
    }),
    [isReady, user, signIn],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
