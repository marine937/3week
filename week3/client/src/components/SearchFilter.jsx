export default function SearchFilter({
  search,
  onSearchChange,
  filters = [],
  onFilterChange,
  filterValues = {},
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="label">Search</label>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="input"
        />
      </div>
      {filters.map((f) => (
        <div key={f.key} className="min-w-[140px]">
          <label className="label">{f.label}</label>
          <select
            value={filterValues[f.key] || ''}
            onChange={(e) => onFilterChange(f.key, e.target.value)}
            className="input"
          >
            <option value="">All</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
