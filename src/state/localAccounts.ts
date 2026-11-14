import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256 } from '../lib/hash';
import type { User } from './models';

/**
 * Local accounts: what sign-up registers on this device (AsyncStorage). Keyed by the normalized contact
 * (lowercase email or +1 phone). The password is stored salted and hashed, never in clear text.
 */
const KEY = 'local.accounts.v1';

export interface LocalAccount {
  id: string;
  salt: string;
  hash: string;
  user: User;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Credential {
  id: string;
  salt: string;
  hash: string;
}

type Book = Record<string, LocalAccount>;

async function read(): Promise<Book> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}') as Book;
  } catch {
    return {};
  }
}

const write = (book: Book) => AsyncStorage.setItem(KEY, JSON.stringify(book));

const randomId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const hashWith = (salt: string, password: string) => sha256(`${salt}:${password}`);

export const accounts = {
  async exists(contact: string): Promise<boolean> {
    return !!(await read())[contact];
  },

  /** Salted hash for a new password; the account itself is saved once the profile is complete. */
  credential(password: string): Credential {
    const salt = randomId('s');
    return { id: randomId('u_'), salt, hash: hashWith(salt, password) };
  },

  async create(contact: string, credential: Credential, user: User): Promise<void> {
    const book = await read();
    book[contact] = { ...credential, user: { ...user, id: credential.id }, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
    await write(book);
  },

  /** The account's user when the password matches, otherwise null. */
  async verify(contact: string, password: string): Promise<User | null> {
    const book = await read();
    const account = book[contact];
    if (!account || account.hash !== hashWith(account.salt, password)) return null;
    account.lastLoginAt = new Date().toISOString();
    await write(book);
    return account.user;
  },

  async update(user: User): Promise<void> {
    const book = await read();
    const key = Object.keys(book).find((contact) => book[contact].id === user.id);
    if (!key) return;
    book[key] = { ...book[key], user };
    await write(book);
  },
};
