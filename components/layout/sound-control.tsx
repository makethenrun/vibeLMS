"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getAnswerSoundPrefs,
  playCorrectSound,
  setAnswerSoundPrefs,
} from "@/lib/audio/answer-sound";

/**
 * Header control (all roles) for the answer-feedback sounds: mute/unmute and
 * volume, stored per-user in localStorage. Playing a short sample on change so
 * the user hears the level. There is no global/for-everyone setting — each user
 * controls only their own device.
 */
export function SoundControl() {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const ref = useRef<HTMLDivElement>(null);

  // Initialise from stored prefs on mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    const p = getAnswerSoundPrefs();
    setMuted(p.muted);
    setVolume(p.volume);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function persist(next: { muted?: boolean; volume?: number }, sample = false) {
    const prefs = { muted: next.muted ?? muted, volume: next.volume ?? volume };
    if (next.muted !== undefined) setMuted(next.muted);
    if (next.volume !== undefined) setVolume(next.volume);
    setAnswerSoundPrefs(prefs);
    if (sample && !prefs.muted && prefs.volume > 0) playCorrectSound();
  }

  const off = muted || volume <= 0;

  return (
    <div ref={ref} className="relative shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9"
        aria-label="Звук ответов"
        title="Звук правильного/неправильного ответа"
        onClick={() => setOpen((o) => !o)}
      >
        {off ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5" />}
      </Button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-60 rounded-lg border bg-popover p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium">Звук ответов</p>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!muted} onChange={(e) => persist({ muted: !e.target.checked })} />
            Включить звуки
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Громкость
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(volume * 100)}
              disabled={muted}
              onChange={(e) => persist({ volume: Number(e.target.value) / 100 })}
              onMouseUp={() => persist({}, true)}
              onTouchEnd={() => persist({}, true)}
              className="flex-1"
            />
            <span className="w-8 text-right tabular-nums">{Math.round(volume * 100)}%</span>
          </label>
          <p className="mt-2 text-[11px] text-muted-foreground">Только для вашего устройства.</p>
        </div>
      ) : null}
    </div>
  );
}
