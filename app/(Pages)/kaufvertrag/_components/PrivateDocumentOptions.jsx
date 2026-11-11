export default function PrivateDocumentOptions({ value, onChange, disabled = false }) {
  return (
    <fieldset aria-label="Vertragsoptionen" disabled={disabled} className="card min-w-0 space-y-2.5 p-4">
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Vertragsoptionen</h2>
      <label className="block space-y-1 text-[12px] text-ink">
        <span>Logo</span>
        <select
          className="field"
          value={value.logo}
          onChange={(event) => onChange({ ...value, logo: event.target.value })}
        >
          <option value="tuev">TÜV SÜD</option>
          <option value="company">Autogalerie Jülich</option>
        </select>
      </label>
      <label className="block space-y-1 text-[12px] text-ink">
        <span>Gewährleistungsausschluss</span>
        <select
          className="field"
          value={value.includeWarrantyExclusion ? "include" : "omit"}
          onChange={(event) => onChange({ ...value, includeWarrantyExclusion: event.target.value === "include" })}
        >
          <option value="include">Beibehalten</option>
          <option value="omit">Weglassen</option>
        </select>
      </label>
    </fieldset>
  );
}
