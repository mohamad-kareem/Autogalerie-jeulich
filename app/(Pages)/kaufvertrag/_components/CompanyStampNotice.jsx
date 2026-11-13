import Link from "next/link";

export default function CompanyStampNotice({ stamp }) {
  return (
    <p className="mt-1 text-[12px] text-muted">
      {stamp.loading ? "Firmenstempel wird geladen …" : stamp.error || (
        <>In den <Link href="/einstellungen#firmenstempel" className="link">Einstellungen</Link> kann ein Firmenstempel hinterlegt werden.</>
      )}
    </p>
  );
}
