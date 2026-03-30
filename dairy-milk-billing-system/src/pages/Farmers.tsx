import { useState } from 'react';
import { useStore, Farmer } from '../store/store';
import { getTodayBS, formatBSDate } from '../utils/nepaliDate';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const today = getTodayBS();

export default function Farmers() {
  const { farmers, addFarmer, updateFarmer, toggleFarmerStatus, milkRecords, advances } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Farmer | null>(null);

  const [form, setForm] = useState({ name: '', phone: '', address: '', joiningDateBS: formatBSDate(today) });

  const filtered = farmers.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search);
    const matchFilter = filter === 'all' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', address: '', joiningDateBS: formatBSDate(today) }); setShowModal(true); };
  const openEdit = (f: Farmer) => { setEditing(f); setForm({ name: f.name, phone: f.phone, address: f.address, joiningDateBS: f.joiningDateBS }); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    if (editing) {
      updateFarmer(editing.id, form);
      toast.success('Farmer updated!');
    } else {
      addFarmer({ ...form, status: 'active' });
      toast.success('Farmer added!');
    }
    setShowModal(false);
  };

  const getFarmerStats = (id: string) => {
    const recs = milkRecords.filter(r => r.farmerId === id);
    const totalQty = recs.reduce((s, r) => s + r.morningQty + r.eveningQty, 0);
    const totalAmt = recs.reduce((s, r) => s + r.totalAmount, 0);
    const adv = advances.filter(a => a.farmerId === id).reduce((s, a) => s + a.remainingBalance, 0);
    return { totalQty: totalQty.toFixed(1), totalAmt: totalAmt.toFixed(2), advance: adv.toFixed(2) };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Farmer Management</h2>
        <button onClick={openAdd}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2">
          <Plus size={15} /> Add Farmer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 capitalize ${filter === f ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Address</th>
                <th className="text-right p-3">Total Qty (L)</th>
                <th className="text-right p-3">Total Amount</th>
                <th className="text-right p-3">Advance</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-gray-400">No farmers found</td></tr>
              )}
              {filtered.map(f => {
                const stats = getFarmerStats(f.id);
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs font-medium text-green-700">{f.id}</td>
                    <td className="p-3 font-medium text-gray-800">{f.name}</td>
                    <td className="p-3 text-gray-600">{f.phone}</td>
                    <td className="p-3 text-gray-500 text-xs max-w-[150px] truncate">{f.address}</td>
                    <td className="p-3 text-right text-gray-700">{stats.totalQty}</td>
                    <td className="p-3 text-right text-green-700 font-medium">Rs. {parseFloat(stats.totalAmt).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {parseFloat(stats.advance) > 0 ? (
                        <span className="text-orange-600 font-medium">Rs. {parseFloat(stats.advance).toLocaleString()}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(f)} className="text-blue-500 hover:text-blue-700 p-1">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { toggleFarmerStatus(f.id); toast.success(`Farmer ${f.status === 'active' ? 'deactivated' : 'activated'}`); }}
                          className={`p-1 ${f.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>
                          {f.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Farmer' : 'Add New Farmer'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Ram Bahadur Thapa' },
                { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '9841000000' },
                { label: 'Address', key: 'address', type: 'text', placeholder: 'Ward 3, Village' },
                { label: 'Joining Date (BS)', key: 'joiningDateBS', type: 'text', placeholder: 'YYYY/MM/DD' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors">
                  {editing ? 'Update' : 'Add Farmer'}
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
