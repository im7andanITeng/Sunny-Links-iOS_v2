// Mini-golf course data. Plain TS (no React / three) — units are meters, x/z ground plane.
export type Rect = { x1: number; z1: number; x2: number; z2: number };
export type Bumper = { x: number; z: number; r: number };
export type Spinner = { x: number; z: number; half: number; speed: number };
export type Slope = Rect & { fx: number; fz: number };

export type Hole = {
  name: string;
  par: number;
  bounds: Rect;
  tee: [number, number];
  cup: [number, number];
  walls: Rect[];
  sand: Rect[];
  water: Rect[];
  slopes: Slope[];
  bumpers: Bumper[];
  spinners: Spinner[];
};

const base = { walls: [], sand: [], water: [], slopes: [], bumpers: [], spinners: [] };

export const COURSE: Hole[] = [
  {
    ...base,
    name: "Opening Putt",
    par: 2,
    bounds: { x1: 0, z1: 0, x2: 4, z2: 12 },
    tee: [2, 1],
    cup: [2, 10.5],
    bumpers: [{ x: 2, z: 6, r: 0.4 }],
  },
  {
    ...base,
    name: "The Dogleg",
    par: 3,
    bounds: { x1: 0, z1: 0, x2: 10, z2: 10 },
    tee: [2, 1],
    cup: [8.2, 8.3],
    walls: [{ x1: 4, z1: 0, x2: 10, z2: 6 }],
    sand: [{ x1: 0, z1: 7.8, x2: 2.4, z2: 10 }],
    bumpers: [{ x: 5.5, z: 8, r: 0.35 }],
  },
  {
    ...base,
    name: "Windmill",
    par: 3,
    bounds: { x1: 0, z1: 0, x2: 5, z2: 14 },
    tee: [2.5, 1],
    cup: [2.5, 12.3],
    walls: [
      { x1: 0, z1: 6.7, x2: 1.3, z2: 7.3 },
      { x1: 3.7, z1: 6.7, x2: 5, z2: 7.3 },
    ],
    spinners: [{ x: 2.5, z: 7, half: 1.15, speed: 1.3 }],
  },
  {
    ...base,
    name: "Lake Crossing",
    par: 3,
    bounds: { x1: 0, z1: 0, x2: 6, z2: 14 },
    tee: [3, 1],
    cup: [2.5, 12.3],
    water: [{ x1: 0, z1: 5, x2: 3.9, z2: 8.6 }],
    slopes: [{ x1: 3.9, z1: 5, x2: 6, z2: 8.6, fx: -1.6, fz: 0 }],
    bumpers: [{ x: 4.5, z: 11, r: 0.3 }],
  },
  {
    ...base,
    name: "The Hill",
    par: 2,
    bounds: { x1: 0, z1: 0, x2: 5, z2: 12 },
    tee: [2.5, 1],
    cup: [2.5, 10.6],
    slopes: [{ x1: 0, z1: 3.5, x2: 5, z2: 8.5, fx: 0, fz: -2.2 }],
    bumpers: [
      { x: 1.2, z: 9.3, r: 0.25 },
      { x: 3.8, z: 9.3, r: 0.25 },
    ],
  },
  {
    ...base,
    name: "The Gauntlet",
    par: 4,
    bounds: { x1: 0, z1: 0, x2: 6, z2: 18 },
    tee: [1.2, 1],
    cup: [3, 16.8],
    walls: [
      { x1: 0, z1: 4.8, x2: 4.2, z2: 5.3 },
      { x1: 1.8, z1: 10, x2: 6, z2: 10.5 },
    ],
    sand: [{ x1: 4.2, z1: 6.5, x2: 6, z2: 9 }],
    bumpers: [
      { x: 1.5, z: 7.8, r: 0.3 },
      { x: 3, z: 8.6, r: 0.3 },
    ],
    spinners: [{ x: 3, z: 13.8, half: 1.4, speed: -1.7 }],
  },
];

