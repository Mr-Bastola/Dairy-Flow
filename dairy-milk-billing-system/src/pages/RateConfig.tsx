import { useState } from 'react';
import { useStore } from '../store/store';
import { getTodayBS, formatBSDate } from '../utils/nepaliDate';
import { DollarSign, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateConfig() {
  const { currentRate, rateHistory, setRate } = useStore();
  const today = getTodayBS();
  const [newRate, setNewRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(formatBSDate(today));
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(newRate);
    if (!r || r <= 0) { toast.error('Invalid rate'); return; }
    if (confirm(`Change base rate to Rs. ${r}? This will NOT affect existing records.`)) {
      setRate(r, effectiveFrom);
      toast.success(`Rate updated to Rs. ${r}`);
      setNewRate('');
      setShowForm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Rate Configuration</h2>

      {/* Current Rate */}
      <div className="bg-green-700 text-white rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign size={22} />
          <span className="text-sm opacity-80">Current Active Rate</span>
        </div>
        <div className="text-5xl font-bold">Rs. {currentRate}</div>
        <div className="text-sm opacity-70 mt-2">per fat unit — used for all new entries</div>
      </div>

      {/* Change Rate */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Change Rate</h3>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-800">
            <Plus size={14} /> New Rate
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">New Base Rate (Rs.)</label>
                <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)}
                  placeholder="18.00" step="0.5" min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Effective From (BS)</label>
                <input type="text" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)}
                  placeholder="YYYY/MM/DD"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              ⚠️ Changing the rate will NOT modify existing milk records. Each record already stores the rate used at entry time.
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800">
                Update Rate
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Rate History */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">Rate History</h4>
        <div className="space-y-2">
          {[...rateHistory].reverse().map((r, i) => (
            <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
              <div>
                <div className="font-semibold text-gray-800">Rs. {r.rate}</div>
                <div className="text-xs text-gray-400">From: {r.effectiveFrom} · Set by: {r.setBy}</div>
              </div>
              {i === 0 && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Active</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
