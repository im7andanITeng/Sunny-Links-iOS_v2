import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Sky, ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { getHole, HOLES_PER_LEVEL, holeInLevel, levelOf, type Hole, type Rect } from "@/game/course";
import { BALL_R, CUP_R, MAX_SPEED, solidBoxes, spinnerAngle, step, scoreName, type Ball } from "@/game/physics";
import { playHit, playCup, playSplash, playBounce, playLevelUp } from "@/game/sound";

const MAX_DRAG = 3;

/** Phone/tablet builds get touch wording; desktop keeps the mouse hints. */
const TOUCH =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

function grassTexture(light = "#5fae4a", dark = "#529d40") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? light : dark; g.fillRect(0, i * 32, 256, 32); }
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,40,0"},${Math.random() * 0.06})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function noiseTexture(base: string, spread: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "60,40,0"},${Math.random() * spread})`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const cx = (r: Rect) => (r.x1 + r.x2) / 2;
const cz = (r: Rect) => (r.z1 + r.z2) / 2;
const w = (r: Rect) => r.x2 - r.x1;
const d = (r: Rect) => r.z2 - r.z1;

function Course({ hole }: { hole: Hole }) {
  const boxes = useMemo(() => solidBoxes(hole), [hole]);
  const grass = useMemo(() => grassTexture(), []);
  const rough = useMemo(() => grassTexture("#4a8a3a", "#447f35"), []);
  const sand = useMemo(() => noiseTexture("#e3cf98", 0.15), []);
  const wood = useMemo(() => noiseTexture("#a8754a", 0.12), []);
  const b = hole.bounds;
  const gTex = useMemo(() => { const t = grass.clone(); t.repeat.set(w(b) / 2, d(b) / 2); t.needsUpdate = true; return t; }, [grass, b]);
  const rTex = useMemo(() => { const t = rough.clone(); t.repeat.set(30, 30); t.needsUpdate = true; return t; }, [rough]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[cx(b), -0.06, cz(b)]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={rTex} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[cx(b), 0, cz(b)]} receiveShadow>
        <planeGeometry args={[w(b), d(b)]} />
        <meshStandardMaterial map={gTex} roughness={0.9} />
      </mesh>
      {boxes.map((r, i) => (
        <mesh key={i} position={[cx(r), 0.1, cz(r)]} castShadow receiveShadow>
          <boxGeometry args={[w(r), 0.32, d(r)]} />
          <meshStandardMaterial map={wood} roughness={0.7} />
        </mesh>
      ))}
      {hole.sand.map((r, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[cx(r), 0.004, cz(r)]} receiveShadow>
          <planeGeometry args={[w(r), d(r)]} />
          <meshStandardMaterial map={sand} roughness={1} />
        </mesh>
      ))}
      {hole.water.map((r, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[cx(r), 0.006, cz(r)]}>
          <planeGeometry args={[w(r), d(r)]} />
          <meshPhysicalMaterial color="#2f8fc4" roughness={0.05} metalness={0.1} transparent opacity={0.88} clearcoat={1} />
        </mesh>
      ))}
      {hole.slopes.map((s, i) => {
        const ang = Math.atan2(s.fx, s.fz);
        const arrows: [number, number][] = [];
        for (let x = s.x1 + 0.6; x < s.x2; x += 1.2)
          for (let z = s.z1 + 0.6; z < s.z2; z += 1.2) arrows.push([x, z]);
        return (
          <group key={i}>
            <mesh rotation-x={-Math.PI / 2} position={[cx(s), 0.003, cz(s)]} receiveShadow>
              <planeGeometry args={[w(s), d(s)]} />
              <meshStandardMaterial color="#7cc25e" roughness={0.9} transparent opacity={0.55} />
            </mesh>
            {arrows.map(([x, z], j) => (
              <mesh key={j} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, ang + Math.PI]}>
                <circleGeometry args={[0.18, 3]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
              </mesh>
            ))}
          </group>
        );
      })}
      {hole.bumpers.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position-y={0.15} castShadow>
            <cylinderGeometry args={[p.r, p.r, 0.3, 32]} />
            <meshStandardMaterial color="#d8402f" roughness={0.4} />
          </mesh>
          <mesh position-y={0.31}>
            <cylinderGeometry args={[p.r * 0.7, p.r, 0.04, 32]} />
            <meshStandardMaterial color="#f4f1ea" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* tee mat */}
      <mesh rotation-x={-Math.PI / 2} position={[hole.tee[0], 0.005, hole.tee[1]]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial color="#2f6d34" roughness={1} />
      </mesh>
      {/* cup + flag */}
      <group position={[hole.cup[0], 0, hole.cup[1]]}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.007}>
          <ringGeometry args={[CUP_R, CUP_R + 0.03, 40]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.008}>
          <circleGeometry args={[CUP_R, 40]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
          <meshStandardMaterial color="#f1efe8" metalness={0.3} roughness={0.4} />
        </mesh>
        <Flag />
      </group>
      {hole.spinners.map((s, i) => <SpinnerMesh key={i} s={s} />)}
    </group>
  );
}

