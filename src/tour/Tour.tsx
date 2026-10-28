import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, shadow, space, type } from '../constants/theme';
import { haptic } from '../ui/Buttons';

export type TourTargetId = 'modes' | 'drawer' | 'create' | 'tabs';

interface TourStep {
  target?: TourTargetId;
  title: string;
  body: string;
}

/** First-run guided tour of the map screen, shown once right after sign-up. */
const steps: TourStep[] = [
  { title: 'Welcome to Coopeer', body: 'A quick look around. It takes 20 seconds.' },
  { target: 'modes', title: 'What to show', body: 'Everything, only clubs or only matches. Tap Now to see just what is live.' },
  { title: 'Every pin is a place', body: 'Parks, fields, courts and trails. Orange shows a game later today, a red circle means it is live. Tap one to see it.' },
  { target: 'drawer', title: 'Search and filter', body: 'Pick a sport or search a place, club or game. Drag up for the full list.' },
  { target: 'create', title: 'Create new', body: 'Start a game at any place, or set up a club that plays every week.' },
  { target: 'tabs', title: 'Everything else', body: 'Your clubs, the feed, your schedule and your profile.' },
];

const PENDING_KEY = 'tour.pending';
let notify: (() => void) | null = null;

/** Queue the tour (after sign-up). It starts as soon as the tabs are on screen. */
export async function requestTour() {
  await AsyncStorage.setItem(PENDING_KEY, '1');
  notify?.();
}

type Rect = { x: number; y: number; width: number; height: number };

const TourContext = createContext<{ register: (id: TourTargetId, ref: RefObject<View | null>) => () => void } | null>(null);

/** Attach the returned ref to the View the tour should spotlight (keep `collapsable={false}`). */
export function useTourTarget(id: TourTargetId) {
  const ctx = useContext(TourContext);
  const ref = useRef<View>(null);
  useEffect(() => ctx?.register(id, ref), [ctx, id]);
  return ref;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<TourTargetId, RefObject<View | null>>());
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const start = useCallback(async () => {
    if ((await AsyncStorage.getItem(PENDING_KEY)) !== '1') return;
    // Let the map, drawer and tab bar settle before measuring them.
    setTimeout(() => setStep(0), 900);
  }, []);

  useEffect(() => {
    notify = start;
    start();
    return () => {
      notify = null;
    };
  }, [start]);

  const current = step === null ? null : steps[step];

  useEffect(() => {
    setRect(null);
    const id = current?.target;
    if (!id) return;
    const node = targets.current.get(id)?.current;
    // Skip steps whose target is not on screen (e.g. they landed on Clubs instead of the map).
    const skip = () =>
      setStep((s) => {
        if (s !== null && s < steps.length - 1) return s + 1;
        AsyncStorage.removeItem(PENDING_KEY);
        return null;
      });
    if (!node) {
      skip();
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setRect({ x, y, width, height });
      else skip();
    });
  }, [current]);

  const end = useCallback(() => {
    setStep(null);
    AsyncStorage.removeItem(PENDING_KEY);
  }, []);

  const next = useCallback(() => {
    haptic.selection();
    if (step === null) return;
    if (step >= steps.length - 1) end();
    else setStep(step + 1);
  }, [step, end]);

  const value = useMemo(
    () => ({
      register: (id: TourTargetId, ref: RefObject<View | null>) => {
        targets.current.set(id, ref);
        return () => {
          if (targets.current.get(id) === ref) targets.current.delete(id);
        };
      },
    }),
    [],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {current && step !== null && <TourOverlay step={current} index={step} rect={current.target ? rect : null} onNext={next} onSkip={end} />}
    </TourContext.Provider>
  );
}

const PAD = 6;
const HOLE = 2400;

function TourOverlay({ step, index, rect, onNext, onSkip }: { step: TourStep; index: number; rect: Rect | null; onNext: () => void; onSkip: () => void }) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const last = index === steps.length - 1;
  const waiting = !!step.target && !rect;

  const hole = rect && {
    left: rect.x - PAD - HOLE,
    top: rect.y - PAD - HOLE,
    width: rect.width + PAD * 2 + HOLE * 2,
    height: rect.height + PAD * 2 + HOLE * 2,
    borderRadius: Math.min(rect.height / 2 + PAD, 32) + HOLE,
  };

  // Card goes below a target in the top half, above one in the bottom half, centered otherwise.
  const below = rect ? rect.y + rect.height / 2 < height / 2 : false;
  const cardPosition = rect
    ? below
      ? { top: rect.y + rect.height + PAD + space.md }
      : { bottom: height - rect.y + PAD + space.md }
    : { top: height * 0.36 };

  const fade = reduceMotion ? undefined : FadeIn.duration(220);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      {hole ? <View pointerEvents="none" style={[styles.hole, hole]} /> : <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim]} />}
      <Pressable style={StyleSheet.absoluteFill} onPress={onNext} accessibilityLabel="Next tip" />
      {!waiting && (
        <Animated.View key={index} entering={fade} exiting={reduceMotion ? undefined : FadeOut.duration(120)} style={[styles.cardWrap, cardPosition]} pointerEvents="box-none">
          <View style={styles.card} accessibilityLiveRegion="polite">
            <Text style={[type.caption, styles.count]}>
              {index + 1} of {steps.length}
            </Text>
            <Text style={type.title3}>{step.title}</Text>
            <Text style={[type.subhead, styles.body]}>{step.body}</Text>
            <View style={styles.actions}>
              {!last ? (
                <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={10}>
                  <Text style={[type.subhead, styles.skip]}>Skip tour</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable accessibilityRole="button" onPress={onNext} style={({ pressed }) => [styles.next, pressed && styles.pressed]}>
                <Text style={[type.subhead, styles.nextText]}>{last ? 'Start playing' : index === 0 ? 'Show me' : 'Next'}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const DIM = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  dim: { backgroundColor: DIM },
  hole: { position: 'absolute', borderWidth: HOLE, borderColor: DIM },
  cardWrap: { position: 'absolute', left: space.lg, right: space.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg + 4, gap: space.xs, ...shadow.card },
  count: { color: colors.label2, fontWeight: '600' },
  body: { color: colors.label2 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  skip: { color: colors.label2, fontWeight: '600' },
  next: { height: 44, paddingHorizontal: 22, borderRadius: radius.full, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: colors.white, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
