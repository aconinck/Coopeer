import { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  ZoomIn,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { mapColors } from '../constants/theme';
import type { Place } from '../state/models';
import { PlacePin, type PlaceSummary } from './PlacePin';
import { BENTONVILLE_CENTER, DEFAULT_SPAN, RENDER_HEIGHT, RENDER_WIDTH, project } from './projection';
import { streets, WORLD } from './streetData';

export interface StreetMapHandle {
  /** Glide the camera so `place` sits centered in the visible band [top, bottom] of the screen. */
  focus: (place: Place, visibleTop: number, visibleBottom: number) => void;
  recenter: () => void;
}

interface StreetMapProps {
  summaries: PlaceSummary[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
  onBackgroundPress?: () => void;
}

const CAMERA_SPRING = { damping: 22, stiffness: 110, mass: 1 } as const;

/** Grayscale, streets-only map of Bentonville drawn in SVG. Same look on iOS, Android and web. */
export const StreetMap = forwardRef<StreetMapHandle, StreetMapProps>(function StreetMap(
  { summaries, selectedId, onSelect, onBackgroundPress },
  ref,
) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const baseScale = size.width > 0 ? size.width / DEFAULT_SPAN : 0.7;
  const minScale = baseScale * 0.55;
  const maxScale = baseScale * 2.4;

  const scale = useSharedValue(0.7);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const ready = useSharedValue(0);

  const centerOn = (point: { x: number; y: number }, s: number, centerY: number, animate: boolean) => {
    const nextX = size.width / 2 - point.x * s;
    const nextY = centerY - point.y * s;
    if (animate) {
      scale.value = withSpring(s, CAMERA_SPRING);
      tx.value = withSpring(nextX, CAMERA_SPRING);
      ty.value = withSpring(nextY, CAMERA_SPRING);
    } else {
      scale.value = s;
      tx.value = nextX;
      ty.value = nextY;
    }
  };

  useImperativeHandle(ref, () => ({
    focus: (place, visibleTop, visibleBottom) => {
      const target = Math.min(Math.max(scale.value, baseScale * 1.35), maxScale);
      centerOn(project(place.latitude, place.longitude), target, (visibleTop + visibleBottom) / 2, true);
    },
    recenter: () => centerOn(BENTONVILLE_CENTER, baseScale, size.height * 0.42, true),
  }));

  const onLayout = (width: number, height: number) => {
    const first = size.width === 0;
    setSize({ width, height });
    if (first) {
      const s = width / DEFAULT_SPAN;
      scale.value = s;
      tx.value = width / 2 - BENTONVILLE_CENTER.x * s;
      ty.value = height * 0.42 - BENTONVILLE_CENTER.y * s;
      ready.value = 1;
    }
  };

  const { width, height } = size;

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      const s = scale.value;
      const slackX = width * 0.4;
      const slackY = height * 0.4;
      tx.value = withDecay({
        velocity: e.velocityX,
        deceleration: 0.996,
        clamp: [width - RENDER_WIDTH * s - slackX, slackX],
      });
      ty.value = withDecay({
        velocity: e.velocityY,
        deceleration: 0.996,
        clamp: [height - RENDER_HEIGHT * s - slackY, slackY],
      });
    });

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      startScale.value = scale.value;
      startX.value = tx.value;
      startY.value = ty.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const raw = startScale.value * e.scale;
      // Soft limits: resist beyond min/max instead of stopping dead.
      const next = raw > maxScale ? maxScale + (raw - maxScale) * 0.2 : raw < minScale ? minScale - (minScale - raw) * 0.2 : raw;
      const ratio = next / startScale.value;
      scale.value = next;
      tx.value = focalX.value - (focalX.value - startX.value) * ratio;
      ty.value = focalY.value - (focalY.value - startY.value) * ratio;
    })
    .onEnd(() => {
      const clamped = Math.min(Math.max(scale.value, minScale), maxScale);
      if (clamped !== scale.value) {
        const ratio = clamped / scale.value;
        tx.value = withSpring(focalX.value - (focalX.value - tx.value) * ratio, CAMERA_SPRING);
        ty.value = withSpring(focalY.value - (focalY.value - ty.value) * ratio, CAMERA_SPRING);
        scale.value = withSpring(clamped, CAMERA_SPRING);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const next = Math.min(scale.value * 1.7, maxScale);
      const ratio = next / scale.value;
      tx.value = withSpring(e.x - (e.x - tx.value) * ratio, CAMERA_SPRING);
      ty.value = withSpring(e.y - (e.y - ty.value) * ratio, CAMERA_SPRING);
      scale.value = withSpring(next, CAMERA_SPRING);
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    if (onBackgroundPress) runOnJS(onBackgroundPress)();
  });

  const gesture = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, singleTap));

  const layerStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));


  return (
    <View
      style={[StyleSheet.absoluteFill, styles.ground]}
      onLayout={(e) => onLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
    >
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.layer, layerStyle]}>
            <StreetLayer />
          </Animated.View>
        </View>
      </GestureDetector>

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {width > 0 &&
          summaries.map((summary, index) => (
            <Marker
              key={summary.place.id}
              summary={summary}
              index={index}
              selected={summary.place.id === selectedId}
              dimmed={selectedId !== null && summary.place.id !== selectedId}
              scale={scale}
              tx={tx}
              ty={ty}
              baseScale={baseScale}
              onPress={() => onSelect(summary.place)}
            />
          ))}
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
});

