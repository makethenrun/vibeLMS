"use client";

/**
 * Short synthesized feedback sounds for a graded answer (correct / incorrect),
 * with per-user volume and mute stored in localStorage. Sounds are generated
 * with the Web Audio API so no audio assets are needed. A partially-correct
 * answer uses the same sound as an incorrect one (see callers).
 */

export interface AnswerSoundPrefs {
  muted: boolean;
  /** 0..1 */
  volume: number;
}

const KEY = "answerSound";
const DEFAULT: AnswerSoundPrefs = { muted: false, volume: 0.5 };

let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

export function getAnswerSoundPrefs(): AnswerSoundPrefs {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AnswerSoundPrefs>;
      return {
        muted: Boolean(p.muted),
        volume: typeof p.volume === "number" ? Math.max(0, Math.min(1, p.volume)) : DEFAULT.volume,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

export function setAnswerSoundPrefs(prefs: AnswerSoundPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Subscribe to preference changes (e.g. to keep a control's UI in sync). */
export function subscribeAnswerSound(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function play(sequence: { freq: number; dur: number }[], type: OscillatorType, gainScale: number): void {
  if (typeof window === "undefined") return;
  const prefs = getAnswerSoundPrefs();
  if (prefs.muted || prefs.volume <= 0) return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = ctx ?? new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    let t = ctx.currentTime;
    for (const { freq, dur } of sequence) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const vol = Math.max(0.0001, prefs.volume * gainScale);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {
    /* ignore */
  }
}

/** A bright rising two-note chime. */
export function playCorrectSound(): void {
  play([{ freq: 660, dur: 0.12 }, { freq: 990, dur: 0.16 }], "sine", 0.3);
}

/** A low falling buzz (also used for partially-correct answers). */
export function playIncorrectSound(): void {
  play([{ freq: 220, dur: 0.16 }, { freq: 160, dur: 0.22 }], "sawtooth", 0.18);
}

/** Plays the correct sound only for a full score; partial/zero uses incorrect. */
export function playAnswerSound(score: number): void {
  if (score >= 100) playCorrectSound();
  else playIncorrectSound();
}
