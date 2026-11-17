/** Quellen des Modellwissens, auch für ältere gespeicherte Berichte ohne Links. */
export default function KnowledgeSources({ sources = [], source, checkedAt }) {
  const links = sources.filter((entry) => entry?.label && /^https:\/\//.test(entry.url || ""));
  if (!links.length && !source) return null;
  return (
    <span className="block text-[12px] font-normal text-muted">
      Quelle{links.length > 1 ? "n" : ""}: {links.length ? links.map((entry, index) => (
        <span key={entry.url}>
          {index > 0 && " · "}
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{entry.label}</a>
        </span>
      )) : source}
      {checkedAt && <span className="block">Geprüft: <time dateTime={checkedAt}>{checkedAt.split("-").reverse().join(".")}</time></span>}
    </span>
  );
}
