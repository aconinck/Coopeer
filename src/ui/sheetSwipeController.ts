type SwipeCallbacks = { left?: () => void; right?: () => void };
let cbs: SwipeCallbacks = {};

/** Registered by the map screen to navigate between nearby places on a half-sheet horizontal swipe. */
export const sheetSwipeController = {
  register: (left?: () => void, right?: () => void) => {
    cbs = { left, right };
  },
  left: () => cbs.left?.(),
  right: () => cbs.right?.(),
};
