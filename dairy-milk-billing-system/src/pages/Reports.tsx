import { useState } from 'react';
import { useStore } from '../store/store';
import { getTodayBS, formatBSDate, BS_MONTHS } from '../utils/nepaliDate';
import { FileText, Download } from 'lucide-react';

const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

type ReportType = 'daily' | 'farmer' | 'billing-summary' | 'advance';

export default function Reports() {
  const { farmers, milkRecords, invoices, advances } = useStore();
  const today = getTodayBS();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(formatBSDate(today));
  const [selectedFarmer, setSelectedFarmer] = useState(farmers[0]?.id || '');
  const [month, setMonth] = useState(today.month);

  // ── Daily Report ──────────────────────────────────────────────────────────
  const dailyRecords = milkRecords
    .filter(r => r.dateBS === selectedDate)
    .sort((a, b) => a.farmerId.localeCompare(b.farmerId));

  const dailyTotals = {
    qty: dailyRecords.reduce((s, r) => s + r.morningQty + r.eveningQty, 0),
    amt: dailyRecords.reduce((s, r) => s + r.totalAmount, 0),
    farmers: dailyRecords.length,
  };

  // ── Farmer Report ─────────────────────────────────────────────────────────
  const farmerRecords = milkRecords
    .filter(r => r.farmerId === selectedFarmer)
    .sort((a, b) => a.dateBS.localeCompare(b.dateBS));

  const farmerTotals = {
    qty: farmerRecords.reduce((s, r) => s + r.morningQty + r.eveningQty, 0),
    amt: farmerRecords.reduce((s, r) => s + r.totalAmount, 0),
    days: farmerRecords.length,
  };

  // ── Billing Summary ───────────────────────────────────────────────────────
  const monthStr = String(month).padStart(2, '0');
  const monthInvoices = invoices.filter(i => i.periodStart.includes(`/${monthStr}/`));

  // ── Advance Report ────────────────────────────────────────────────────────
  const advanceSummary = farmers.map(f => ({
    ...f,
    total: advances.filter(a => a.farmerId === f.id).reduce((s, a) => s + a.amount, 0),
    outstanding: advances.filter(a => a.farmerId === f.id).reduce((s, a) => s + a.remainingBalance, 0),
  })).filter(f => f.total > 0);

  const exportCSV = (data: Record<string, string | number>[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  const getFarmerName = (id: string) => farmers.find(f => f.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Reports & Export</h2>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1 flex-wrap">
        {([
          { key: 'daily', label: '📅 Daily Report' },
          { key: 'farmer', label: '👨‍🌾 Farmer Report' },
          { key: 'billing-summary', label: '📋 Billing Summary' },
          { key: 'advance', label: '💳 Advance Report' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setReportType(key)}
            className={`flex-1 min-w-[120px] py-2 rounded-lg text-sm font-medium transition-colors ${reportType === key ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap items-end">
        {reportType === 'daily' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date (BS)</label>
            <input type="text" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              placeholder="YYYY/MM/DD"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        )}
        {reportType === 'farmer' && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Farmer</label>
            <select value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {farmers.map(f => <option key={f.id} value={f.id}>{f.id} — {f.name}</option>)}
            </select>
          </div>
        )}
        {reportType === 'billing-summary' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {BS_MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{i + 1}. {m}</option>)}
            </select>
          </div>
        )}
        <button onClick={() => {
          if (reportType === 'daily') {
            exportCSV(dailyRecords.map(r => ({
              Date: r.dateBS, Farmer: getFarmerName(r.farmerId), ID: r.farmerId,
              MorningQty: r.morningQty, MorningFat: r.morningFat,
              EveningQty: r.eveningQty, EveningFat: r.eveningFat,
              Rate: r.rateUsed, Amount: r.totalAmount
            })), `daily-report-${selectedDate}.csv`);
          } else if (reportType === 'farmer') {
            exportCSV(farmerRecords.map(r => ({
              Date: r.dateBS, MorningQty: r.morningQty, MorningFat: r.morningFat,
              EveningQty: r.eveningQty, EveningFat: r.eveningFat,
              Rate: r.rateUsed, Amount: r.totalAmount
            })), `farmer-${selectedFarmer}-report.csv`);
          } else if (reportType === 'billing-summary') {
            exportCSV(monthInvoices.map(i => ({
              Invoice: i.invoiceNumber, Farmer: getFarmerName(i.farmerId),
              Period: `${i.periodStart} - ${i.periodEnd}`,
              TotalQty: i.totalQty, GrossAmount: i.grossAmount,
              Advance: i.advanceDeduction, NetPayable: i.netPayable, Status: i.status
            })), `billing-${month}-summary.csv`);
          } else {
            exportCSV(advanceSummary.map(f => ({
              ID: f.id, Name: f.name, TotalAdvance: f.total, Outstanding: f.outstanding
            })), 'advance-report.csv');
          }
        }}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2 ml-auto">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {reportType === 'daily' && (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Daily Collection Report — {selectedDate}</h3>
                <p className="text-xs text-gray-400">{dailyRecords.length} farmers · {dailyTotals.qty.toFixed(1)} L · {fmtRs(dailyTotals.amt)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left p-3">Farmer</th>
                    <th className="text-center p-3">Qty M</th>
                    <th className="text-center p-3">Qty E</th>
                    <th className="text-center p-3">Fat M</th>
                    <th className="text-center p-3">Fat E</th>
                    <th className="text-center p-3">Rate</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dailyRecords.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No records for {selectedDate}</td></tr>
                  ) : dailyRecords.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{getFarmerName(r.farmerId)}</div>
                        <div className="text-xs text-gray-400">{r.farmerId}</div>
                      </td>
                      <td className="p-3 text-center text-yellow-700">{r.morningQty}</td>
                      <td className="p-3 text-center text-blue-700">{r.eveningQty}</td>
                      <td className="p-3 text-center">{r.morningFat}%</td>
                      <td className="p-3 text-center">{r.eveningFat}%</td>
                      <td className="p-3 text-center text-gray-500">{r.rateUsed}</td>
                      <td className="p-3 text-right font-semibold text-green-700">{fmtRs(r.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                {dailyRecords.length > 0 && (
                  <tfoot className="bg-green-50 font-bold">
                    <tr>
                      <td className="p-3 text-green-800">TOTALS</td>
                      <td className="p-3 text-center text-yellow-700">{dailyRecords.reduce((s, r) => s + r.morningQty, 0).toFixed(1)}</td>
                      <td className="p-3 text-center text-blue-700">{dailyRecords.reduce((s, r) => s + r.eveningQty, 0).toFixed(1)}</td>
                      <td colSpan={3} />
                      <td className="p-3 text-right text-green-700">{fmtRs(dailyTotals.amt)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {reportType === 'farmer' && (
          <>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{getFarmerName(selectedFarmer)} — All Records</h3>
              <p className="text-xs text-gray-400">{farmerTotals.days} days · {farmerTotals.qty.toFixed(1)} L · {fmtRs(farmerTotals.amt)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Qty M</th>
                    <th className="text-center p-3">Qty E</th>
                    <th className="text-center p-3">Fat M</th>
                    <th className="text-center p-3">Fat E</th>
                    <th className="text-center p-3">Rate</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {farmerRecords.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No records for this farmer</td></tr>
                  ) : farmerRecords.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{r.dateBS}</td>
                      <td className="p-3 text-center text-yellow-700">{r.morningQty}</td>
                      <td className="p-3 text-center text-blue-700">{r.eveningQty}</td>
                      <td className="p-3 text-center">{r.morningFat}%</td>
                      <td className="p-3 text-center">{r.eveningFat}%</td>
                      <td className="p-3 text-center text-gray-500">{r.rateUsed}</td>
                      <td className="p-3 text-right font-semibold text-green-700">{fmtRs(r.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'billing-summary' && (
          <>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Billing Summary — {BS_MONTHS[month - 1]}</h3>
              <p className="text-xs text-gray-400">{monthInvoices.length} invoices · {fmtRs(monthInvoices.reduce((s, i) => s + i.netPayable, 0))} net payable</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left p-3">Invoice</th>
                    <th className="text-left p-3">Farmer</th>
                    <th className="text-center p-3">Period</th>
                    <th className="text-right p-3">Gross</th>
                    <th className="text-right p-3">Advance</th>
                    <th className="text-right p-3">Net Payable</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthInvoices.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No invoices for this month</td></tr>
                  ) : monthInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-green-700">{inv.invoiceNumber}</td>
                      <td className="p-3 font-medium">{getFarmerName(inv.farmerId)}</td>
                      <td className="p-3 text-center text-xs text-gray-500">{inv.periodStart.slice(5)} — {inv.periodEnd.slice(5)}</td>
                      <td className="p-3 text-right">{fmtRs(inv.grossAmount)}</td>
                      <td className="p-3 text-right text-orange-600">{inv.advanceDeduction > 0 ? `- ${fmtRs(inv.advanceDeduction)}` : '—'}</td>
                      <td className="p-3 text-right font-bold text-green-700">{fmtRs(inv.netPayable)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'cancelled' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'advance' && (
          <>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Outstanding Advance Report</h3>
              <p className="text-xs text-gray-400">{advanceSummary.filter(f => f.outstanding > 0).length} farmers with outstanding advances</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left p-3">Farmer</th>
                    <th className="text-right p-3">Total Given</th>
                    <th className="text-right p-3">Outstanding</th>
                    <th className="text-right p-3">Recovered</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {advanceSummary.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No advance records</td></tr>
                  ) : advanceSummary.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-gray-400">{f.id}</div>
                      </td>
                      <td className="p-3 text-right text-gray-700">{fmtRs(f.total)}</td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${f.outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>{fmtRs(f.outstanding)}</span>
                      </td>
                      <td className="p-3 text-right text-green-600">{fmtRs(f.total - f.outstanding)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.outstanding <= 0 ? 'bg-green-100 text-green-700' : f.outstanding < f.total ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                          {f.outstanding <= 0 ? 'Cleared' : f.outstanding < f.total ? 'Partial' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
