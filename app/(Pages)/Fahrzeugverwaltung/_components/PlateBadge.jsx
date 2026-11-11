"use client";

import { cx } from "@/app/(components)/sales/ui";

const HEIGHTS = { xs: 20, sm: 24, md: 32, lg: 40 };

// 12 EU stars on a circle (viewBox 0..20).
const STARS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { x: 10 + Math.sin(a) * 7, y: 10 - Math.cos(a) * 7 };
});

/**
 * German number plate in the real proportions: white plate with a thin inset
 * rim, blue EU band (star ring above "D") and a number optically
 * centred on its cap height.
 */
export default function PlateBadge({ number, size = "md", muted = false, red = true, className }) {
  const h = HEIGHTS[size] || HEIGHTS.md;
  const band = Math.round(h * 0.44);
  const ring = Math.round(h * 0.4);
  const pad = Math.round(h * 0.34);

  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 items-stretch overflow-hidden rounded-[3px] border border-[#9aa2ad] bg-white p-px leading-none",
        "shadow-[0_1px_2px_rgba(15,23,42,0.10)]",
        muted && "opacity-50 grayscale",
        className,
      )}
      style={{ height: h }}
    >
      <span className="flex flex-1 items-stretch overflow-hidden rounded-[2px] ring-1 ring-inset ring-[#5b646f]/70">
        {/* EU band */}
        <span
          className="flex shrink-0 flex-col items-center justify-center bg-[#003399] text-white"
          style={{ width: band, gap: Math.max(1, Math.round(h * 0.06)) }}
        >
          <svg viewBox="0 0 20 20" width={ring} height={ring} aria-hidden className="block">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r="1.5" fill="#ffcc00" />
            ))}
          </svg>
          <span className="block font-sans font-bold" style={{ fontSize: Math.max(6, Math.round(h * 0.27)), lineHeight: 1, textBox: "trim-both cap alphabetic" }}>
            D
          </span>
        </span>

        {/* Number – trimmed to the cap height so it sits exactly in the middle */}
        <span className="flex flex-1 items-center justify-center" style={{ paddingLeft: pad, paddingRight: pad }}>
          <span
            className={cx("block whitespace-nowrap uppercase", red ? "text-[#c8102e]" : "text-[#171717]")}
            style={{
              fontFamily: '"DIN 1451 Std", "Bahnschrift", "DIN Alternate", "Arial Narrow", "Roboto Condensed", sans-serif',
              fontStretch: "condensed",
              fontWeight: 600,
              fontSize: Math.round(h * 0.62),
              lineHeight: 1,
              letterSpacing: "0.06em",
              marginRight: "-0.06em",
              textBox: "trim-both cap alphabetic",
            }}
          >
            {number}
          </span>
        </span>
      </span>
    </span>
  );
}
