// Tiny synthesized sound effects (no assets needed).
let ctx: AudioContext | null = null;
let lastBounce = 0;
function ac() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
function blip(freq: number, dur: number, vol: number, type: OscillatorType = "sine", end = freq * 0.5) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(end, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}
export const playHit = (p: number) => blip(900 + p * 600, 0.08, 0.25 + p * 0.3, "triangle");
export const playBounce = () => { const n = performance.now(); if (n - lastBounce < 80) return; lastBounce = n; blip(320, 0.06, 0.15, "square", 200); };
export const playCup = () => { blip(500, 0.1, 0.3, "sine", 300); setTimeout(() => blip(260, 0.25, 0.3, "sine", 120), 90); };
export const playSplash = () => {
  const a = ac(); if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = "lowpass"; f.frequency.value = 1200; g.gain.value = 0.4;
  s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
};
export const playLevelUp = () => {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.2, 0.22, "triangle", f * 1.03), i * 110));
};
