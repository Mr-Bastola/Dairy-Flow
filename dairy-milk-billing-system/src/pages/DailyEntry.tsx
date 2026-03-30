import { useState, useRef, useEffect } from 'react';
import { useStore, Farmer, MilkRecord } from '../store/store';
import { getTodayBS, formatBSDate, BS_MONTHS } from '../utils/nepaliDate';
import { Save, Search, Sun, Sunset, Edit2, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt2 = (n: number) => n.toFixed(2);
const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function DailyEntry() {
  const { farmers, milkRecords, addMilkRecord, updateMilkRecord, deleteMilkRecord, currentRate } = useStore();
  const today = getTodayBS();
  const [dateBS, setDateBS] = useState(formatBSDate(today));
  const [search, setSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Shift toggle: 'morning' | 'evening' | 'both'
  const [shiftMode, setShiftMode] = useState<'morning' | 'evening' | 'both'>('both');

  const [mQty, setMQty] = useState('');
  const [mFat, setMFat] = useState('');
  const [eQty, setEQty] = useState('');
  const [eFat, setEFat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Real-time calcs
  const mAmt = (parseFloat(mQty) || 0) * (parseFloat(mFat) || 0) * currentRate;
  const eAmt = (parseFloat(eQty) || 0) * (parseFloat(eFat) || 0) * currentRate;
  const total = mAmt + eAmt;

  const activeFarmers = farmers.filter(f => f.status === 'active');
  const filtered = activeFarmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.id.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

  // Today's entries (sorted newest first by farmer ID)
  const todayEntries = milkRecords
    .filter(r => r.dateBS === dateBS)
    .sort((a, b) => b.id.localeCompare(a.id));

  // Check if selected farmer already has record for selected date
  const existingRecord = selectedFarmer
    ? milkRecords.find(r => r.farmerId === selectedFarmer.id && r.dateBS === dateBS)
    : null;

  const selectFarmer = (f: Farmer) => {
    setSelectedFarmer(f);
    setSearch(`${f.id} — ${f.name}`);
    setShowDropdown(false);
    // Pre-fill if editing existing
    const existing = milkRecords.find(r => r.farmerId === f.id && r.dateBS === dateBS);
    if (existing && !editingId) {
      setMQty(String(existing.morningQty));
      setMFat(String(existing.morningFat));
      setEQty(String(existing.eveningQty));
      setEFat(String(existing.eveningFat));
    }
  };

  const clearForm = () => {
    setSelectedFarmer(null);
    setSearch('');
    setMQty(''); setMFat(''); setEQty(''); setEFat('');
    setEditingId(null);
    searchRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) { toast.error('Please select a farmer'); return; }

    const mqty = parseFloat(mQty) || 0;
    const mfat = parseFloat(mFat) || 0;
    const eqty = parseFloat(eQty) || 0;
    const efat = parseFloat(eFat) || 0;

    // Validation
    if (shiftMode !== 'evening' && mqty === 0 && eqty === 0) {
      toast.error('At least one shift must have a quantity'); return;
    }
    if (mqty > 200 || eqty > 200) { toast.error('Quantity cannot exceed 200 liters'); return; }
    if ((mfat && (mfat < 1 || mfat > 14)) || (efat && (efat < 1 || efat > 14))) {
      toast.error('Fat% must be between 1.0 and 14.0'); return;
    }

    if (editingId) {
      updateMilkRecord(editingId, {
        morningQty: mqty, morningFat: mfat,
        eveningQty: eqty, eveningFat: efat,
      });
      toast.success('Record updated!');
    } else {
      const result = addMilkRecord({
        farmerId: selectedFarmer.id,
        dateBS,
        morningQty: mqty, morningFat: mfat,
        eveningQty: eqty, eveningFat: efat,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        return;
      }
    }
    clearForm();
  };

  const startEdit = (r: MilkRecord) => {
    const farmer = farmers.find(f => f.id === r.farmerId);
    if (farmer) {
      setSelectedFarmer(farmer);
      setSearch(`${farmer.id} — ${farmer.name}`);
    }
    setMQty(String(r.morningQty)); setMFat(String(r.morningFat));
    setEQty(String(r.eveningQty)); setEFat(String(r.eveningFat));
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this milk record?')) {
      deleteMilkRecord(id);
      toast.success('Record deleted');
      if (editingId === id) clearForm();
    }
  };

  const getFarmerName = (id: string) => farmers.find(f => f.id === id)?.name || id;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Daily Milk Entry</h2>
        <div className="text-sm text-green-700 font-medium bg-green-50 px-3 py-1 rounded-lg">
          Rate: Rs. {currentRate}/fat unit
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date + Shift Row */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">📅 Date (BS)</label>
              <input type="text" value={dateBS} onChange={e => setDateBS(e.target.value)}
                placeholder="YYYY/MM/DD"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">🔄 Shift Mode</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                {(['morning', 'evening', 'both'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setShiftMode(s)}
                    className={`flex-1 py-2 capitalize transition-colors ${shiftMode === s ? 'bg-green-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {s === 'morning' ? '☀️ AM' : s === 'evening' ? '🌙 PM' : '☀️🌙 Both'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Farmer Search */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">👨‍🌾 Farmer</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={searchRef} type="text" value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelectedFarmer(null); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name, ID, or phone..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            {showDropdown && search && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400">No farmers found</div>
                ) : filtered.map(f => (
                  <button key={f.id} type="button" onClick={() => selectFarmer(f)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm border-b border-gray-50 last:border-0 flex justify-between items-center">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-gray-400 text-xs">{f.id} • {f.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {existingRecord && !editingId && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <AlertCircle size={15} />
              Record exists for this date. Click <button type="button" onClick={() => startEdit(existingRecord)} className="underline font-medium">Edit</button> to modify.
            </div>
          )}

          {/* Input Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Morning */}
            {shiftMode !== 'evening' && (
              <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sun size={16} className="text-yellow-500" />
                  <span className="font-semibold text-gray-700 text-sm">Morning</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Qty (Liters)</label>
                    <input type="number" id="mQty" value={mQty} onChange={e => setMQty(e.target.value)}
                      step="0.1" min="0" max="200" placeholder="0.0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Fat %</label>
                    <input type="number" value={mFat} onChange={e => setMFat(e.target.value)}
                      step="0.1" min="0" max="14" placeholder="0.0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mt-1" />
                  </div>
                  <div className="bg-yellow-100 rounded-lg px-3 py-2 text-sm font-semibold text-yellow-800 text-center">
                    {fmtRs(mAmt)}
                  </div>
                </div>
              </div>
            )}

            {/* Evening */}
            {shiftMode !== 'morning' && (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sunset size={16} className="text-blue-500" />
                  <span className="font-semibold text-gray-700 text-sm">Evening</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Qty (Liters)</label>
                    <input type="number" value={eQty} onChange={e => setEQty(e.target.value)}
                      step="0.1" min="0" max="200" placeholder="0.0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Fat %</label>
                    <input type="number" value={eFat} onChange={e => setEFat(e.target.value)}
                      step="0.1" min="0" max="14" placeholder="0.0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1" />
                  </div>
                  <div className="bg-blue-100 rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 text-center">
                    {fmtRs(eAmt)}
                  </div>
                </div>
              </div>
            )}
            {shiftMode === 'morning' && <div />}
            {shiftMode === 'evening' && <div />}
          </div>

          {/* Total */}
          <div className="bg-green-700 text-white rounded-xl px-5 py-4 text-center">
            <div className="text-xs opacity-75 mb-1">DAILY TOTAL</div>
            <div className="text-3xl font-bold">{fmtRs(total)}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit"
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Save size={18} />
              {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
            {editingId && (
              <button type="button" onClick={clearForm}
                className="px-4 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Today's Entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Entries for {dateBS}</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{todayEntries.length} records</span>
        </div>
        {todayEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No entries for this date yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left p-3">Farmer</th>
                  <th className="text-center p-3">Qty M</th>
                  <th className="text-center p-3">Fat M</th>
                  <th className="text-center p-3">Qty E</th>
                  <th className="text-center p-3">Fat E</th>
                  <th className="text-center p-3">Rate</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayEntries.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${editingId === r.id ? 'bg-yellow-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{getFarmerName(r.farmerId)}</div>
                      <div className="text-xs text-gray-400">{r.farmerId}</div>
                    </td>
                    <td className="p-3 text-center text-yellow-700 font-medium">{r.morningQty}</td>
                    <td className="p-3 text-center text-gray-600">{r.morningFat}%</td>
                    <td className="p-3 text-center text-blue-700 font-medium">{r.eveningQty}</td>
                    <td className="p-3 text-center text-gray-600">{r.eveningFat}%</td>
                    <td className="p-3 text-center text-gray-500">{r.rateUsed}</td>
                    <td className="p-3 text-right font-bold text-green-700">{fmtRs(r.totalAmount)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(r)} className="text-blue-500 hover:text-blue-700 p-1">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-green-50 font-semibold text-sm">
                <tr>
                  <td className="p-3 text-green-800">TOTALS</td>
                  <td className="p-3 text-center text-yellow-700">{fmt2(todayEntries.reduce((s, r) => s + r.morningQty, 0))}</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-center text-blue-700">{fmt2(todayEntries.reduce((s, r) => s + r.eveningQty, 0))}</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-right text-green-700">{fmtRs(todayEntries.reduce((s, r) => s + r.totalAmount, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
