import { exportToCsv, exportToPdf } from '../utils/export';

export default function ExportButtons({ title, columns, rows }) {
  if (!rows?.length) return null;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="btn-secondary text-xs sm:text-sm"
        onClick={() => exportToCsv(title.toLowerCase(), columns, rows)}
      >
        Export CSV
      </button>
      <button
        type="button"
        className="btn-secondary text-xs sm:text-sm"
        onClick={() => exportToPdf(title, columns, rows)}
      >
        Export PDF
      </button>
    </div>
  );
}
