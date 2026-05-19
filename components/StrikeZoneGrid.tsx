"use client";

import { useMemo, useState } from "react";
import type { Bet, ChipValue } from "@/lib/gameState";

// Per W2 wireframe (product-doc.html:613-621) and LINES array (lib/bets.ts:3-12):
//   line 0 [0,1,2] top row     → left edge, top
//   line 1 [3,4,5] middle row  → left edge, mid
//   line 2 [6,7,8] bottom row  → left edge, bottom
//   line 3 [0,3,6] left col    → top edge, left
//   line 4 [1,4,7] middle col  → top edge, mid
//   line 5 [2,5,8] right col   → top edge, right
//   line 6 [0,4,8] main diag   → bottom-right corner
//   line 7 [2,4,6] anti-diag   → top-right corner
type Marker = { line: number; x: string; y: string; label: string };
const LINE_MARKERS: ReadonlyArray<Marker> = [
  { line: 0, x: "-7%", y: "16.67%", label: "Top row" },
  { line: 1, x: "-7%", y: "50%", label: "Middle row" },
  { line: 2, x: "-7%", y: "83.33%", label: "Bottom row" },
  { line: 3, x: "16.67%", y: "-7%", label: "Left column" },
  { line: 4, x: "50%", y: "-7%", label: "Middle column" },
  { line: 5, x: "83.33%", y: "-7%", label: "Right column" },
  { line: 7, x: "107%", y: "-7%", label: "Anti-diagonal" },
  { line: 6, x: "107%", y: "107%", label: "Main diagonal" },
];

// Endpoints in the SVG viewBox (0..200), extended ±14 outside the grid so the
// stroke runs marker-to-marker through the cell centers.
type LineEndpoints = { x1: number; y1: number; x2: number; y2: number };
const LINE_ENDPOINTS: ReadonlyArray<LineEndpoints> = [
  { x1: -14,    y1: 33.33,  x2: 214,   y2: 33.33  }, // 0 top row
  { x1: -14,    y1: 100,    x2: 214,   y2: 100    }, // 1 middle row
  { x1: -14,    y1: 166.67, x2: 214,   y2: 166.67 }, // 2 bottom row
  { x1: 33.33,  y1: -14,    x2: 33.33, y2: 214    }, // 3 left col
  { x1: 100,    y1: -14,    x2: 100,   y2: 214    }, // 4 middle col
  { x1: 166.67, y1: -14,    x2: 166.67, y2: 214   }, // 5 right col
  { x1: -14,    y1: -14,    x2: 214,   y2: 214    }, // 6 main diag
  { x1: 214,    y1: -14,    x2: -14,   y2: 214    }, // 7 anti diag
];

type Props = {
  bets: ReadonlyArray<Bet>;
  activeChip: ChipValue;
  onPlaceZone: (cell: number) => void;
  onPlaceLine: (line: number) => void;
};

function aggregate(bets: ReadonlyArray<Bet>) {
  const cells = new Map<number, number>();
  const lines = new Map<number, number>();
  for (const bet of bets) {
    if (bet.kind === "zone") {
      cells.set(bet.cell, (cells.get(bet.cell) ?? 0) + bet.amount);
    } else {
      lines.set(bet.line, (lines.get(bet.line) ?? 0) + bet.amount);
    }
  }
  return { cells, lines };
}

function chipColor(total: number): string {
  if (total >= 100) return "var(--yellow)";
  if (total >= 25) return "var(--magenta)";
  if (total >= 5) return "var(--cyan)";
  return "var(--cream)";
}

