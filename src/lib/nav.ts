import { router } from 'expo-router';

// Places and clubs open as pages; games always open as a sheet.
export const open = {
  place: (id: string) => router.push(`/place/${id}`),
  game: (id: string) => router.push(`/game/${id}`),
  club: (id: string) => router.push(`/club/${id}`),
  /** From inside a sheet: close sheets first so the club page isn't trapped under them. */
  clubFromSheet: (id: string) => {
    if (router.canDismiss()) router.dismissAll();
    router.push(`/club/${id}`);
  },
};