function Flag() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.25; });
  return (
    <mesh ref={ref} position={[0, 1.6, 0]} castShadow>
      <boxGeometry args={[0.02, 0.35, 0.55]} />
      <meshStandardMaterial color="#e23b2e" roughness={0.6} />
    </mesh>
  );
}

function SpinnerMesh({ s }: { s: Hole["spinners"][number] }) {
  const ref = useRef<THREE.Group>(null);
  const clockRef = useGameClock();
  useFrame(() => { if (ref.current) ref.current.rotation.y = -spinnerAngle(s.speed, clockRef.current); });
  return (
    <group position={[s.x, 0, s.z]}>
      <group ref={ref}>
        <mesh position-y={0.12} castShadow>
          <boxGeometry args={[s.half * 2, 0.18, 0.18]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.5} />
        </mesh>
        <mesh position={[s.half * 0.5, 0.12, 0]}><boxGeometry args={[0.2, 0.19, 0.19]} /><meshStandardMaterial color="#d8402f" /></mesh>
        <mesh position={[-s.half * 0.5, 0.12, 0]}><boxGeometry args={[0.2, 0.19, 0.19]} /><meshStandardMaterial color="#d8402f" /></mesh>
      </group>
      <mesh position-y={0.3} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.6, 16]} />
        <meshStandardMaterial color="#7a4e2e" />
      </mesh>
      <mesh position-y={0.7} castShadow>
        <coneGeometry args={[0.22, 0.3, 16]} />
        <meshStandardMaterial color="#d8402f" />
      </mesh>
    </group>
  );
}

// shared sim clock
const simClock = { current: 0 };
const useGameClock = () => simClock;

type Props = {
  hole: Hole;
  holeKey: number;
  onStroke: () => void;
  onPenalty: () => void;
  onSunk: () => void;
  canShoot: boolean;
};

