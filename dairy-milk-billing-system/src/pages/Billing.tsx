import { useState } from 'react';
import { useStore } from '../store/store';
import { getTodayBS, BS_MONTHS, getFortnightRange } from '../utils/nepaliDate';
import { Receipt, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Billing() {
  const { farmers, milkRecords, advances, generateInvoice, invoices } = useStore();
  const today = getTodayBS();
  const [month, setMonth] = useState(today.month);
  const [half, setHalf] = useState<1 | 2>(today.day <= 15 ? 1 : 2);
  const [generated, setGenerated] = useState<string[]>([]);

  const { start, end } = getFortnightRange(today.year, month, half);

  // Build billing preview for active farmers
  const preview = farmers
    .filter(f => f.status === 'active')
    .map(f => {
      const recs = milkRecords.filter(r => r.farmerId === f.id && r.dateBS >= start && r.dateBS <= end);
      const totalQty = recs.reduce((s, r) => s + r.morningQty + r.eveningQty, 0);
      const grossAmount = recs.reduce((s, r) => s + r.totalAmount, 0);
      const outstanding = advances.filter(a => a.farmerId === f.id && a.remainingBalance > 0)
        .reduce((s, a) => s + a.remainingBalance, 0);
      const advDeduction = Math.min(grossAmount, outstanding);
      const netPayable = grossAmount - advDeduction;
      const alreadyInvoiced = invoices.find(
        i => i.farmerId === f.id && i.periodStart === start && i.periodEnd === end
      );
      return { farmer: f, records: recs, totalQty, grossAmount, advDeduction, netPayable, alreadyInvoiced };
    });

  const totalGross = preview.reduce((s, p) => s + p.grossAmount, 0);
  const totalNet = preview.reduce((s, p) => s + p.netPayable, 0);
  const totalQty = preview.reduce((s, p) => s + p.totalQty, 0);

  const generateOne = (farmerId: string) => {
    const inv = generateInvoice(farmerId, start, end);
    if (inv) {
      setGenerated(g => [...g, farmerId]);
      toast.success(`Invoice generated for farmer ${farmerId}`);
    } else {
      toast.error('No records found for this period');
    }
  };

  const generateAll = () => {
    let count = 0;
    preview.forEach(p => {
      if (!p.alreadyInvoiced && p.records.length > 0) {
        const inv = generateInvoice(p.farmer.id, start, end);
        if (inv) { count++; setGenerated(g => [...g, p.farmer.id]); }
      }
    });
    if (count > 0) toast.success(`Generated ${count} invoices!`);
    else toast.error('No new invoices to generate');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Billing Engine</h2>
        <button onClick={generateAll}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2">
          <Receipt size={15} /> Generate All Invoices
        </button>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
            {BS_MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}. {m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fortnight</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button onClick={() => setHalf(1)} className={`px-4 py-2 ${half === 1 ? 'bg-green-600 text-white' : 'text-gray-600'}`}>1–15</button>
            <button onClick={() => setHalf(2)} className={`px-4 py-2 ${half === 2 ? 'bg-green-600 text-white' : 'text-gray-600'}`}>16–End</button>
          </div>
        </div>
        <div className="flex-1 bg-green-50 rounded-lg px-4 py-2 text-sm text-green-800">
          <span className="font-medium">Period:</span> {start} to {end} BS
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collection', value: `${totalQty.toFixed(1)} L`, color: 'text-blue-700' },
          { label: 'Gross Amount', value: fmtRs(totalGross), color: 'text-gray-800' },
          { label: 'Net Payable', value: fmtRs(totalNet), color: 'text-green-700' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Billing Preview — {BS_MONTHS[month - 1]} {today.year}</h3>
          <p className="text-xs text-gray-400 mt-1">{preview.filter(p => p.records.length > 0).length} farmers with records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-3">Farmer</th>
                <th className="text-center p-3">Days</th>
                <th className="text-center p-3">Total Qty</th>
                <th className="text-right p-3">Gross Amt</th>
                <th className="text-right p-3">Advance</th>
                <th className="text-right p-3">Net Payable</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {preview.map(p => (
                <tr key={p.farmer.id} className={`hover:bg-gray-50 ${p.records.length === 0 ? 'opacity-40' : ''}`}>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{p.farmer.name}</div>
                    <div className="text-xs text-gray-400">{p.farmer.id}</div>
                  </td>
                  <td className="p-3 text-center text-gray-600">{p.records.length}</td>
                  <td className="p-3 text-center text-gray-700">{p.totalQty.toFixed(1)} L</td>
                  <td className="p-3 text-right text-gray-800">{fmtRs(p.grossAmount)}</td>
                  <td className="p-3 text-right text-orange-600">
                    {p.advDeduction > 0 ? `- ${fmtRs(p.advDeduction)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-bold text-green-700">{fmtRs(p.netPayable)}</td>
                  <td className="p-3 text-center">
                    {p.alreadyInvoiced ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle size={13} /> Done
                      </span>
                    ) : (
                      <button onClick={() => generateOne(p.farmer.id)}
                        disabled={p.records.length === 0}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mx-auto">
                        <ChevronRight size={12} /> Generate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
