import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { NewProfile, User } from './models';
import { hasBackend, supabase } from '../lib/supabase';
import * as api from './api';
import { accounts, type Credential } from './localAccounts';

// Identifier-first auth: check if contact exists → sign in or sign up with password.
// Local by default: accounts are registered on this device (localAccounts.ts). With Supabase enabled
// (src/lib/supabase.ts) it uses Supabase auth instead.
const USER_KEY = 'session.user';
const PENDING_PROFILE_KEY = 'profile.pending';

export type ContactKind = 'email' | 'phone';

/** Thrown by `contactSignUp` when the contact already has an account: the flow then sends the person to sign in. */
export const ACCOUNT_EXISTS = 'ACCOUNT_EXISTS';

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
  const pendingCredential = useRef<Credential | null>(null);

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
        if (!supabase) return accounts.exists(contact);
        // Signed out, `profiles` is not readable, so ask the contact_exists function (migration 0003).
        // Without it, sign-up detects an existing account when the password is submitted instead.
        const { data, error } = await supabase.rpc('contact_exists', { p_contact: contact, p_kind: kind });
        if (error) return false;
        return data === true;
      },
      contactSignIn: async (contact, password, kind) => {
        if (!supabase) {
          const found = await accounts.verify(contact, password);
          if (!found) throw new Error('Incorrect password. Try again.');
          await signIn(found);
          return;
        }
        const creds = kind === 'email' ? { email: contact, password } : { phone: contact, password };
        const { data, error } = await supabase.auth.signInWithPassword(creds);
        if (error?.message?.toLowerCase().includes('confirm')) {
          throw new Error('Confirm your email first: open the link we sent you, then sign in.');
        }
        if (error || !data.user) throw new Error('Incorrect password. Try again.');
        const phone = kind === 'phone' ? contact : undefined;
        const email = kind === 'email' ? contact : undefined;
        let profile = await api.loadProfile(data.user.id, phone, email);
        if (!profile) {
          // Sign-up finished before the first session existed (email confirmation), so the profile was not saved yet.
          const stored = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
          const pending = stored ? (JSON.parse(stored) as { uid: string; profile: NewProfile }) : null;
          if (pending?.uid === data.user.id) {
            await api.saveProfile(data.user.id, phone, email, pending.profile);
            await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
            profile = await api.loadProfile(data.user.id, phone, email);
          }
        }
        if (!profile) throw new Error('Account not found.');
        await signIn(profile);
      },
      contactSignUp: async (contact, password, kind) => {
        if (!supabase) {
          if (await accounts.exists(contact)) throw new Error(ACCOUNT_EXISTS);
          pendingCredential.current = accounts.credential(password);
          if (kind === 'email') pendingEmail.current = contact;
          else pendingPhone.current = contact;
          return;
        }
        const creds = kind === 'email' ? { email: contact, password } : { phone: contact, password };
        const { data, error } = await supabase.auth.signUp(creds);
        // Already registered: Supabase answers with an error, or (email confirmation on) a user with no identities.
        if (error?.message?.toLowerCase().includes('already registered') || (data.user && data.user.identities?.length === 0)) {
          throw new Error(ACCOUNT_EXISTS);
        }
        // Never carry on without a real auth user: the profile would only exist on this device and the password
        // would later be rejected (this is what a rate limit or a failed confirmation email used to cause).
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('rate limit')) throw new Error('Too many sign-up emails right now. Wait a few minutes and try again.');
          if (message.includes('sending') && message.includes('email')) throw new Error("We couldn't send the confirmation email. Try again in a minute.");
          throw new Error(error.message);
        }
        if (!data.user) throw new Error('Sign up failed. Try again.');
        if (kind === 'email') pendingEmail.current = contact;
        else pendingPhone.current = contact;
        pendingUid.current = data.user.id;
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error('Passwords are stored on this device only, so they cannot be reset by email.');
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
      },
      completeProfile: async (profile) => {
        const phone = pendingPhone.current;
        const email = pendingEmail.current;
        const contact = phone ?? email;
        if (!contact) return;
        const uid = pendingUid.current;
        if (hasBackend && !uid) throw new Error('Your account was not created. Go back and try again.');
        const credential = pendingCredential.current;
        const next: User = { id: uid ?? credential?.id ?? contact, phone: phone ?? undefined, email: email ?? undefined, ...profile, name: profile.name.trim() };
        if (uid) {
          try {
            await api.saveProfile(uid, phone ?? undefined, email ?? undefined, { ...profile, name: next.name });
          } catch {
            // No session yet (email confirmation): keep the profile and save it on first sign-in.
            await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({ uid, profile: { ...profile, name: next.name } }));
          }
        } else {
          if (!credential) throw new Error('Your account was not created. Go back and try again.');
          await accounts.create(contact, credential, next);
          pendingCredential.current = null;
        }
        pendingPhone.current = null;
        pendingEmail.current = null;
        await signIn(next);
      },
      updateName: async (name) => {
        if (!user) return;
        const next = { ...user, name: name.trim() };
        if (hasBackend) await api.updateProfileName(user.id, next.name);
        else await accounts.update(next);
        await signIn(next);
      },
      updatePhoto: async (photoUri) => {
        if (!user) return;
        const next = { ...user, photoUri: photoUri ?? undefined };
        if (hasBackend) await api.updateProfilePhoto(user.id, photoUri);
        else await accounts.update(next);
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
