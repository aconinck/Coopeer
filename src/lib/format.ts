import { Alert, Linking, Platform, Share } from 'react-native';
import type { Place } from '../state/models';

export const time = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const weekday = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
export const monthDay = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function isTomorrow(date: Date, now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

export const dollars = (amount: number) => `$${amount}`;

/** Progressive US format: "(479) 555-0123". */
export function formatUSPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${area}`;
  if (digits.length <= 6) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${line}`;
}

export const TEAM_CODE_LENGTH = 8;

/** Accepts "12355654", "12 35 56 54", coopeer://join/12355654 or https://coopeer.app/join/12355654. */
export function extractTeamCode(raw: string): string | null {
  const trimmed = raw.trim();
  const compact = trimmed.replace(/\s/g, '');
  if (new RegExp(`^\\d{${TEAM_CODE_LENGTH}}$`).test(compact)) return compact;
  const match = trimmed.match(/join\/(\d[\d\s]*)/);
  if (!match) return null;
  const code = match[1].replace(/\D/g, '');
  return code.length === TEAM_CODE_LENGTH ? code : null;
}

export function openDirections(place: Place) {
  const url =
    Platform.OS === 'android'
      ? `geo:0,0?q=${place.latitude},${place.longitude}(${encodeURIComponent(place.name)})`
      : `https://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=d`;
  Linking.openURL(url);
}

export async function shareText(message: string, url?: string) {
  try {
    if (Platform.OS === 'web') {
      const nav = globalThis.navigator as Navigator | undefined;
      if (nav?.share) await nav.share({ text: message, url });
      else if (nav?.clipboard) {
        await nav.clipboard.writeText(url ? `${message} ${url}` : message);
        window.alert('Link copied');
      }
      return;
    }
    await Share.share(url ? { message: `${message} ${url}`, url } : { message });
  } catch {
    // Dismissed by the user.
  }
}

/** Destructive actions always confirm. */
export function confirmDestructive(title: string, message: string, actionLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
