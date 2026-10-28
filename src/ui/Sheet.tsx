import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, type } from '../constants/theme';
import { spring } from '../constants/motion';
import { AttendeesDetail } from '../details/AttendeesDetail';
import { ClubDetail } from '../details/ClubDetail';
import { GameDetail } from '../details/GameDetail';
import { PlaceDetail } from '../details/PlaceDetail';
import { IconButton } from './Buttons';
import { DetailHost, type DetailLayoutProps, type DetailNav, type SheetRoute } from './DetailLayout';
import { Glass } from './Glass';
import { sheetController } from './sheetController';

/** Sheets glide without bounce; gestures hand their release velocity to this spring. */
export const SPRING = spring.smooth;
/** Fraction of the screen the sheet covers at its resting ("half") height. */
export const SHEET_HALF = 0.52;

type Direction = 'open' | 'forward' | 'back';

interface SheetState {
  /** The first route of the current stack — what was tapped on the map or in a list. */
  root: SheetRoute | null;
  isOpen: boolean;
}

const StateContext = createContext<SheetState>({ root: null, isOpen: false });
export const useSheet = () => useContext(StateContext);

interface Chrome {
  pan: ReturnType<typeof Gesture.Pan>;
  canGoBack: boolean;
  back: () => void;
  close: () => void;
  toggle: () => void;
  expand: () => void;
  y: SharedValue<number>;
  half: number;
}

const ChromeContext = createContext<Chrome | null>(null);

// Routes where the sheet steps aside (full-screen flows presented above it).
const HIDDEN_ON = ['/auth', '/join', '/invite', '/welcome', '/create', '/personal-info', '/payments', '/how-it-works'];

const detentHaptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export function SheetProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<SheetRoute[]>([]);
  const [direction, setDirection] = useState<Direction>('open');
  const [openToken, setOpenToken] = useState(0);
  const [closing, setClosing] = useState(false);

  const open = useCallback((route: SheetRoute) => {
    setDirection('open');
    setClosing(false);
    setStack([route]);
    setOpenToken((n) => n + 1);
  }, []);
  const push = useCallback((route: SheetRoute) => {
    setDirection('forward');
    setStack((current) => [...current, route]);
  }, []);
  const back = useCallback(() => {
    setDirection('back');
    setStack((current) => current.slice(0, -1));
  }, []);
  const clear = useCallback(() => {
    setStack([]);
    setClosing(false);
  }, []);
  const beginClose = useCallback(() => setClosing(true), []);

  // isOpen flips as soon as closing starts, so the map and drawer react in sync with the sheet.
  const state = useMemo<SheetState>(
    () => ({ root: stack[0] ?? null, isOpen: stack.length > 0 && !closing }),
    [stack, closing],
  );

  return (
    <StateContext.Provider value={state}>
      {children}
      <SheetHost
        stack={stack}
        direction={direction}
        openToken={openToken}
        open={open}
        push={push}
        back={back}
        clear={clear}
        beginClose={beginClose}
      />
    </StateContext.Provider>
  );
}

