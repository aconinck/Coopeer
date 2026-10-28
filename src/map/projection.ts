import { WORLD } from './mapData';

// Same Web Mercator projection the street data was baked with.
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const xScale = WORLD.width / (WORLD.east - WORLD.west);
const yScale = WORLD.width / (((WORLD.east - WORLD.west) * Math.PI) / 180);
const yTop = merc(WORLD.north);

/** Street SVG is rasterized at half the world size to keep native textures small. */
export const RENDER = 0.5;
export const RENDER_WIDTH = WORLD.width * RENDER;
export const RENDER_HEIGHT = WORLD.height * RENDER;

/** Latitude/longitude → render-space point (the coordinate space the camera transforms). */
export function project(latitude: number, longitude: number) {
  return {
    x: (longitude - WORLD.west) * xScale * RENDER,
    y: (yTop - merc(latitude)) * yScale * RENDER,
  };
}

export const BENTONVILLE_CENTER = project(36.3625, -94.2105);
/** Render-space width visible at the default zoom (~4 km). */
export const DEFAULT_SPAN = 560;

/** How far the camera may roam (render space): well beyond the baked Bentonville bounds. */
export const MAP_BOUNDS = {
  left: -RENDER_WIDTH,
  top: -RENDER_HEIGHT,
  right: RENDER_WIDTH * 2,
  bottom: RENDER_HEIGHT * 2,
} as const;

/** Render units per degree of longitude, and per radian of Mercator y. */
export const X_PER_DEG = xScale * RENDER;
export const Y_PER_MERC = yScale * RENDER;
export const MERC_TOP = yTop;