const StreetLayer = memo(function StreetLayer() {
  return (
    <Svg width={RENDER_WIDTH} height={RENDER_HEIGHT} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}>
      <Path d={streets.minor} stroke={mapColors.street} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={streets.mid} stroke={mapColors.street} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={streets.major} stroke={mapColors.majorCasing} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={streets.major} stroke={mapColors.street} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
});

function Marker({
  summary,
  index,
  selected,
  dimmed,
  scale,
  tx,
  ty,
  baseScale,
  onPress,
}: {
  summary: PlaceSummary;
  index: number;
  selected: boolean;
  dimmed: boolean;
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  baseScale: number;
  onPress: () => void;
}) {
  const point = project(summary.place.latitude, summary.place.longitude);
  const pressed = useSharedValue(0);

  const position = useAnimatedStyle(() => ({
    transform: [{ translateX: point.x * scale.value + tx.value }, { translateY: point.y * scale.value + ty.value }],
  }));

  const pinStyle = useAnimatedStyle(() => ({
    opacity: withSpring(dimmed ? 0.45 : 1),
    transform: [
      {
        translateY: withSpring(selected ? -6 : 0, {
          damping: 12,
          stiffness: 220,
        }),
      },
      {
        scale: withSpring((selected ? 1.18 : 1) * (1 - pressed.value * 0.1), {
          damping: 12,
          stiffness: 260,
        }),
      },
    ],
  }));

  // Place names fade in as you zoom in, keeping the zoomed-out map clean.
  const nameStyle = useAnimatedStyle(() => ({
    opacity: selected ? 1 : interpolate(scale.value, [baseScale * 0.85, baseScale * 1.1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.anchor, { zIndex: selected ? 3 : summary.live ? 2 : 1 }, position]}>
      <View pointerEvents="box-none" style={styles.pinBox}>
        <Animated.View
          entering={ZoomIn.springify()
            .damping(13)
            .delay(120 + index * 70)}
        >
          <Animated.View style={pinStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={summary.place.name}
              onPress={onPress}
              onPressIn={() => {
                pressed.value = 1;
              }}
              onPressOut={() => {
                pressed.value = 0;
              }}
              hitSlop={8}
            >
              <PlacePin summary={summary} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(300 + index * 70)} pointerEvents="none" style={styles.nameBox}>
        <Animated.Text numberOfLines={1} style={[styles.name, nameStyle]}>
          {summary.place.name}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const PIN_BOX = 240;

const styles = StyleSheet.create({
  ground: { backgroundColor: mapColors.ground, overflow: 'hidden' },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: RENDER_WIDTH,
    height: RENDER_HEIGHT,
    transformOrigin: 'left top',
  },
  anchor: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  pinBox: {
    position: 'absolute',
    bottom: 0,
    left: -PIN_BOX / 2,
    width: PIN_BOX,
    alignItems: 'center',
  },
  nameBox: { position: 'absolute', top: 3, left: -PIN_BOX / 2, width: PIN_BOX },
  name: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: mapColors.pinName,
    textShadowColor: mapColors.street,
    textShadowRadius: 4,
  },
  attribution: {
    position: 'absolute',
    right: 8,
    top: 4,
    fontSize: 9,
    color: mapColors.pinName,
    opacity: 0.5,
  },
});
