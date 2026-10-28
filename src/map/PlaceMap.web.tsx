import 'leaflet/dist/leaflet.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View } from 'react-native';
import L from 'leaflet';
import type { Place } from '../state/models';
import { PlacePin } from './PlacePin';
import type { PlaceMapHandle, PlaceMapProps } from './PlaceMap';

const CENTER: L.LatLngExpression = [36.362, -94.2115];
const ZOOM = 14;

// Softer, Apple Maps–like look for the raster tiles.
function ensureTileStyle() {
  if (document.getElementById('coopeer-tiles-style')) return;
  const style = document.createElement('style');
  style.id = 'coopeer-tiles-style';
  style.textContent = '.coopeer-tiles { filter: saturate(0.7) brightness(1.04) contrast(0.95); }';
  document.head.appendChild(style);
}

/** Web map: Leaflet + OpenStreetMap tiles. Pins are the same React PlacePin rendered through portals. */
export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(function PlaceMap(
  { summaries, selectedId, onSelect, bottomInset },
  ref,
) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [hosts, setHosts] = useState<Record<string, HTMLElement>>({});
  const placeKey = summaries.map((s) => s.place.id).join(',');

  useImperativeHandle(ref, () => ({
    focus: (place: Place) => {
      const instance = map.current;
      if (!instance) return;
      instance.flyTo([place.latitude, place.longitude], 15, { duration: 0.4 });
      instance.once('moveend', () => instance.panBy([0, bottomInset / 2], { animate: true }));
    },
    recenter: () => map.current?.flyTo(CENTER, ZOOM, { duration: 0.4 }),
  }));

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true }).setView(CENTER, ZOOM);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'coopeer-tiles',
    }).addTo(instance);
    ensureTileStyle();
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const next: Record<string, HTMLElement> = {};
    const markers = summaries.map((summary) => {
      const host = document.createElement('div');
      host.style.position = 'absolute';
      host.style.transform = 'translate(-50%, -78%)';
      host.style.cursor = 'pointer';
      next[summary.place.id] = host;
      const marker = L.marker([summary.place.latitude, summary.place.longitude], {
        icon: L.divIcon({ html: host, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
        zIndexOffset: summary.live ? 1000 : 0,
      });
      marker.on('click', () => onSelectRef.current(summary.place));
      return marker.addTo(instance);
    });
    setHosts(next);
    return () => markers.forEach((marker) => marker.remove());
    // Markers only need rebuilding when the set of places changes; pin content re-renders via portals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={container} style={{ width: '100%', height: '100%' }} />
      {summaries.map((summary) => {
        const host = hosts[summary.place.id];
        return host ? createPortal(<PlacePin summary={summary} selected={summary.place.id === selectedId} />, host, summary.place.id) : null;
      })}
    </View>
  );
});
