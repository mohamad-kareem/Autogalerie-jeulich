// The company stamp as printed text – used on both Kaufvertrag sheets.
// Font size comes from the parent (className or style), the lines scale with it.

import { COMPANY_STAMP } from "@/lib/company";

export default function CompanyStamp({ className = "", style }) {
  const [head, ...lines] = COMPANY_STAMP;
  return (
    <div
      aria-label="Firmenstempel"
      className={`pointer-events-none select-none whitespace-nowrap text-center leading-[1.25] text-[#111] ${className}`}
      style={style}
    >
      <p className="m-0 font-bold" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "1.12em" }}>
        {head}
      </p>
      {lines.map((line) => (
        <p key={line} className="m-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {line}
        </p>
      ))}
    </div>
  );
}
