import { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { colors, mapColors } from '../constants/theme';
import { spring } from '../constants/motion';
import type { Place } from '../state/models';
import { PlacePin, type PlaceSummary } from './PlacePin';
import { BENTONVILLE_CENTER, DEFAULT_SPAN, MAP_BOUNDS, RENDER, RENDER_HEIGHT, RENDER_WIDTH, project } from './projection';
import { parks, pitches, WORLD, type Pitch } from './mapData';
import { TileLayer } from './TileLayer';
import { UserDot } from './UserDot';

export interface StreetMapHandle {
  /** Glide the camera so a point sits centered in the visible band [top, bottom] of the screen. */
  focus: (point: { latitude: number; longitude: number }, visibleTop: number, visibleBottom: number) => void;
  recenter: () => void;
  /** Glide to the player's position (keeps the current zoom unless zoomed far out). */
  locate: (point: { latitude: number; longitude: number }, visibleTop: number, visibleBottom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Zoom out (never in past the default view) so every point sits inside the visible band [top, bottom]. */
  fit: (points: { latitude: number; longitude: number }[], visibleTop: number, visibleBottom: number) => void;
}

interface StreetMapProps {
  summaries: PlaceSummary[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
  onBackgroundPress?: () => void;
  /** Tapping an illustrated soccer field or pickleball court. */
  onPitchPress?: (pitch: Pitch) => void;
  selectedPitchId?: string | null;
  /** The player's current position (blue dot). */
  userLocation?: { latitude: number; longitude: number } | null;
  /** Fires when the player moves the camera by hand (pan, pinch, double tap). */
  onUserMove?: () => void;
  /** Where the OSM/CARTO credit sits (below any overlay on top of the map). */
  attributionTop?: number;
}

const CAMERA_SPRING = spring.camera;

/**
 * Apple Maps–like grayscale map of Bentonville drawn in SVG (same look on iOS, Android, web).
 * Zoomed out it shows only parks and main roads; residential streets and street names
 * fade in as you zoom. Soccer fields and pickleball courts are drawn as small illustrations.
 */
export const StreetMap = forwardRef<StreetMapHandle, StreetMapProps>(function StreetMap(
  { summaries, selectedId, onSelect, onBackgroundPress, onPitchPress, selectedPitchId = null, userLocation = null, onUserMove, attributionTop = 4 },
  ref,
) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const baseScale = size.width > 0 ? size.width / DEFAULT_SPAN : 0.7;
  const minScale = baseScale * 0.1;
  const maxScale = baseScale * 5;

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
    focus: (point, visibleTop, visibleBottom) => {
      const target = Math.min(Math.max(scale.value, baseScale * 1.35), maxScale);
      centerOn(project(point.latitude, point.longitude), target, (visibleTop + visibleBottom) / 2, true);
    },
    recenter: () => centerOn(BENTONVILLE_CENTER, baseScale, size.height * 0.42, true),
    locate: (point, visibleTop, visibleBottom) => {
      const target = Math.min(Math.max(scale.value, baseScale), maxScale);
      centerOn(project(point.latitude, point.longitude), target, (visibleTop + visibleBottom) / 2, true);
    },
    fit: (points, visibleTop, visibleBottom) => {
      if (points.length === 0 || size.width === 0) return;
      const rendered = points.map((p) => project(p.latitude, p.longitude));
      const xs = rendered.map((p) => p.x);
      const ys = rendered.map((p) => p.y);
      const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
      const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
      const pad = 56;
      const fitX = (size.width - pad * 2) / Math.max(maxX - minX, 1);
      const fitY = (visibleBottom - visibleTop - pad * 2) / Math.max(maxY - minY, 1);
      const target = Math.min(Math.max(Math.min(fitX, fitY, baseScale), minScale), maxScale);
      centerOn({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, target, (visibleTop + visibleBottom) / 2, true);
    },
    zoomIn: () => zoomBy(1.7),
    zoomOut: () => zoomBy(1 / 1.7),
  }));

  // Zoom about the middle of the visible map band (above the drawer).
  const zoomBy = (factor: number) => {
    const next = Math.min(Math.max(scale.value * factor, minScale), maxScale);
    const ratio = next / scale.value;
    const cx = size.width / 2;
    const cy = size.height * 0.42;
    tx.value = withSpring(cx - (cx - tx.value) * ratio, CAMERA_SPRING);
    ty.value = withSpring(cy - (cy - ty.value) * ratio, CAMERA_SPRING);
    scale.value = withSpring(next, CAMERA_SPRING);
  };

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

  const movedByUser = () => onUserMove?.();

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      runOnJS(movedByUser)();
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
        clamp: [width - MAP_BOUNDS.right * s - slackX, -MAP_BOUNDS.left * s + slackX],
      });
      ty.value = withDecay({
        velocity: e.velocityY,
        deceleration: 0.996,
        clamp: [height - MAP_BOUNDS.bottom * s - slackY, -MAP_BOUNDS.top * s + slackY],
      });
    });

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      runOnJS(movedByUser)();
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
      runOnJS(movedByUser)();
      const next = Math.min(scale.value * 1.7, maxScale);
      const ratio = next / scale.value;
      tx.value = withSpring(e.x - (e.x - tx.value) * ratio, CAMERA_SPRING);
      ty.value = withSpring(e.y - (e.y - ty.value) * ratio, CAMERA_SPRING);
      scale.value = withSpring(next, CAMERA_SPRING);
    });

  // A tap on a field/court selects it; anywhere else is a background tap.
  const handleTap = (x: number, y: number) => {
    const s = scale.value;
    const wx = (x - tx.value) / s / RENDER;
    const wy = (y - ty.value) / s / RENDER;
    const pad = 10 / (s * RENDER);
    const hit = pitches.find((p) => {
      const a = (-p.angle * Math.PI) / 180;
      const dx = wx - p.x;
      const dy = wy - p.y;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      return Math.abs(lx) <= p.length / 2 + pad && Math.abs(ly) <= p.width / 2 + pad;
    });
    if (hit && onPitchPress) onPitchPress(hit);
    else onBackgroundPress?.();
  };

  const singleTap = Gesture.Tap().onEnd((e) => {
    runOnJS(handleTap)(e.x, e.y);
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
            <TileLayer scale={scale} tx={tx} ty={ty} width={width} height={height} />
            <ParkLayer />
            <View style={StyleSheet.absoluteFill}>
              <PitchLayer selectedPitchId={selectedPitchId} />
            </View>
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

      {width > 0 && userLocation && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <UserMarker point={userLocation} scale={scale} tx={tx} ty={ty} />
        </View>
      )}
      <Text style={[styles.attribution, { top: attributionTop }]}>© OpenStreetMap contributors © CARTO</Text>
    </View>
  );
});

