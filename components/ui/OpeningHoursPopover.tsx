import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FaClock } from 'react-icons/fa';

const WEEK_DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export interface OpeningHoursDay {
  open: string;
  close: string;
  enabled: boolean;
}

export interface OpeningHours {
  [key: string]: OpeningHoursDay;
}

function getTodayKey(): string {
  // Returns 'monday', 'tuesday', ... (OpeningHours keys)
  const jsDay = new Date().getDay();
  // OpeningHours keys start with monday, but getDay() 0=Sunday
  return [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ][(jsDay + 6) % 7];
}

function formatHour(hour: string, hourFormat: '24h' | '12h') {
  if (!hour) return '';
  if (hourFormat === '24h') return hour;
  // hour: '14:30' → '2:30 PM'
  const [h, m] = hour.split(':');
  const date = new Date();
  date.setHours(Number(h));
  date.setMinutes(Number(m));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function OpeningHoursPopover({ openingHours, hourFormat = '24h' }: { openingHours: OpeningHours, hourFormat?: '24h' | '12h' }) {
  const [open, setOpen] = useState(false);
  const todayKey = getTodayKey();
  const todayLabel = WEEK_DAYS[new Date().getDay()];
  const today = openingHours?.[todayKey];

  return (
    <div className="relative inline-block">
      <div className='text-sm flex items-center space-x-2'>
        <FaClock size={15} className=''/>
        <span className=''>
            Hours:
        </span>
        <button
            className="underline text-gray-700 hover:text-gray-900 font-medium cursor-pointer"
            type="button"
        >
            {todayLabel}{' '}
            {today?.enabled
              ? `${formatHour(today.open, hourFormat)} - ${formatHour(today.close, hourFormat)}`
              : 'Cerrado'}
        </button>
        <span className={`font-semibold px-3 rounded-lg ${today.enabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
            {today.enabled ? "Open" : "Closed"}
        </span>
        <button
          className="ml-1"
          onClick={() => setOpen((v) => !v)}
          aria-label="See all opening hours"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <h4 className="font-semibold mb-2 text-gray-800">Horarios de la semana</h4>
          <ul className="space-y-1">
            {Object.entries(openingHours).map(([key, value], idx) => (
              <li key={key} className={key === todayKey ? 'font-bold text-orange-600' : ''}>
                {WEEK_DAYS[(idx + 1) % 7]}:{' '}
                {value.enabled ? `${formatHour(value.open, hourFormat)} - ${formatHour(value.close, hourFormat)}` : 'Cerrado'}
              </li>
            ))}
          </ul>
          <button
            className="mt-3 text-xs text-gray-500 hover:underline"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
