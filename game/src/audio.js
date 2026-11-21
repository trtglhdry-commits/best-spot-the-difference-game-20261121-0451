// Twin Lanterns — sound. Every effect is synthesised with the Web Audio API:
// no audio files, no network. A short pop on a find, a low buzz on a miss,
// a chime for a hint, an arpeggio when a scene clears.
let ctx = null;
let muted = false;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  try {
    const ac = audio();
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish: a browser without audio must never break play.
  }
}

export const sfx = {
  pop() {
    tone(880, 0.14, 'sine', 0.22, 0, 1320);
    tone(1320, 0.1, 'sine', 0.12, 0.05);
  },
  miss() {
    tone(160, 0.18, 'square', 0.1, 0, 110);
  },
  hint() {
    tone(1318, 0.16, 'sine', 0.14);
    tone(1760, 0.2, 'sine', 0.1, 0.09);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.09));
  },
  tick() {
    tone(1200, 0.05, 'sine', 0.08);
  },
  click() {
    tone(660, 0.06, 'sine', 0.1);
  },
  setMuted(value) {
    muted = value;
  },
  isMuted() {
    return muted;
  },
};
