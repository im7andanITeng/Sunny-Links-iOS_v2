// Ball physics for mini golf. Plain TS — no React or three.js.
import type { Hole, Rect } from "./course";

export const BALL_R = 0.12;
export const CUP_R = 0.2;
export const MAX_SPEED = 11;
export const RESTITUTION = 0.72;
export const GRASS = { k: 0.55, c: 0.75 };
export const SAND = { k: 4.5, c: 3 };
export const SINK_SPEED = 2.4;
export const REST_SPEED = 0.06;
const STEP = 1 / 240;

export type Ball = { x: number; z: number; vx: number; vz: number; moving: boolean };
export type StepEvent = "sunk" | "water" | "stopped" | "bounce" | null;

const inRect = (r: Rect, x: number, z: number) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2;

/** All solid boxes: user walls + 4 boundary walls. */
export function solidBoxes(h: Hole): Rect[] {
  const b = h.bounds, t = 0.2;
  return [
    ...h.walls,
    { x1: b.x1 - t, z1: b.z1 - t, x2: b.x2 + t, z2: b.z1 },
    { x1: b.x1 - t, z1: b.z2, x2: b.x2 + t, z2: b.z2 + t },
    { x1: b.x1 - t, z1: b.z1, x2: b.x1, z2: b.z2 },
    { x1: b.x2, z1: b.z1, x2: b.x2 + t, z2: b.z2 },
  ];
}

function reflect(ball: Ball, nx: number, nz: number, bvx = 0, bvz = 0) {
  const rvx = ball.vx - bvx, rvz = ball.vz - bvz;
  const dot = rvx * nx + rvz * nz;
  if (dot < 0) {
    ball.vx = rvx - (1 + RESTITUTION) * dot * nx + bvx;
    ball.vz = rvz - (1 + RESTITUTION) * dot * nz + bvz;
    return Math.abs(dot) > 0.4;
  }
  return false;
}

function collideBox(ball: Ball, r: Rect): boolean {
  const cx = Math.max(r.x1, Math.min(ball.x, r.x2));
  const cz = Math.max(r.z1, Math.min(ball.z, r.z2));
  const dx = ball.x - cx, dz = ball.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= BALL_R * BALL_R || d2 === 0) return false;
  const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
  ball.x = cx + nx * BALL_R;
  ball.z = cz + nz * BALL_R;
  return reflect(ball, nx, nz);
}

export function spinnerAngle(speed: number, t: number) {
  return t * speed;
}

export function step(ball: Ball, hole: Hole, boxes: Rect[], dt: number, time: number): StepEvent {
  if (!ball.moving) return null;
  let ev: StepEvent = null;
  const n = Math.max(1, Math.ceil(dt / STEP));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const t = time + i * h;
    // surface forces
    const sand = hole.sand.some((r) => inRect(r, ball.x, ball.z));
    const f = sand ? SAND : GRASS;
    let onSlope = false;
    for (const s of hole.slopes) if (inRect(s, ball.x, ball.z)) { ball.vx += s.fx * h; ball.vz += s.fz * h; onSlope = true; }
    // cup attraction when slow and close
    const cdx = hole.cup[0] - ball.x, cdz = hole.cup[1] - ball.z;
    const cd = Math.hypot(cdx, cdz);
    if (cd < CUP_R * 1.6 && cd > 0.001) { ball.vx += (cdx / cd) * 2.5 * h; ball.vz += (cdz / cd) * 2.5 * h; }

    const damp = Math.exp(-f.k * h);
    ball.vx *= damp; ball.vz *= damp;
    let sp = Math.hypot(ball.vx, ball.vz);
    if (sp > 0) { const ns = Math.max(0, sp - f.c * h); ball.vx *= ns / sp; ball.vz *= ns / sp; sp = ns; }

    ball.x += ball.vx * h;
    ball.z += ball.vz * h;

    for (const b of boxes) if (collideBox(ball, b)) ev = "bounce";
    for (const b of hole.bumpers) {
      const dx = ball.x - b.x, dz = ball.z - b.z, d = Math.hypot(dx, dz), m = b.r + BALL_R;
      if (d < m && d > 0) {
        const nx = dx / d, nz = dz / d;
        ball.x = b.x + nx * m; ball.z = b.z + nz * m;
        if (reflect(ball, nx, nz)) ev = "bounce";
        // bumpers are springy
        ball.vx += nx * 0.6; ball.vz += nz * 0.6;
      }
    }
    for (const s of hole.spinners) {
      const a = spinnerAngle(s.speed, t);
      const c = Math.cos(a), sn = Math.sin(a);
      const px = ball.x - s.x, pz = ball.z - s.z;
      // to local frame (bar along local x)
      const lx = c * px + sn * pz, lz = -sn * px + c * pz;
      const hw = 0.09;
      const qx = Math.max(-s.half, Math.min(lx, s.half)), qz = Math.max(-hw, Math.min(lz, hw));
      const dx = lx - qx, dz = lz - qz, d = Math.hypot(dx, dz);
      if (d < BALL_R && d > 0) {
        const lnx = dx / d, lnz = dz / d;
        const nlx = qx + lnx * BALL_R, nlz = qz + lnz * BALL_R;
        ball.x = s.x + c * nlx - sn * nlz;
        ball.z = s.z + sn * nlx + c * nlz;
        const nx = c * lnx - sn * lnz, nz = sn * lnx + c * lnz;
        const wx = ball.x - s.x, wz = ball.z - s.z;
        if (reflect(ball, nx, nz, -s.speed * wz, s.speed * wx)) ev = "bounce";
      }
    }

    if (hole.water.some((r) => inRect(r, ball.x, ball.z))) { ball.moving = false; ball.vx = ball.vz = 0; return "water"; }
    const cd2 = Math.hypot(hole.cup[0] - ball.x, hole.cup[1] - ball.z);
    if (cd2 < CUP_R - BALL_R * 0.3 && sp < SINK_SPEED) {
      ball.moving = false; ball.vx = ball.vz = 0; ball.x = hole.cup[0]; ball.z = hole.cup[1];
      return "sunk";
    }
    if (!onSlope && sp < REST_SPEED) { ball.moving = false; ball.vx = ball.vz = 0; return "stopped"; }
  }
  return ev;
}

export function scoreName(strokes: number, par: number) {
  if (strokes === 1) return "Hole in one!";
  const d = strokes - par;
  return ({ [-3]: "Albatross!", [-2]: "Eagle!", [-1]: "Birdie!", 0: "Par", 1: "Bogey", 2: "Double bogey" } as Record<number, string>)[d] ?? `+${d}`;
}
