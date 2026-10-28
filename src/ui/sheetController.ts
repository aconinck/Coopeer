import type { SheetRoute } from './DetailLayout';

// Lets plain functions (open.game etc.) talk to the mounted <SheetProvider>.
interface SheetApi {
  open: (route: SheetRoute) => void;
  close: () => void;
}

let api: SheetApi | null = null;

export const sheetController = {
  register: (next: SheetApi | null) => {
    api = next;
  },
  open: (route: SheetRoute) => api?.open(route),
  close: () => api?.close(),
};
