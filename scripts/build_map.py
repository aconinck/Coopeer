"""Bake OpenStreetMap data into src/map/mapData.ts (streets, street labels, parks, water, pitches).

Usage (two Overpass queries keep each request small):
  Q1='[out:json][timeout:60];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link)$"](36.335,-94.250,36.395,-94.170););out geom;'
  Q2='[out:json][timeout:60];(way["leisure"~"^(park|pitch|recreation_ground)$"](36.335,-94.250,36.395,-94.170);relation["leisure"="park"](36.335,-94.250,36.395,-94.170);way["natural"="water"](36.335,-94.250,36.395,-94.170););out geom;'
  curl -s https://maps.mail.ru/osm/tools/overpass/api/interpreter --data-urlencode "data=$Q1" > streets.json
  curl -s https://maps.mail.ru/osm/tools/overpass/api/interpreter --data-urlencode "data=$Q2" > areas.json
  python3 scripts/build_map.py streets.json areas.json src/map/mapData.ts

Keep the bbox below in sync with the queries.
"""
import json
import math
import sys

S, W_, N, E = 36.335, -94.250, 36.395, -94.170
WIDTH = 2000.0


def merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


K = WIDTH / (E - W_)
Y_TOP = merc(N)
Y_SCALE = WIDTH / math.radians(E - W_)
HEIGHT = (Y_TOP - merc(S)) * Y_SCALE


def proj(lat, lon):
    return ((lon - W_) * K, (Y_TOP - merc(lat)) * Y_SCALE)


def unproj(x, y):
    lon = x / K + W_
    m = Y_TOP - y / Y_SCALE
    lat = math.degrees(2 * math.atan(math.exp(m)) - math.pi / 2)
    return lat, lon


def inside(pt, poly):
    x, y = pt
    hit = False
    for i in range(len(poly) - 1):
        (x1, y1), (x2, y2) = poly[i], poly[i + 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / length
        if d > best:
            best, idx = d, i
    if best > tol:
        return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [pts[0], pts[-1]]


def area(pts):
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) / 2


def path(pts, closed=False):
    d = 'M' + 'L'.join(f'{round(x)} {round(y)}' for x, y in pts)
    return d + ('Z' if closed else '')


def oriented_box(pts):
    """Center, length, width and angle (degrees) of a roughly rectangular polygon."""
    best = None
    ring = pts[:-1] if pts[0] == pts[-1] else pts
    for i in range(len(ring)):
        ax, ay = ring[i]
        bx, by = ring[(i + 1) % len(ring)]
        ang = math.atan2(by - ay, bx - ax)
        c, s = math.cos(-ang), math.sin(-ang)
        rx = [x * c - y * s for x, y in ring]
        ry = [x * s + y * c for x, y in ring]
        w, h = max(rx) - min(rx), max(ry) - min(ry)
        if best is None or w * h < best[0]:
            cxr, cyr = (max(rx) + min(rx)) / 2, (max(ry) + min(ry)) / 2
            c2, s2 = math.cos(ang), math.sin(ang)
            best = (w * h, cxr * c2 - cyr * s2, cxr * s2 + cyr * c2, w, h, ang)
    _, cx, cy, w, h, ang = best
    if h > w:
        w, h, ang = h, w, ang + math.pi / 2
    return cx, cy, w, h, math.degrees(ang) % 180


