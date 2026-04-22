import { useState } from 'react';

const WEEK_DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export interface OpeningHoursDay {
  open: string;
  close: string;
  enabled: boolean;
}

export interface OpeningHours {
  [key: string]: OpeningHoursDay;
}

export function OpeningHoursEditor({
  value,
  onChange,
  hourFormat = '24h',
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
          <th className="p-2 text-left">Día</th>
          <th className="p-2 text-center">Abierto</th>
          <th className="p-2 text-center">Hora de apertura</th>
          <th className="p-2 text-center">Hora de cierre</th>
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
                value={local[key]?.open ?? ''}
                onChange={e => handleChange(key, 'open', e.target.value)}
                disabled={!local[key]?.enabled}
                step="900"
              />
            </td>
            <td className="p-2 text-center">
              <input
                type="time"
                className="border rounded px-2 py-1"
                value={local[key]?.close ?? ''}
                onChange={e => handleChange(key, 'close', e.target.value)}
                disabled={!local[key]?.enabled}
                step="900"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
