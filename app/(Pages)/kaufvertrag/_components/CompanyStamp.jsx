export default function CompanyStamp({ imageId, className = "", style }) {
  if (!imageId) return null;
  return (
    <div className={`pointer-events-none flex select-none items-center justify-center ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-company-stamp src={imageId} alt="Firmenstempel" className="h-auto max-h-full w-auto max-w-full" />
    </div>
  );
}
