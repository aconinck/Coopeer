import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { NewProfile, User } from './models';
import { hasBackend, supabase } from '../lib/supabase';
import * as api from './api';

// Identifier-first auth: check if contact exists → sign in or sign up with password.
// With Supabase keys uses Supabase auth; without falls back to mockAuth (demo data).
const mockAuth = {
  async checkContact(contact: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 500));
    const known = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '{}') as Record<string, string>;
    return !!known[contact];
  },
  async remember(user: User) {
    const known = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '{}') as Record<string, string>;
    const key = user.email ?? user.phone ?? user.id;
    known[key] = user.name;
    await AsyncStorage.setItem(KNOWN_KEY, JSON.stringify(known));
  },
};

const USER_KEY = 'session.user';
const KNOWN_KEY = 'mock.knownUsers';

export type ContactKind = 'email' | 'phone';

interface Session {
  isReady: boolean;
  user: User | null;
  isSignedIn: boolean;
  /** Check whether a contact is already registered. */
  checkContact: (contact: string, kind: ContactKind) => Promise<boolean>;
  /** Sign in an existing user with their password. */
  contactSignIn: (contact: string, password: string, kind: ContactKind) => Promise<void>;
  /** Begin sign-up: creates auth user, sets pending state for completeProfile. */
  contactSignUp: (contact: string, password: string, kind: ContactKind) => Promise<void>;
  /** Send a password-reset email. No-op in demo mode. */
  resetPassword: (email: string) => Promise<void>;
  completeProfile: (profile: NewProfile) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updatePhoto: (photoUri: string | null) => Promise<void>;
  signOut: () => void;
  /** Runs `action` now if signed in, otherwise opens login and runs it afterwards. */
  requireAuth: (action: () => void) => void;
  /** Called by the login screen when it finishes. */
  finishAuth: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isReady, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pendingPhone = useRef<string | null>(null);
  const pendingEmail = useRef<string | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  const pendingUid = useRef<string | null>(null);

  useEffect(() => {
    if (supabase) {
      const client = supabase;
      (async () => {
        try {
          const { data } = await client.auth.getSession();
          const authUser = data.session?.user;
          if (authUser) setUser(await api.loadProfile(authUser.id, authUser.phone ?? undefined, authUser.email ?? undefined));
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
    pendingEmail.current = null;
    pendingUid.current = null;
    if (!hasBackend) await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<Session>(
    () => ({
      isReady,
      user,
      isSignedIn: user !== null,
      checkContact: async (contact, kind) => {
        if (!supabase) return mockAuth.checkContact(contact);
        const col = kind === 'email' ? 'email' : 'phone';
        const { data } = await supabase.from('profiles').select('id').eq(col, contact).maybeSingle();
        return !!data;
      },
      contactSignIn: async (contact, password, kind) => {
        if (!supabase) {
          await new Promise((r) => setTimeout(r, 600));
          const known = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '{}') as Record<string, string>;
          if (!known[contact]) throw new Error('Incorrect password.');
          await signIn({ id: contact, [kind]: contact, name: known[contact] } as User);
          return;
        }
        const creds = kind === 'email' ? { email: contact, password } : { phone: contact, password };
        const { data, error } = await supabase.auth.signInWithPassword(creds);
        if (error || !data.user) throw new Error('Incorrect password. Try again.');
        const profile = await api.loadProfile(data.user.id, kind === 'phone' ? contact : undefined, kind === 'email' ? contact : undefined);
        if (!profile) throw new Error('Account not found.');
        await signIn(profile);
      },
      contactSignUp: async (contact, password, kind) => {
        if (!supabase) {
          await new Promise((r) => setTimeout(r, 600));
          if (kind === 'email') pendingEmail.current = contact;
          else pendingPhone.current = contact;
          return;
        }
        const creds = kind === 'email' ? { email: contact, password } : { phone: contact, password };
        const { data, error } = await supabase.auth.signUp(creds);
        // Supabase returns an error when it can't send the confirmation email, but
        // the auth.users record is still created. Swallow that specific error so
        // sign-up proceeds; the profile syncs on next sign-in after confirmation.
        const isEmailDelivery = !!error?.message?.toLowerCase().includes('email');
        if (error && !isEmailDelivery) throw new Error(error.message);
        if (!data.user && !isEmailDelivery) throw new Error('Sign up failed. Try again.');
        if (kind === 'email') pendingEmail.current = contact;
        else pendingPhone.current = contact;
        if (data.user) pendingUid.current = data.user.id;
      },
      resetPassword: async (email) => {
        if (!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
      },
      completeProfile: async (profile) => {
        const phone = pendingPhone.current;
        const email = pendingEmail.current;
        const contact = phone ?? email;
        if (!contact) return;
        const uid = pendingUid.current;
        const next: User = { id: uid ?? contact, phone: phone ?? undefined, email: email ?? undefined, ...profile, name: profile.name.trim() };
        if (uid) {
          try {
            await api.saveProfile(uid, phone ?? undefined, email ?? undefined, { ...profile, name: next.name });
          } catch {
            // Save failed (e.g. no session yet due to email confirmation); profile syncs on next sign-in
          }
        } else {
          await mockAuth.remember(next);
        }
        pendingPhone.current = null;
        pendingEmail.current = null;
        await signIn(next);
      },
      updateName: async (name) => {
        if (!user) return;
        const next = { ...user, name: name.trim() };
        if (hasBackend) await api.updateProfileName(user.id, next.name);
        else await mockAuth.remember(next);
        await signIn(next);
      },
      updatePhoto: async (photoUri) => {
        if (!user) return;
        const next = { ...user, photoUri: photoUri ?? undefined };
        if (hasBackend) await api.updateProfilePhoto(user.id, photoUri);
        else await mockAuth.remember(next);
        await signIn(next);
      },
      signOut: () => {
        setUser(null);
        if (supabase) supabase.auth.signOut();
        else AsyncStorage.removeItem(USER_KEY);
      },
      requireAuth: (action) => {
        if (user) { action(); return; }
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
