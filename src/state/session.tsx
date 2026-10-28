import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { User } from './models';

// Phone-only login. Swap `mockAuth` for Firebase Phone Auth or Twilio Verify.
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
  completeProfile: (name: string) => Promise<void>;
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

  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) setUser(JSON.parse(storedUser) as User);
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (next: User) => {
    setUser(next);
    pendingPhone.current = null;
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<Session>(
    () => ({
      isReady,
      user,
      isSignedIn: user !== null,
      sendCode: (phone) => mockAuth.sendCode(phone),
      verify: async (phone, code) => {
        const result = await mockAuth.verify(phone, code);
        if ('existing' in result) {
          await signIn(result.existing);
          return false;
        }
        pendingPhone.current = phone;
        return true;
      },
      completeProfile: async (name) => {
        const phone = pendingPhone.current;
        if (!phone) return;
        const next = { id: phone, phone, name: name.trim() };
        await mockAuth.remember(next);
        await signIn(next);
      },
      updateName: async (name) => {
        if (!user) return;
        const next = { ...user, name: name.trim() };
        await mockAuth.remember(next);
        await signIn(next);
      },
      signOut: () => {
        setUser(null);
        // The root layout's auth guard sends signed-out users back to /welcome.
        AsyncStorage.removeItem(USER_KEY);
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
