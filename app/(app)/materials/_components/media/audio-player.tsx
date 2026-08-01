"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState(1);

  function setRate(rate: number) {
    setSpeed(rate);
    if (ref.current) ref.current.playbackRate = rate;
  }

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={ref} controls src={src} className="w-full" />
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-muted-foreground">Скорость:</span>
        {SPEEDS.map((rate) => (
          <Button
            key={rate}
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2 text-xs", speed === rate && "bg-accent text-accent-foreground")}
            onClick={() => setRate(rate)}
          >
            {rate}×
          </Button>
        ))}
      </div>
    </div>
  );
}
