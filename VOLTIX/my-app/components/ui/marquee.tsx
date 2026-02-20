"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--duration:40s] [--gap:1rem]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around",
            vertical
              ? "flex-col animate-marquee-vertical"
              : "flex-row animate-marquee",
            reverse &&
              (vertical
                ? "animate-marquee-vertical-reverse"
                : "animate-marquee-reverse"),
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            vertical ? "gap-[var(--gap)]" : "gap-[var(--gap)]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