// ---------- Endless procedural holes ----------
const NAMES_A = ["Mossy", "Sunny", "Crooked", "Breezy", "Hidden", "Lazy", "Twisty", "Pebble", "Willow", "Copper", "Maple", "Clover"];
const NAMES_B = ["Lane", "Hollow", "Run", "Bend", "Meadow", "Pass", "Ridge", "Gardens", "Creek", "Alley", "Green", "Trail"];

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function generateHole(level: number): Hole {
  const r = rng(level * 7919 + 13);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]!;
  const W = 4 + Math.floor(r() * 3);
  const L = Math.min(26, 11 + level * 0.5 + r() * 4);
  const h: Hole = {
    name: `${pick(NAMES_A)} ${pick(NAMES_B)}`,
    par: 2,
    bounds: { x1: 0, z1: 0, x2: W, z2: L },
    tee: [W / 2 + (r() - 0.5) * (W - 2), 1],
    cup: [1 + r() * (W - 2), L - 1.4],
    walls: [], sand: [], water: [], slopes: [], bumpers: [], spinners: [],
  };
  const slots = Math.floor((L - 5) / 3);
  const difficulty = Math.min(1, 0.35 + level * 0.04);
  let features = 0;
  for (let i = 0; i < slots; i++) {
    if (r() > difficulty) continue;
    const z = 3 + i * 3 + 1.5;
    const kind = pick(["bumpers", "wall", "sand", "water", "slope", "spinner", "bumpers", "wall"]);
    const left = r() < 0.5;
    const gap = 1.7;
    if (kind === "bumpers") {
      const n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) h.bumpers.push({ x: 0.8 + r() * (W - 1.6), z: z + (r() - 0.5) * 1.6, r: 0.22 + r() * 0.18 });
    } else if (kind === "wall") {
      const len = W - gap - r() * 1;
      h.walls.push(left ? { x1: 0, z1: z - 0.2, x2: len, z2: z + 0.2 } : { x1: W - len, z1: z - 0.2, x2: W, z2: z + 0.2 });
    } else if (kind === "sand") {
      const sw = 1.5 + r() * (W - 2.5), sx = r() * (W - sw);
      h.sand.push({ x1: sx, z1: z - 1.1, x2: sx + sw, z2: z + 1.1 });
    } else if (kind === "water") {
      const ww = W - gap - 0.3;
      h.water.push(left ? { x1: 0, z1: z - 1, x2: ww, z2: z + 1 } : { x1: W - ww, z1: z - 1, x2: W, z2: z + 1 });
    } else if (kind === "slope") {
      const s = 1.2 + r() * 1.5;
      const sideways = r() < 0.5;
      h.slopes.push({ x1: 0, z1: z - 1.2, x2: W, z2: z + 1.2, fx: sideways ? (left ? -s : s) : 0, fz: sideways ? 0 : -s });
    } else {
      const half = Math.min(1.4, W / 2 - 0.7);
      h.spinners.push({ x: W / 2, z, half, speed: (left ? 1 : -1) * (1 + r() * 1.2) });
      h.walls.push({ x1: 0, z1: z - 0.25, x2: W / 2 - half - 0.15, z2: z + 0.25 });
      h.walls.push({ x1: W / 2 + half + 0.15, z1: z - 0.25, x2: W, z2: z + 0.25 });
    }
    features++;
  }
  h.par = Math.min(6, 2 + Math.floor((features + 1) / 2) + (L > 18 ? 1 : 0));
  return h;
}

const cache = new Map<number, Hole>();
/** Hole by 0-based index: hand-made course first, then endless generated holes. */
export function getHole(i: number): Hole {
  if (i < COURSE.length) return COURSE[i]!;
  let h = cache.get(i);
  if (!h) { h = generateHole(i); cache.set(i, h); }
  return h;
}

// ---------- Levels: every HOLES_PER_LEVEL holes clears a level ----------
export const HOLES_PER_LEVEL = 6;
/** 0-based level number for a 0-based hole index. */
export const levelOf = (i: number) => Math.floor(i / HOLES_PER_LEVEL);
/** 0-based position of a hole inside its level. */
export const holeInLevel = (i: number) => i % HOLES_PER_LEVEL;

/** Display name for a 0-based level number: levels are simply numbered. */
export function levelName(level: number): string {
  return `Level ${level + 1}`;
}
