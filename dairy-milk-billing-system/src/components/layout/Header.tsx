import { Menu, Clock, Calendar } from 'lucide-react';
import { useStore } from '../../store/store';
import { getTodayBS, formatBSFull, BS_MONTHS, getCurrentTimeKTM } from '../../utils/nepaliDate';
import { useState, useEffect } from 'react';

interface Props { onMenuClick: () => void; }

export default function Header({ onMenuClick }: Props) {
  const { profile, fiscalYears, currentFiscalYear, switchYear } = useStore();
  const [time, setTime] = useState(getCurrentTimeKTM());
  const todayBS = getTodayBS();

  useEffect(() => {
    const t = setInterval(() => setTime(getCurrentTimeKTM()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-4 shrink-0">
      <button onClick={onMenuClick} className="text-gray-500 hover:text-green-700 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-green-800 text-sm truncate">{profile.dairyName}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatBSFull(todayBS)} ({BS_MONTHS[todayBS.month - 1]})
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {time} KTM
          </span>
        </div>
      </div>

      {/* Fiscal Year Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 hidden sm:block">Year:</label>
        <select
          value={currentFiscalYear}
          onChange={e => switchYear(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-green-50 text-green-800 font-semibold focus:outline-none focus:ring-1 focus:ring-green-400"
        >
          {fiscalYears.map(fy => (
            <option key={fy.id} value={fy.yearBS}>
              {fy.yearBS} {fy.status === 'archived' ? '(Archived)' : '(Active)'}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
