import { router } from 'expo-router';
import { openPlayer } from '../ui/DetailLayout';
import { sheetController } from '../ui/sheetController';

// Anything tapped on the map or in a list opens in the bottom sheet.
// "Your Clubs" opens a club as a full page (Figma club page).
export const open = {
  place: (id: string) => sheetController.open({ kind: 'place', id }),
  game: (id: string) => sheetController.open({ kind: 'game', id }),
  club: (id: string) => sheetController.open({ kind: 'club', id }),
  player: (id: string) => openPlayer(id),
  clubPage: (id: string) => {
    sheetController.close();
    router.push(`/club/${id}`);
  },
};
