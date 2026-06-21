// Pure Web Audio API ASMR generators (no external files).
type Stop = () => void;

const ctxRef: { ctx: AudioContext | null } = { ctx: null };
const getCtx = (): AudioContext => {
  if (!ctxRef.ctx) {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
    ctxRef.ctx = new Ctor();
  }
  return ctxRef.ctx!;
};

const makeNoiseBuffer = (ctx: AudioContext, type: 'white' | 'pink' | 'brown') => {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let lastOut = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') data[i] = white;
    else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }
  return buf;
};

export const playRain = (): Stop => {
  const ctx = getCtx();
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 'brown');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  src.connect(lp).connect(gain).connect(ctx.destination);
  src.start();
  return () => { try { src.stop(); } catch {} };
};

export const playFire = (): Stop => {
  const ctx = getCtx();
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 'pink');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const gain = ctx.createGain();
  gain.gain.value = 0.25;
  src.connect(lp).connect(gain).connect(ctx.destination);
  // Crackle: random gain bumps
  const interval = window.setInterval(() => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.45 + Math.random() * 0.25, t + 0.05);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
  }, 250);
  src.start();
  return () => {
    window.clearInterval(interval);
    try { src.stop(); } catch {}
  };
};

export const playCafe = (): Stop => {
  const ctx = getCtx();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sine'; osc1.frequency.value = 110;
  osc2.type = 'sine'; osc2.frequency.value = 117; // slight beat → binaural-ish hum
  const gain = ctx.createGain();
  gain.gain.value = 0.12;
  // Light pink noise bed for ambience
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx, 'pink');
  noise.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 600;
  const ngain = ctx.createGain();
  ngain.gain.value = 0.08;
  osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
  noise.connect(lp).connect(ngain).connect(ctx.destination);
  osc1.start(); osc2.start(); noise.start();
  return () => {
    try { osc1.stop(); osc2.stop(); noise.stop(); } catch {}
  };
};

export const playPop = () => {
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(700, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.2);
  } catch {}
};

export const playChime = () => {
  try {
    const ctx = getCtx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + i * 0.1 + 0.65);
    });
  } catch {}
};