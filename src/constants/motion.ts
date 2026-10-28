import { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

// Motion follows Apple's model (WWDC23 "Animate with springs"): a spring is described by a
// perceptual duration and a bounce. Bounce 0 is the default and right for almost all UI;
// ~0.1–0.15 is the most a control should ever show. Interrupted animations keep their velocity,
// so gestures hand their release velocity to the spring instead of adding bounce.
//
//   mass = 1, stiffness = (2π / duration)², damping = 4π(1 − bounce) / duration   (bounce ≥ 0)

export function appleSpring(duration: number, bounce = 0) {
  const stiffness = ((2 * Math.PI) / duration) ** 2;
  const damping = bounce >= 0 ? (4 * Math.PI * (1 - bounce)) / duration : (4 * Math.PI) / (duration * (1 + bounce));
  return { mass: 1, stiffness, damping };
}

export const spring = {
  /** Default for state changes, sheets, page transitions, layout. No overshoot. */
  smooth: appleSpring(0.5),
  /** Small controls that track a choice: segmented pill, tab pill, chips. Barely-there bounce. */
  snappy: appleSpring(0.35, 0.1),
  /** Press release and tiny flips. */
  quick: appleSpring(0.25),
  /** Map camera glides. */
  camera: appleSpring(0.75),
} as const;

export const timing = {
  /** Press-down: fast and linear-feeling, then release with spring.quick. */
  press: { duration: 90, easing: Easing.out(Easing.quad) },
  fade: { duration: 220, easing: Easing.out(Easing.quad) },
  slow: { duration: 600, easing: Easing.out(Easing.quad) },
} as const;

/** How far controls dip when pressed. Apple keeps this subtle. */
export const pressScale = 0.97;

/** List entrance: a plain fade with a tiny stagger (capped), never a slide or pop. */
export const enter = (index = 0) => FadeIn.duration(260).delay(Math.min(index, 6) * 30);
export const exit = () => FadeOut.duration(160);

// Haptics, Apple-style: selection for discrete choices (tabs, segments, chips, pickers),
// a light impact when a sheet snaps to a detent, success/error notifications for outcomes.
// Ordinary button taps get no haptic.
