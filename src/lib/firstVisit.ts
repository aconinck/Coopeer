let _cascadePending = false;

/** Call after the discovery screen so TileFeed knows to stagger its sections in. */
export const triggerCascade = () => {
  _cascadePending = true;
};

/** Read and clear the flag; returns true once after triggerCascade(). */
export const consumeCascade = (): boolean => {
  const v = _cascadePending;
  _cascadePending = false;
  return v;
};
