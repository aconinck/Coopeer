import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Static web rendering runs in Node with no window/localStorage: never persist there.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

/**
 * Supabase client, or null when the keys are not set (then the app runs on the in-memory demo data).
 * The anon key is public by design; Row Level Security in supabase/migrations decides what it can do.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: isServer ? undefined : AsyncStorage,
          autoRefreshToken: !isServer,
          persistSession: !isServer,
          detectSessionInUrl: false,
        },
      })
    : null;

export const hasBackend = supabase !== null;