function discStyle(total: number, size: number): React.CSSProperties {
  const color = chipColor(total);
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, ${color}, ${color} 60%, rgba(0,0,0,0.3) 100%)`,
    color: total >= 25 ? "var(--cream)" : "var(--bg)",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 800,
    fontSize: size > 30 ? 13 : 10,
    fontVariantNumeric: "tabular-nums",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 4px 10px rgba(0,0,0,0.5), inset 0 -3px 0 rgba(0,0,0,0.22), 0 0 0 1px rgba(255,244,219,0.35)",
  };
}

export default function StrikeZoneGrid({ bets, activeChip, onPlaceZone, onPlaceLine }: Props) {
  const { cells, lines } = useMemo(() => aggregate(bets), [bets]);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const previewColor = chipColor(activeChip);
  const showPreview = hoveredLine !== null && !lines.has(hoveredLine);

  return (
    <div
      style={{
        position: "relative",
        width: "min(60vw, 380px)",
        aspectRatio: "1 / 1",
      }}
    >
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        {Array.from(lines.entries()).map(([line, total]) => {
          const ep = LINE_ENDPOINTS[line];
          if (!ep) return null;
          return (
            <line
              key={`placed-${line}`}
              className="line-placed"
              x1={ep.x1}
              y1={ep.y1}
              x2={ep.x2}
              y2={ep.y2}
              style={{ color: chipColor(total) }}
            />
          );
        })}
        {showPreview && hoveredLine !== null && LINE_ENDPOINTS[hoveredLine] && (
          <line
            className="line-preview"
            x1={LINE_ENDPOINTS[hoveredLine].x1}
            y1={LINE_ENDPOINTS[hoveredLine].y1}
            x2={LINE_ENDPOINTS[hoveredLine].x2}
            y2={LINE_ENDPOINTS[hoveredLine].y2}
            style={{ color: previewColor }}
          />
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "3px",
          padding: "3px",
          background: "rgba(12,10,31,0.45)",
          boxShadow:
            "0 0 0 1.5px var(--cyan), inset 0 0 18px rgba(42,234,255,0.18), 0 0 32px rgba(42,234,255,0.30)",
          borderRadius: 4,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => {
          const total = cells.get(cell) ?? 0;
          const placed = total > 0;
          return (
            <button
              key={cell}
              type="button"
              aria-label={`Zone cell ${cell + 1}${placed ? `, $${total} placed` : ""}`}
              onClick={() => onPlaceZone(cell)}
              className={`zone-cell scanline${placed ? " placed" : ""}`}
              style={{
                position: "relative",
                border: "1px solid rgba(42,234,255,0.32)",
                cursor: "pointer",
                padding: 0,
                color: "var(--cream)",
              }}
            >
              {placed && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 3,
                    ...discStyle(total, 40),
                  }}
                >
                  ${total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Decorative corner endpoints */}
      {[
        { top: -5, left: -5 },
        { top: -5, right: -5 },
        { bottom: -5, left: -5 },
        { bottom: -5, right: -5 },
      ].map((pos, idx) => (
        <span
          key={idx}
          aria-hidden
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--cyan)",
            boxShadow: "0 0 10px var(--cyan)",
            pointerEvents: "none",
            ...pos,
          }}
        />
      ))}

      {LINE_MARKERS.map(({ line, x, y, label }) => {
        const total = lines.get(line) ?? 0;
        const placed = total > 0;
        return (
          <button
            key={line}
            type="button"
            aria-label={`${label} bet${placed ? `, $${total} placed` : ""}`}
            onClick={() => onPlaceLine(line)}
            onMouseEnter={() => setHoveredLine(line)}
            onMouseLeave={() => setHoveredLine(null)}
            onFocus={() => setHoveredLine(line)}
            onBlur={() => setHoveredLine(null)}
            className={`line-marker${placed ? " placed" : ""}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              padding: 0,
              cursor: "pointer",
              zIndex: 4,
              ...(placed
                ? discStyle(total, 32)
                : {
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "1.5px solid var(--cyan)",
                    background: "rgba(42,234,255,0.25)",
                    boxShadow: "0 0 8px rgba(42,234,255,0.45)",
                    color: "transparent",
                  }),
            }}
          >
            {placed ? `$${total}` : ""}
          </button>
        );
      })}
    </div>
  );
}