function Scene({ hole, holeKey, onStroke, onPenalty, onSunk, canShoot }: Props) {
  const boxes = useMemo(() => solidBoxes(hole), [hole]);
  const ball = useRef<Ball>({ x: hole.tee[0], z: hole.tee[1], vx: 0, vz: 0, moving: false });
  const lastPos = useRef<[number, number]>([hole.tee[0], hole.tee[1]]);
  const ballMesh = useRef<THREE.Mesh>(null);
  const aimGroup = useRef<THREE.Group>(null);
  const aimBar = useRef<THREE.Mesh>(null);
  const aimMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const controls = useRef<any>(null);
  const aiming = useRef<{ x: number; z: number } | null>(null);
  const sinkAnim = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    ball.current = { x: hole.tee[0], z: hole.tee[1], vx: 0, vz: 0, moving: false };
    lastPos.current = [hole.tee[0], hole.tee[1]];
    sinkAnim.current = 0;
    const dirX = hole.cup[0] - hole.tee[0], dirZ = hole.cup[1] - hole.tee[1];
    const len = Math.hypot(dirX, dirZ) || 1;
    camera.position.set(hole.tee[0] - (dirX / len) * 5.5, 6, hole.tee[1] - (dirZ / len) * 5.5);
    if (controls.current) { controls.current.target.set(hole.tee[0], 0, hole.tee[1]); controls.current.update(); }
    (window as any).__game = { ball: ball.current, hole };
  }, [holeKey, hole, camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const ev = step(ball.current, hole, boxes, dt, simClock.current);
    simClock.current += dt;
    if (ev === "bounce") playBounce();
    if (ev === "water") {
      playSplash();
      ball.current.x = lastPos.current[0]; ball.current.z = lastPos.current[1];
      onPenalty();
    }
    if (ev === "sunk") { playCup(); sinkAnim.current = 0.001; onSunk(); }

    const b = ball.current;
    if (ballMesh.current) {
      let y = BALL_R;
      if (sinkAnim.current > 0) { sinkAnim.current = Math.min(1, sinkAnim.current + dt * 3); y = BALL_R - sinkAnim.current * 0.3; }
      ballMesh.current.position.set(b.x, y, b.z);
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0) {
        const axis = new THREE.Vector3(b.vz, 0, -b.vx).normalize();
        ballMesh.current.rotateOnWorldAxis(axis, (sp * dt) / BALL_R);
      }
    }
    if (ring.current) {
      ring.current.visible = !b.moving && canShoot && !aiming.current;
      ring.current.position.set(b.x, 0.012, b.z);
      const s = 1 + Math.sin(simClock.current * 4) * 0.12;
      ring.current.scale.set(s, s, s);
    }
    if (controls.current) {
      const t = controls.current.target as THREE.Vector3;
      const k = 1 - Math.exp(-3 * dt);
      const dx = (b.x - t.x) * k, dz = (b.z - t.z) * k;
      t.x += dx; t.z += dz;
      camera.position.x += dx; camera.position.z += dz;
      controls.current.update();
    }
  });

  const updateAim = (px: number, pz: number) => {
    const b = ball.current;
    const dx = b.x - px, dz = b.z - pz;
    const dist = Math.min(Math.hypot(dx, dz), MAX_DRAG);
    const p = dist / MAX_DRAG;
    if (aimGroup.current && aimBar.current && aimMat.current) {
      aimGroup.current.visible = dist > 0.05;
      aimGroup.current.position.set(b.x, 0.03, b.z);
      aimGroup.current.rotation.y = Math.atan2(dx, dz);
      const L = 0.3 + p * 2.6;
      aimBar.current.scale.set(1, 1, L);
      aimBar.current.position.z = L / 2 + BALL_R;
      aimMat.current.color.setHSL(0.33 - p * 0.33, 0.85, 0.55);
    }
    return { dx, dz, p };
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || ball.current.moving || !canShoot) return;
    e.stopPropagation();
    (e.target as any).setPointerCapture?.(e.pointerId);
    aiming.current = { x: e.point.x, z: e.point.z };
    updateAim(e.point.x, e.point.z);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!aiming.current) return;
    aiming.current = { x: e.point.x, z: e.point.z };
    updateAim(e.point.x, e.point.z);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!aiming.current) return;
    const { dx, dz, p } = updateAim(e.point.x, e.point.z);
    aiming.current = null;
    if (aimGroup.current) aimGroup.current.visible = false;
    if (p < 0.03) return;
    const len = Math.hypot(dx, dz);
    const speed = p * p * 0.35 * MAX_SPEED + p * 0.65 * MAX_SPEED;
    lastPos.current = [ball.current.x, ball.current.z];
    ball.current.vx = (dx / len) * speed;
    ball.current.vz = (dz / len) * speed;
    ball.current.moving = true;
    playHit(p);
    onStroke();
  };

  return (
    <>
      <OrbitControls
        ref={controls}
        makeDefault
        mouseButtons={{ LEFT: undefined as any, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        touches={{ ONE: undefined as any, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        enablePan={false}
        minDistance={2.5}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.3}
      />
      <Course hole={hole} />
      <mesh ref={ballMesh} castShadow>
        <icosahedronGeometry args={[BALL_R, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[BALL_R + 0.08, BALL_R + 0.12, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <group ref={aimGroup} visible={false}>
        <mesh ref={aimBar} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.07, 1]} />
          <meshBasicMaterial ref={aimMat} color="#7cd36b" transparent opacity={0.9} />
        </mesh>
      </group>
      {/* invisible input plane */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} visible={false}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}

export default function GolfGame({ onLevelComplete, onMenu }: { onLevelComplete?: (levelsPassed: number) => void; onMenu?: () => void } = {}) {
  const [holeIdx, setHoleIdx] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [sunk, setSunk] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [round, setRound] = useState(0);
  const hole = getHole(holeIdx);
  const strokesRef = useRef(0);
  strokesRef.current = strokes;
  const finished = false;
  const level = levelOf(holeIdx);
  const slot = holeInLevel(holeIdx);
  const levelEnd = slot === HOLES_PER_LEVEL - 1;

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1800); return () => clearTimeout(t); }, [toast]);

  const best = typeof window !== "undefined" ? null : null;
  void best;

  const next = () => {
    setHoleIdx(holeIdx + 1); setStrokes(0); setSunk(false);
  };
  const restart = () => { setHoleIdx(0); setStrokes(0); setScores([]); setSunk(false); setRound((r) => r + 1); };
  void restart;

    const total = scores.reduce((a, b) => a + b, 0);
  const parSoFar = scores.reduce((a, _, i) => a + getHole(i).par, 0);
  const rel = total - parSoFar;

  const fmt = (n: number) => (n === 0 ? "E" : n > 0 ? `+${n}` : `${n}`);

  // scorecard for the level in progress
  const levelStart = level * HOLES_PER_LEVEL;
  const levelHoles = Array.from({ length: HOLES_PER_LEVEL }, (_, k) => getHole(levelStart + k));
  const levelScores = scores.slice(levelStart, levelStart + HOLES_PER_LEVEL);
  const levelStrokes = levelScores.reduce((a, b) => a + b, 0);
  const levelPar = levelHoles.slice(0, levelScores.length).reduce((a, h) => a + h.par, 0);
  const levelRel = levelStrokes - levelPar;

  return (
    <div className="golf-root" data-scene-ready={ready ? "" : undefined}>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 5, -4] }} onCreated={() => requestAnimationFrame(() => setReady(true))}>
        <Sky sunPosition={[30, 40, -20]} turbidity={4} rayleigh={1.2} />
        <hemisphereLight args={["#cfe8ff", "#4d7a3a", 0.5]} />
        <directionalLight
          position={[8, 14, -6]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-camera-far={60}
          shadow-bias={-0.0005}
        />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={1} color="#bfe0ff" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <fog attach="fog" args={["#cfe3ee", 25, 60]} />
        <group position={[0, 0, 0]}>
          <Scene
            key={`${round}-${holeIdx}`}
            hole={hole}
            holeKey={holeIdx}
            canShoot={!sunk && !finished}
            onStroke={() => setStrokes((s) => s + 1)}
            onPenalty={() => { setStrokes((s) => s + 1); setToast("Splash! +1 penalty"); }}
            onSunk={() => {
              const s = strokesRef.current;
              setSunk(true);
              setToast(scoreName(s, hole.par));
              setScores((arr) => (arr.length === holeIdx ? [...arr, s] : arr));
              if (levelEnd) { setTimeout(playLevelUp, 450); onLevelComplete?.(level + 1); }
            }}
          />
        </group>
        <ContactShadows position={[0, 0.001, 0]} opacity={0} />
      </Canvas>

      <div className="golf-hud-top">
        <div className="golf-panel">
          <div className="golf-label">Level {level + 1}</div>
          <div className="golf-title">{hole.name}</div>
          <div className="golf-dots">
            {Array.from({ length: HOLES_PER_LEVEL }, (_, k) => (
              <span key={k} className={`golf-dot${k < (sunk ? slot + 1 : slot) ? " is-done" : ""}${k === slot ? " is-now" : ""}`} />
            ))}
          </div>
        </div>
        <div className="golf-panel golf-stats">
          <div><div className="golf-label">Hole</div><div className="golf-num">{slot + 1}/{HOLES_PER_LEVEL}</div></div>
          <div><div className="golf-label">Par</div><div className="golf-num">{hole.par}</div></div>
          <div><div className="golf-label">Strokes</div><div className="golf-num">{strokes}</div></div>
          <div><div className="golf-label">Level</div><div className="golf-num">{fmt(levelRel)}</div></div>
          <div><div className="golf-label">Total</div><div className="golf-num">{fmt(rel)}</div></div>
        </div>
      </div>

      {onMenu && <button className="golf-btn golf-menu-btn" onClick={onMenu}>☰ Menu</button>}
      {toast && <div className="golf-toast">{toast}</div>}

      {sunk && !levelEnd && (
        <div className="golf-center">
          <button className="golf-btn" onClick={next}>Next hole →</button>
        </div>
      )}

      {sunk && levelEnd && (
        <div className="golf-modal-wrap">
          <div className="golf-modal">
            <div className="golf-label">Complete!</div>
            <div className="golf-title-lg">Level {level + 1}</div>
            <table className="golf-table">
              <thead>
                <tr><th>Hole</th><th>Par</th><th>Strokes</th><th>±</th></tr>
              </thead>
              <tbody>
                {levelHoles.map((h, k) => {
                  const s = levelScores[k];
                  const diff = s === undefined ? null : s - h.par;
                  return (
                    <tr key={k}>
                      <td>{k + 1}. {h.name}</td>
                      <td>{h.par}</td>
                      <td>{s ?? "–"}</td>
                      <td className={diff === null ? "" : diff < 0 ? "golf-under" : diff > 0 ? "golf-over" : ""}>{diff === null ? "" : fmt(diff)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="golf-label">{levelStrokes} strokes · {levelPar} par · {fmt(levelRel)}</div>
            <button className="golf-btn" onClick={next} style={{ marginTop: 16 }}>Start Level {level + 2} →</button>
          </div>
        </div>
      )}

      <div className="golf-help">
        {TOUCH
          ? "Drag back from the ball and release to putt · Two fingers to rotate · Pinch to zoom"
          : "Drag back from the ball and release to putt · Right-drag / two fingers to rotate · Scroll to zoom"}
      </div>
    </div>
  );
}