function SheetHost({
  stack,
  direction,
  openToken,
  open,
  push,
  back,
  clear,
  beginClose,
}: {
  stack: SheetRoute[];
  direction: Direction;
  openToken: number;
  open: (route: SheetRoute) => void;
  push: (route: SheetRoute) => void;
  back: () => void;
  clear: () => void;
  beginClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((prefix) => pathname.startsWith(prefix));

  const sheetHeight = height - insets.top - space.sm;
  const full = 0;
  const half = sheetHeight - height * SHEET_HALF;
  const closed = sheetHeight + 40;

  const y = useSharedValue(closed);
  const start = useSharedValue(0);
  const [atFull, setAtFull] = useState(false);
  const isOpen = stack.length > 0;

  const close = useCallback(() => {
    beginClose();
    y.value = withSpring(closed, SPRING, (finished) => {
      if (finished) runOnJS(clear)();
    });
    setAtFull(false);
  }, [closed, clear, beginClose, y]);

  const snapTo = useCallback(
    (target: 'half' | 'full') => {
      y.value = withSpring(target === 'full' ? full : half, SPRING);
      setAtFull(target === 'full');
    },
    [half, y],
  );

  useEffect(() => {
    sheetController.register({ open, close });
    return () => sheetController.register(null);
  }, [open, close]);

  // Every new open rises to half height (or stays where it is if already open).
  useEffect(() => {
    if (openToken === 0) return;
    if (y.value > half) {
      y.value = withSpring(half, SPRING);
      setAtFull(false);
    }
  }, [openToken, half, y]);

  useEffect(() => {
    if (!isOpen || Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) back();
      else close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, stack.length, back, close]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-6, 6])
        .onStart(() => {
          start.value = y.value;
        })
        .onUpdate((e) => {
          const next = start.value + e.translationY;
          // Rubber-band above the top snap.
          y.value = next < full ? full + (next - full) * 0.22 : next;
        })
        .onEnd((e) => {
          const projected = y.value + e.velocityY * 0.18;
          if (projected > half + 90) {
            runOnJS(beginClose)();
            y.value = withSpring(closed, { ...SPRING, velocity: e.velocityY }, (finished) => {
              if (finished) runOnJS(clear)();
            });
            runOnJS(setAtFull)(false);
            return;
          }
          const target = projected < half / 2 ? full : half;
          y.value = withSpring(target, { ...SPRING, velocity: e.velocityY });
          runOnJS(detentHaptic)();
          runOnJS(setAtFull)(target === full);
        }),
    [closed, half, clear, beginClose, start, y],
  );

  // The sheet grows/shrinks (height) between full and half, and only slides (translate) below half.
  // Its bottom stays on the screen edge, so the action bar and scroll area are always reachable.
  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight - Math.min(y.value, half),
    transform: [{ translateY: Math.max(0, y.value - half) }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [full, half], [1, 0], Extrapolation.CLAMP),
  }));

  const nav = useMemo<DetailNav>(
    () => ({
      place: (id) => push({ kind: 'place', id }),
      game: (id) => push({ kind: 'game', id }),
      club: (id) => push({ kind: 'club', id }),
      attendees: (id) => push({ kind: 'attendees', id }),
    }),
    [push],
  );

  const chrome = useMemo<Chrome>(
    () => ({
      pan,
      canGoBack: stack.length > 1,
      back,
      close,
      toggle: () => snapTo(atFull ? 'half' : 'full'),
      expand: () => {
        if (!atFull) snapTo('full');
      },
      y,
      half,
    }),
    [pan, stack.length, back, close, snapTo, atFull, y, half],
  );

  const top = stack[stack.length - 1];
  const slide = (builder: typeof SlideInRight | typeof SlideInLeft) =>
    builder.springify().mass(1).stiffness(SPRING.stiffness).damping(SPRING.damping);
  const entering = direction === 'forward' ? slide(SlideInRight) : direction === 'back' ? slide(SlideInLeft) : FadeIn.duration(200);
  const exiting = direction === 'forward' ? SlideOutLeft.duration(220) : direction === 'back' ? SlideOutRight.duration(220) : FadeOut.duration(120);

  return (
    <View pointerEvents={hidden ? 'none' : 'box-none'} style={[StyleSheet.absoluteFill, styles.host, hidden && styles.hidden]} aria-hidden={hidden}>
      <Animated.View pointerEvents={atFull && isOpen ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Collapse" onPress={() => snapTo('half')} />
      </Animated.View>
      <Animated.View
        pointerEvents={isOpen ? 'box-none' : 'none'}
        style={[styles.sheet, sheetStyle]}
      >
        <Glass radius={radius.sheet} style={styles.glass}>
          <ChromeContext.Provider value={chrome}>
            <DetailHost layout={SheetLayout} nav={nav}>
              {top && (
                <Animated.View key={`${stack.length}-${top.kind}-${top.id}`} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
                  <RouteContent route={top} />
                </Animated.View>
              )}
            </DetailHost>
          </ChromeContext.Provider>
        </Glass>
      </Animated.View>
    </View>
  );
}

function RouteContent({ route }: { route: SheetRoute }) {
  switch (route.kind) {
    case 'place':
      return <PlaceDetail id={route.id} />;
    case 'game':
      return <GameDetail id={route.id} />;
    case 'club':
      return <ClubDetail id={route.id} />;
    case 'attendees':
      return <AttendeesDetail id={route.id} />;
  }
}

/** How a detail looks inside the sheet: draggable header, scrolling body, pinned action bar. */
function SheetLayout({ title, trailing, footer, children }: DetailLayoutProps) {
  const chrome = useContext(ChromeContext);
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);


  if (!chrome) return null;

  return (
    <View style={styles.flex}>
      <GestureDetector gesture={chrome.pan}>
        <View collapsable={false} style={[styles.header, styles.noSelect]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Resize sheet" onPress={chrome.toggle} style={styles.grabberHit}>
            <View style={styles.grabber} />
          </Pressable>
          <View style={styles.headerRow}>
            <IconButton
              icon={chrome.canGoBack ? 'chevron-back' : 'close'}
              label={chrome.canGoBack ? 'Back' : 'Close'}
              onPress={chrome.canGoBack ? chrome.back : chrome.close}
            />
            <Text style={[type.headline, styles.title]} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.trailing}>{trailing}</View>
          </View>
        </View>
      </GestureDetector>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: footerHeight + insets.bottom + space.xxl }]}
        onScrollBeginDrag={chrome.expand}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {footer ? (
        <Animated.View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          {footer}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Clip the off-screen part of the sheet so browsers don't scroll the whole app to reveal it.
  host: { overflow: 'hidden' },
  noSelect: { userSelect: 'none' } as never,
  // display:none so nothing inside can catch touches while a full-screen flow is on top.
  hidden: { display: 'none' },
  backdrop: { backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  glass: { flex: 1, overflow: 'hidden', userSelect: 'none' } as never,
  header: { paddingHorizontal: space.lg, paddingBottom: space.xs },
  grabberHit: { alignItems: 'center', paddingTop: space.sm, paddingBottom: space.xs },
  grabber: { width: 40, height: 5, borderRadius: radius.full, backgroundColor: colors.label3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { flex: 1, textAlign: 'center' },
  trailing: { minWidth: 44, alignItems: 'flex-end' },
  body: { padding: space.lg, gap: space.md },
  footer: { position: 'absolute', left: space.md, right: space.md, bottom: 0 },
});