const VIEWBOX = `0 0 ${WORLD.width} ${WORLD.height}`;

/** Park footprints from OpenStreetMap, a soft tint over the tiles so the main parks read at a glance. */
const ParkLayer = memo(function ParkLayer() {
  return (
    <Svg style={StyleSheet.absoluteFill} width={RENDER_WIDTH} height={RENDER_HEIGHT} viewBox={VIEWBOX} pointerEvents="none">
      <Path d={parks} fill={mapColors.park} fillOpacity={0.7} />
    </Svg>
  );
});

const PitchLayer = memo(function PitchLayer({ selectedPitchId }: { selectedPitchId: string | null }) {
  return (
    <Svg width={RENDER_WIDTH} height={RENDER_HEIGHT} viewBox={VIEWBOX}>
      {pitches.map((pitch) => (
        <PitchShape key={pitch.id} pitch={pitch} selected={pitch.id === selectedPitchId} />
      ))}
    </Svg>
  );
});

/** A tiny illustrated soccer field or pickleball court, at its real size and orientation. */
function PitchShape({ pitch, selected }: { pitch: Pitch; selected: boolean }) {
  const L = pitch.length;
  const W = pitch.width;
  const line = mapColors.fieldLine;
  const stroke = selected ? colors.brand : line;
  return (
    <G transform={`translate(${pitch.x} ${pitch.y}) rotate(${pitch.angle})`}>
      {pitch.sport === 'soccer' ? (
        <>
          <Rect x={-L / 2} y={-W / 2} width={L} height={W} rx={1.5} fill={mapColors.soccerField} stroke={stroke} strokeWidth={selected ? 2.4 : 1.4} />
          <Line x1={0} y1={-W / 2} x2={0} y2={W / 2} stroke={line} strokeWidth={1} />
          <Circle r={W * 0.16} fill="none" stroke={line} strokeWidth={1} />
          <Rect x={-L / 2} y={-W * 0.22} width={L * 0.14} height={W * 0.44} fill="none" stroke={line} strokeWidth={1} />
          <Rect x={L / 2 - L * 0.14} y={-W * 0.22} width={L * 0.14} height={W * 0.44} fill="none" stroke={line} strokeWidth={1} />
        </>
      ) : (
        <>
          <Rect x={-L / 2} y={-W / 2} width={L} height={W} rx={0.8} fill={mapColors.court} stroke={stroke} strokeWidth={selected ? 1.6 : 0.8} />
          <Line x1={0} y1={-W / 2} x2={0} y2={W / 2} stroke={line} strokeWidth={0.8} />
          <Line x1={-L * 0.16} y1={-W / 2} x2={-L * 0.16} y2={W / 2} stroke={line} strokeWidth={0.5} />
          <Line x1={L * 0.16} y1={-W / 2} x2={L * 0.16} y2={W / 2} stroke={line} strokeWidth={0.5} />
        </>
      )}
    </G>
  );
}

function UserMarker({
  point,
  scale,
  tx,
  ty,
}: {
  point: { latitude: number; longitude: number };
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
}) {
  const p = project(point.latitude, point.longitude);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: p.x * scale.value + tx.value - 9 }, { translateY: p.y * scale.value + ty.value - 9 }],
  }));
  return (
    <Animated.View style={[styles.anchor, style]}>
      <UserDot />
    </Animated.View>
  );
}

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
    opacity: withSpring(dimmed ? 0.5 : 1, spring.smooth),
    transform: [
      { translateY: withSpring(selected ? -4 : 0, spring.smooth) },
      { scale: withSpring((selected ? 1.1 : 1) * (1 - pressed.value * 0.04), pressed.value ? spring.quick : spring.smooth) },
    ],
  }));

  // Place names fade in as you zoom in, keeping the zoomed-out map clean.
  const nameStyle = useAnimatedStyle(() => ({
    opacity: selected ? 1 : interpolate(scale.value, [baseScale * 0.85, baseScale * 1.1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.anchor, { zIndex: selected ? 3 : summary.live ? 2 : 1 }, position]}>
      <View pointerEvents="box-none" style={styles.pinBox}>
        <Animated.View entering={FadeIn.duration(260).delay(120 + Math.min(index, 8) * 40)}>
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
              <PlacePin summary={summary} selected={selected} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.duration(260).delay(300 + Math.min(index, 8) * 40)} pointerEvents="none" style={styles.nameBox}>
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
    left: 20,
    top: 4,
    fontSize: 9,
    color: mapColors.pinName,
    opacity: 0.5,
  },
});
