"""Bake OpenStreetMap streets into src/map/streetData.ts.

Usage:
  curl -s https://maps.mail.ru/osm/tools/overpass/api/interpreter --data-urlencode 'data=[out:json][timeout:60];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link)$"](36.335,-94.250,36.395,-94.170););out geom;' > osm.json
  python3 scripts/build_streets.py osm.json src/map/streetData.ts

Keep the bbox below in sync with the Overpass query.
"""
import json, math, sys
src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src))
S, W_, N, E = 36.335, -94.250, 36.395, -94.170
WIDTH = 2000.0
def merc(lat): return math.log(math.tan(math.pi/4 + math.radians(lat)/2))
k = WIDTH / (E - W_)
yTop = merc(N)
yScale = WIDTH / math.radians(E - W_)
def proj(lat, lon):
    return ((lon - W_) * k, (yTop - merc(lat)) * yScale)
HEIGHT = (yTop - merc(S)) * yScale

def dp(pts, tol):
    if len(pts) < 3: return pts
    (x1,y1),(x2,y2) = pts[0], pts[-1]
    dx, dy = x2-x1, y2-y1
    L = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts)-1):
        px, py = pts[i]
        d = abs(dy*px - dx*py + x2*y1 - y2*x1) / L
        if d > best: best, idx = d, i
    if best > tol:
        return dp(pts[:idx+1], tol)[:-1] + dp(pts[idx:], tol)
    return [pts[0], pts[-1]]

classes = {'major': [], 'mid': [], 'minor': [], 'water': [], 'park': []}
for el in data['elements']:
    if el.get('type') != 'way' or 'geometry' not in el: continue
    t = el.get('tags', {})
    pts = [proj(g['lat'], g['lon']) for g in el['geometry']]
    hw = t.get('highway')
    if hw in ('motorway','trunk','primary','secondary','motorway_link','trunk_link','primary_link'): cls, tol = 'major', 3
    elif hw in ('tertiary',): cls, tol = 'mid', 3
    elif hw in ('residential','unclassified'): cls, tol = 'minor', 4
    elif t.get('natural') == 'water': cls, tol = 'water', 4
    elif t.get('leisure') == 'park': cls, tol = 'park', 4
    else: continue
    pts = dp(pts, tol)
    if len(pts) < 2: continue
    if cls in ('water','park'):
        if len(pts) < 4: continue
        area = abs(sum(pts[i][0]*pts[i+1][1]-pts[i+1][0]*pts[i][1] for i in range(len(pts)-1)))/2
        if area < 300: continue
    seg = 'M' + 'L'.join(f'{round(x)} {round(y)}' for x, y in pts)
    if cls in ('water','park'): seg += 'Z'
    classes[cls].append(seg)

with open(out, 'w') as f:
    f.write('// Generated from OpenStreetMap (© OpenStreetMap contributors, ODbL) by a one-off script.\n')
    f.write('// Bentonville, AR streets projected to Web Mercator in a 2000-unit-wide world.\n')
    f.write(f'export const WORLD = {{ width: {WIDTH:.0f}, height: {HEIGHT:.0f}, south: {S}, west: {W_}, north: {N}, east: {E} }} as const;\n\n')
    f.write('export const streets = {\n')
    for cls, segs in classes.items():
        f.write(f"  {cls}: '{''.join(segs)}',\n")
    f.write('} as const;\n')
for c, s in classes.items(): print(c, len(s), sum(map(len, s)))
print('height', HEIGHT)
