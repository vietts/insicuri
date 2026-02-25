import type { Report } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { formatRelativeDate } from '@/lib/utils';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const cat = CATEGORIES[report.category];

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat.icon}</span>
          <span className="text-sm font-medium text-gray-900">{cat.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`w-2 h-2 rounded-full ${
                n <= report.severity ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {report.description && (
        <p className="text-sm text-gray-600">{report.description}</p>
      )}

      {report.photo_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={report.photo_url}
          alt="Foto segnalazione"
          className="w-full h-40 object-cover rounded-lg"
        />
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{report.profiles?.display_name ?? 'Utente'}</span>
        <span>{formatRelativeDate(report.created_at)}</span>
      </div>
    </div>
  );
}
