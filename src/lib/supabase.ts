import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Accounts and data are local (this device) unless this is switched on explicitly.
const enabled = process.env.EXPO_PUBLIC_USE_SUPABASE === 'true';
// Static web rendering runs in Node with no window/localStorage: never persist there.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

/**
 * Supabase client, or null unless EXPO_PUBLIC_USE_SUPABASE=true and the keys are set (then accounts and data stay on this device).
 * The anon key is public by design; Row Level Security in supabase/migrations decides what it can do.
 */
export const supabase: SupabaseClient | null =
  enabled && url && anonKey
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
