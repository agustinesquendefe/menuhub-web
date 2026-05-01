import { useState } from 'react';

const WEEK_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export interface OpeningHoursDay {
  open: string;
  close: string;
  enabled: boolean;
}

export interface OpeningHours {
  [key: string]: OpeningHoursDay;
}

function formatHour(hour: string, hourFormat: '24h' | '12h') {
  if (!hour) return '';
  if (hourFormat === '24h') return hour;
  const [h, m] = hour.split(':');
  const date = new Date();
  date.setHours(Number(h));
  date.setMinutes(Number(m));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function OpeningHoursEditor({
  value,
  onChange,
  hourFormat = '12h',
}: {
  value: OpeningHours;
  onChange: (val: OpeningHours) => void;
  hourFormat?: '24h' | '12h';
}) {
  const [local, setLocal] = useState<OpeningHours>(value);

  function handleChange(day: string, field: keyof OpeningHoursDay, val: string | boolean) {
    const updated = {
      ...local,
      [day]: {
        ...local[day],
        [field]: val,
      },
    };
    setLocal(updated);
    onChange(updated);
  }

  return (
    <table className="w-full text-sm border rounded-xl overflow-hidden">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Day</th>
          <th className="p-2 text-center">Open</th>
          <th className="p-2 text-center">Opening time ({hourFormat})</th>
          <th className="p-2 text-center">Closing time ({hourFormat})</th>
        </tr>
      </thead>
      <tbody>
        {WEEK_DAYS.map(({ key, label }) => (
          <tr key={key} className="border-t">
            <td className="p-2 font-medium">{label}</td>
            <td className="p-2 text-center">
              <input
                type="checkbox"
                checked={local[key]?.enabled ?? false}
                onChange={e => handleChange(key, 'enabled', e.target.checked)}
              />
            </td>
            <td className="p-2 text-center">
              <input
                type="time"
                className="border rounded px-2 py-1"
                lang={hourFormat === '12h' ? 'en-US' : undefined}
                value={local[key]?.open ?? ''}
                onChange={e => handleChange(key, 'open', e.target.value)}
                disabled={!local[key]?.enabled}
                step="900"
              />
              {local[key]?.enabled && local[key]?.open && (
                <div className="mt-1 text-xs text-gray-500">{formatHour(local[key].open, hourFormat)}</div>
              )}
            </td>
            <td className="p-2 text-center">
              <input
                type="time"
                className="border rounded px-2 py-1"
                lang={hourFormat === '12h' ? 'en-US' : undefined}
                value={local[key]?.close ?? ''}
                onChange={e => handleChange(key, 'close', e.target.value)}
                disabled={!local[key]?.enabled}
                step="900"
              />
              {local[key]?.enabled && local[key]?.close && (
                <div className="mt-1 text-xs text-gray-500">{formatHour(local[key].close, hourFormat)}</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
