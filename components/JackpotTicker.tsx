"use client";

import { useJackpot } from "@/lib/persistence";

type Props = {
  pulse?: boolean;
};

const DOT_COUNT = 18;

export default function JackpotTicker({ pulse = false }: Props) {
  const [jackpot] = useJackpot();
  const dots = Array.from({ length: DOT_COUNT });

  return (
    <div className="jackpot-marquee" role="status" aria-label="Progressive jackpot">
      <div className="marquee-dot-rail top">
        {dots.map((_, i) => (
          <span
            key={`t${i}`}
            className="m-dot"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      <div className="marquee-dot-rail bottom">
        {dots.map((_, i) => (
          <span
            key={`b${i}`}
            className="m-dot"
            style={{ animationDelay: `${(DOT_COUNT - 1 - i) * 0.08}s` }}
          />
        ))}
      </div>
      <div className="marquee-eyebrow">▾ Progressive Jackpot ▾</div>
      <div className={pulse ? "marquee-value jackpot-pulse" : "marquee-value"}>
        ${jackpot.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
