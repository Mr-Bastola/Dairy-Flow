import { useState, useRef } from 'react';
import { useStore } from '../store/store';
import { getTodayBS, formatBSDate, getFortnightRange, BS_MONTHS } from '../utils/nepaliDate';
import { Printer, Search } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const fmtRs = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function Ledger() {
  const { farmers, milkRecords } = useStore();
  const today = getTodayBS();

  const [selectedFarmer, setSelectedFarmer] = useState(farmers[0]?.id || '');
  const [month, setMonth] = useState(today.month);
  const [half, setHalf] = useState<1 | 2>(today.day <= 15 ? 1 : 2);
  const printRef = useRef<HTMLDivElement>(null);

  const { start, end } = getFortnightRange(today.year, month, half);

  const farmer = farmers.find(f => f.id === selectedFarmer);
  const records = milkRecords
    .filter(r => r.farmerId === selectedFarmer && r.dateBS >= start && r.dateBS <= end)
    .sort((a, b) => a.dateBS.localeCompare(b.dateBS));

  const totals = {
    mqty: records.reduce((s, r) => s + r.morningQty, 0),
    eqty: records.reduce((s, r) => s + r.eveningQty, 0),
    mfat: records.length ? records.reduce((s, r) => s + r.morningFat, 0) / records.length : 0,
    efat: records.length ? records.reduce((s, r) => s + r.eveningFat, 0) / records.length : 0,
    amt: records.reduce((s, r) => s + r.totalAmount, 0),
  };

  const handlePrint = useReactToPrint({ contentRef: printRef });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Farmer Ledger</h2>
        <button onClick={() => handlePrint()}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2 no-print">
          <Printer size={15} /> Print
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap no-print">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Farmer</label>
          <select value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.id} — {f.name}</option>
            ))}
          </select>
        </div>
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
            <button onClick={() => setHalf(1)} className={`px-4 py-2 ${half === 1 ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>1–15</button>
            <button onClick={() => setHalf(2)} className={`px-4 py-2 ${half === 2 ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>16–End</button>
          </div>
        </div>
      </div>

      {/* Printable Ledger */}
      <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{farmer?.name} ({farmer?.id})</h3>
          <p className="text-sm text-gray-500">Period: {start} — {end} BS</p>
          <p className="text-xs text-gray-400">{BS_MONTHS[month - 1]} {today.year} · {half === 1 ? '1st Fortnight (1–15)' : '2nd Fortnight (16–End)'}</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-3">Date (BS)</th>
                <th className="text-center p-3">Qty M (L)</th>
                <th className="text-center p-3">Qty E (L)</th>
                <th className="text-center p-3">Fat% M</th>
                <th className="text-center p-3">Fat% E</th>
                <th className="text-center p-3">Rate</th>
                <th className="text-right p-3">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No records for this period</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-700">{r.dateBS.slice(5)}</td>
                  <td className="p-3 text-center text-yellow-700 font-medium">{r.morningQty.toFixed(1)}</td>
                  <td className="p-3 text-center text-blue-700 font-medium">{r.eveningQty.toFixed(1)}</td>
                  <td className="p-3 text-center text-gray-600">{r.morningFat.toFixed(1)}</td>
                  <td className="p-3 text-center text-gray-600">{r.eveningFat.toFixed(1)}</td>
                  <td className="p-3 text-center text-gray-500">{r.rateUsed.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold text-gray-800">{fmtRs(r.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-green-50 font-bold text-sm border-t-2 border-green-200">
              <tr>
                <td className="p-3 text-green-800">TOTALS ({records.length} days)</td>
                <td className="p-3 text-center text-yellow-700">{totals.mqty.toFixed(1)}</td>
                <td className="p-3 text-center text-blue-700">{totals.eqty.toFixed(1)}</td>
                <td className="p-3 text-center text-gray-500">Avg {totals.mfat.toFixed(1)}</td>
                <td className="p-3 text-center text-gray-500">Avg {totals.efat.toFixed(1)}</td>
                <td className="p-3 text-center">—</td>
                <td className="p-3 text-right text-green-800 text-base">{fmtRs(totals.amt)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary */}
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{(totals.mqty + totals.eqty).toFixed(1)}</div>
              <div className="text-xs text-gray-500">Total Liters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{records.length}</div>
              <div className="text-xs text-gray-500">Days Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">Rs. {fmtRs(totals.amt)}</div>
              <div className="text-xs text-gray-500">Gross Amount</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
