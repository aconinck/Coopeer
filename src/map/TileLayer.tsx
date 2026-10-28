import { memo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { WORLD } from './mapData';
import { MERC_TOP, X_PER_DEG, Y_PER_MERC } from './projection';

// Grayscale "Positron" raster tiles from CARTO (© OpenStreetMap contributors © CARTO).
// Tiles are positioned in the same render space as everything else, so the camera
// (pan/pinch/zoom), pins and field illustrations all line up with no extra math.
// The key comes from EXPO_PUBLIC_CARTO_KEY in .env (git-ignored). It ships inside the app bundle,
// so restrict it to your domains in the CARTO dashboard. Without it CARTO serves watermarked tiles.
const CARTO_KEY = process.env.EXPO_PUBLIC_CARTO_KEY;
type Layer = 'light_nolabels' | 'light_only_labels';
const TILE_URL = (layer: Layer, z: number, x: number, y: number) =>
  `https://basemaps.cartocdn.com/rastertiles/${layer}/${z}/${x}/${y}@2x.png${CARTO_KEY ? `?key=${CARTO_KEY}` : ''}`;

// Google Maps–like restraint:
// - The base map has no labels and is drawn one zoom level coarser than the screen needs, so
//   only main roads show; residential streets stay out until you are really close.
// - Place names (city, towns) only appear when zoomed far out, never at street level.
const MIN_ZOOM = 9;
const MAX_ZOOM = 16;
const DETAIL_OFFSET = 1;
const LABELS_MAX_ZOOM = 11;
const MAX_SPAN = 9;

interface TileView {
  z: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function keyFor(z: number, scale: number, tx: number, ty: number, width: number, height: number) {
  'worklet';
  const n = 2 ** z;
  const tileX = (xr: number) => ((WORLD.west + xr / X_PER_DEG + 180) / 360) * n;
  const tileY = (yr: number) => ((1 - (MERC_TOP - yr / Y_PER_MERC) / Math.PI) / 2) * n;
  const x0 = Math.floor(tileX(-tx / scale));
  const x1 = Math.floor(tileX((width - tx) / scale));
  const y0 = Math.floor(tileY(-ty / scale));
  const y1 = Math.floor(tileY((height - ty) / scale));
  return `${z}|${x0}|${Math.min(x1, x0 + MAX_SPAN)}|${y0}|${Math.min(y1, y0 + MAX_SPAN)}`;
}

function parse(key: string): TileView {
  const [z, x0, x1, y0, y1] = key.split('|').map(Number);
  return { z, x0, x1, y0, y1 };
}

function rect(z: number, x: number, y: number) {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const mercTop = Math.PI * (1 - (2 * y) / n);
  const mercBottom = Math.PI * (1 - (2 * (y + 1)) / n);
  return {
    left: (west - WORLD.west) * X_PER_DEG,
    top: (MERC_TOP - mercTop) * Y_PER_MERC,
    width: (east - west) * X_PER_DEG,
    height: (mercTop - mercBottom) * Y_PER_MERC,
  };
}

export function TileLayer({
  scale,
  tx,
  ty,
  width,
  height,
}: {
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  width: number;
  height: number;
}) {
  const [fine, setFine] = useState<TileView | null>(null);
  const [coarse, setCoarse] = useState<TileView | null>(null);
  const [labels, setLabels] = useState<TileView | null>(null);

  // Parsing happens on the JS thread; the UI-thread reaction only hands over plain strings.
  const applyKeys = (fineKey: string, coarseKey: string, labelKey: string) => {
    setFine(parse(fineKey));
    setCoarse(parse(coarseKey));
    setLabels(labelKey ? parse(labelKey) : null);
  };

  useAnimatedReaction(
    () => {
      if (width === 0 || scale.value <= 0) return '';
      // Pick the zoom whose 256px tile lands closest to its native screen size.
      const ideal = Math.round(Math.log2((360 * X_PER_DEG * scale.value) / 256) + 0.2);
      const z = Math.min(Math.max(ideal - DETAIL_OFFSET, MIN_ZOOM), MAX_ZOOM);
      const labelKey = ideal <= LABELS_MAX_ZOOM ? keyFor(Math.max(ideal, MIN_ZOOM), scale.value, tx.value, ty.value, width, height) : '';
      return `${keyFor(z, scale.value, tx.value, ty.value, width, height)}#${labelKey}`;
    },
    (key, previous) => {
      if (!key || key === previous) return;
      const [baseKey, labelKey] = key.split('#');
      const z = Number(baseKey.split('|')[0]);
      // A coarser level stays underneath so zooming never flashes empty tiles.
      const coarseKey = keyFor(z - 2, scale.value, tx.value, ty.value, width, height);
      runOnJS(applyKeys)(baseKey, coarseKey, labelKey);
    },
    [width, height],
  );

  return (
    <>
      {coarse && <Level layer="light_nolabels" view={coarse} />}
      {fine && <Level layer="light_nolabels" view={fine} />}
      {labels && <Level layer="light_only_labels" view={labels} />}
    </>
  );
}

const Level = memo(function Level({ layer, view }: { layer: Layer; view: TileView }) {
  const tiles = [];
  for (let x = view.x0; x <= view.x1; x++) {
    for (let y = view.y0; y <= view.y1; y++) {
      const r = rect(view.z, x, y);
      tiles.push(
        <Image
          key={`${layer}/${view.z}/${x}/${y}`}
          source={{ uri: TILE_URL(layer, view.z, x, y) }}
          accessibilityIgnoresInvertColors
          style={[styles.tile, { left: r.left, top: r.top, width: r.width + 0.5, height: r.height + 0.5 }]}
        />,
      );
    }
  }
  return <>{tiles}</>;
});

const styles = StyleSheet.create({
  tile: { position: 'absolute' },
});
