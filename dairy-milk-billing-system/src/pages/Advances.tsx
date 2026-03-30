import { useState } from 'react';
import { useStore } from '../store/store';
import { getTodayBS, formatBSDate } from '../utils/nepaliDate';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Advances() {
  const { farmers, advances, addAdvance } = useStore();
  const today = getTodayBS();
  const [showModal, setShowModal] = useState(false);
  const [filterFarmer, setFilterFarmer] = useState('all');
  const [form, setForm] = useState({
    farmerId: farmers[0]?.id || '',
    amount: '',
    dateBS: formatBSDate(today),
    reason: '',
  });

  const filtered = advances
    .filter(a => filterFarmer === 'all' || a.farmerId === filterFarmer)
    .sort((a, b) => b.dateBS.localeCompare(a.dateBS));

  const totalOutstanding = advances.reduce((s, a) => s + a.remainingBalance, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error('Invalid amount'); return; }
    addAdvance({ farmerId: form.farmerId, amount: amt, dateBS: form.dateBS, reason: form.reason });
    toast.success(`Advance of ${fmtRs(amt)} recorded`);
    setShowModal(false);
    setForm({ ...form, amount: '', reason: '' });
  };

  const getFarmerName = (id: string) => farmers.find(f => f.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Advance Payments</h2>
        <button onClick={() => setShowModal(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2">
          <Plus size={15} /> Record Advance
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{fmtRs(totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">Total Outstanding Advances</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{advances.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Advance Records</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-xs text-gray-500 mb-1">Filter by Farmer</label>
        <select value={filterFarmer} onChange={e => setFilterFarmer(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="all">All Farmers</option>
          {farmers.map(f => <option key={f.id} value={f.id}>{f.id} — {f.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-3">Farmer</th>
                <th className="text-left p-3">Date (BS)</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Remaining</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No advance records</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{getFarmerName(a.farmerId)}</div>
                    <div className="text-xs text-gray-400">{a.farmerId}</div>
                  </td>
                  <td className="p-3 text-gray-600">{a.dateBS}</td>
                  <td className="p-3 text-right text-gray-700">{fmtRs(a.amount)}</td>
                  <td className="p-3 text-right">
                    <span className={`font-semibold ${a.remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {fmtRs(a.remainingBalance)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">{a.reason || '—'}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.remainingBalance <= 0 ? 'bg-green-100 text-green-700' :
                      a.remainingBalance < a.amount ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {a.remainingBalance <= 0 ? 'Cleared' : a.remainingBalance < a.amount ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Record Advance Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Farmer *</label>
                <select value={form.farmerId} onChange={e => setForm(f => ({ ...f, farmerId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  {farmers.filter(f => f.status === 'active').map(f => (
                    <option key={f.id} value={f.id}>{f.id} — {f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (Rs.) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" min="1" step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date (BS)</label>
                <input type="text" value={form.dateBS} onChange={e => setForm(f => ({ ...f, dateBS: e.target.value }))}
                  placeholder="YYYY/MM/DD"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Feed purchase, Personal loan, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800">
                  Save Advance
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