def main(streets_path, areas_path, out_path):
    streets = json.load(open(streets_path))['elements']
    areas = json.load(open(areas_path))['elements']

    classes = {'major': [], 'mid': [], 'minor': []}
    labels = {}
    for el in streets:
        t = el.get('tags', {})
        if el.get('type') != 'way' or 'geometry' not in el:
            continue
        pts = [proj(g['lat'], g['lon']) for g in el['geometry']]
        hw = t.get('highway')
        if hw in ('motorway', 'trunk', 'primary', 'secondary', 'motorway_link', 'trunk_link', 'primary_link'):
            cls, tol = 'major', 3
        elif hw == 'tertiary':
            cls, tol = 'mid', 3
        else:
            cls, tol = 'minor', 4
        simple = simplify(pts, tol)
        if cls == 'minor' and sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(simple, simple[1:])) < 12:
            continue
        classes[cls].append(path(simple))
        name = t.get('name')
        if name and cls in ('major', 'mid') and 'Circle' not in name:
            for i in range(len(pts) - 1):
                (ax, ay), (bx, by) = pts[i], pts[i + 1]
                seg = math.hypot(bx - ax, by - ay)
                if seg < 35:
                    continue
                ang = math.degrees(math.atan2(by - ay, bx - ax))
                if ang > 90:
                    ang -= 180
                if ang < -90:
                    ang += 180
                labels.setdefault(name, []).append((seg, (ax + bx) / 2, (ay + by) / 2, ang, cls))

    # Keep the longest few placements per street name, spaced apart.
    placed = []
    for name, cands in labels.items():
        cands.sort(reverse=True)
        chosen = []
        for seg, x, y, ang, cls in cands:
            if all(math.hypot(x - cx, y - cy) > 350 for _, cx, cy, _, _ in chosen):
                chosen.append((seg, x, y, ang, cls))
            if len(chosen) == 3:
                break
        short = name.replace('North ', 'N ').replace('South ', 'S ').replace('East ', 'E ').replace('West ', 'W ')
        short = short.replace('Northeast ', 'NE ').replace('Northwest ', 'NW ').replace('Southeast ', 'SE ').replace('Southwest ', 'SW ')
        short = short.replace(' Street', ' St').replace(' Avenue', ' Ave').replace(' Boulevard', ' Blvd').replace(' Road', ' Rd').replace(' Drive', ' Dr').replace(' Parkway', ' Pkwy')
        for _, x, y, ang, cls in chosen:
            placed.append((short, round(x), round(y), round(ang), cls == 'major'))

    parks, water, pitches, park_shapes = [], [], [], []
    for el in areas:
        t = el.get('tags', {})
        geoms = []
        if el['type'] == 'way' and 'geometry' in el:
            geoms = [el['geometry']]
        elif el['type'] == 'relation':
            geoms = [m['geometry'] for m in el.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
        for g in geoms:
            pts = [proj(p['lat'], p['lon']) for p in g]
            if len(pts) < 4:
                continue
            if t.get('leisure') == 'pitch':
                sport = t.get('sport', '')
                if sport not in ('soccer', 'pickleball'):
                    continue
                cx, cy, length, width, ang = oriented_box(pts)
                lat, lon = unproj(cx, cy)
                pitches.append({'id': f"{el['type'][0]}{el['id']}", 'sport': sport, 'x': round(cx, 1), 'y': round(cy, 1),
                                'length': round(length, 1), 'width': round(width, 1), 'angle': round(ang, 1),
                                'latitude': round(lat, 6), 'longitude': round(lon, 6), 'park': None})
            elif t.get('leisure') in ('park', 'recreation_ground'):
                if area(pts) > 400:
                    parks.append(path(simplify(pts, 5), closed=True))
                    if t.get('name'):
                        park_shapes.append((t['name'], pts))
            elif t.get('natural') == 'water':
                if area(pts) > 150:
                    water.append(path(simplify(pts, 3), closed=True))

    for p in pitches:
        for name, shape in park_shapes:
            if inside((p['x'], p['y']), shape):
                p['park'] = name
                break

    with open(out_path, 'w') as f:
        f.write('// Generated from OpenStreetMap (© OpenStreetMap contributors, ODbL) by scripts/build_map.py.\n')
        f.write('// Bentonville, AR projected to Web Mercator in a 2000-unit-wide world. Do not edit by hand.\n\n')
        f.write(f'export const WORLD = {{ width: {WIDTH:.0f}, height: {HEIGHT:.0f}, south: {S}, west: {W_}, north: {N}, east: {E} }} as const;\n\n')
        f.write('export const streets = {\n')
        for cls, segs in classes.items():
            f.write(f"  {cls}: '{''.join(segs)}',\n")
        f.write('} as const;\n\n')
        f.write(f"export const parks = '{''.join(parks)}';\n")
        f.write(f"export const water = '{''.join(water)}';\n\n")
        f.write('/** [name, x, y, angle°, isMajor] in world units. */\n')
        f.write('export const streetLabels: readonly (readonly [string, number, number, number, boolean])[] = ' + json.dumps(placed).replace('true', 'true').replace('false', 'false') + ';\n\n')
        f.write('export interface Pitch {\n  id: string;\n  sport: \'soccer\' | \'pickleball\';\n  /** World units. */\n  x: number;\n  y: number;\n  length: number;\n  width: number;\n  angle: number;\n  latitude: number;\n  longitude: number;\n  /** Name of the park it sits in, when known. */\n  park: string | null;\n}\n\n')
        f.write('export const pitches: readonly Pitch[] = ' + json.dumps(pitches) + ';\n')

    print({k: len(v) for k, v in classes.items()}, 'labels', len(placed), 'parks', len(parks), 'water', len(water), 'pitches', len(pitches))


if __name__ == '__main__':
    main(*sys.argv[1:4])
