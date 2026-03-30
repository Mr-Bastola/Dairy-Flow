import { useStore } from '../store/store';
import { Calendar, Archive, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FiscalYears() {
  const { fiscalYears, currentFiscalYear, closeCurrentYear, switchYear, milkRecords, invoices, farmers } = useStore();

  const getYearStats = (yearBS: string) => {
    const recs = milkRecords.filter(r => r.dateBS.startsWith(yearBS));
    const invs = invoices.filter(i => i.periodStart.startsWith(yearBS));
    const totalAmt = recs.reduce((s, r) => s + r.totalAmount, 0);
    return { records: recs.length, invoices: invs.length, totalAmt };
  };

  const handleCloseYear = () => {
    if (confirm('Close current fiscal year and start a new one? Archived data will be preserved and read-only.')) {
      closeCurrentYear();
      toast.success('Fiscal year closed! New year started.');
    }
  };

  const activeYear = fiscalYears.find(y => y.isCurrent);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Fiscal Year Management</h2>

      {/* Active Year Banner */}
      {activeYear && (
        <div className="bg-green-700 text-white rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={18} />
                <span className="text-sm opacity-80">Currently Active</span>
              </div>
              <div className="text-3xl font-bold">{activeYear.yearBS} BS</div>
              <div className="text-sm opacity-70 mt-1">{activeYear.label}</div>
              <div className="text-xs opacity-60 mt-1">Baisakh 1 — Chaitra End</div>
            </div>
            <div className="text-right">
              <button onClick={handleCloseYear}
                className="bg-white text-green-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors flex items-center gap-2">
                <Archive size={15} /> Close Year
              </button>
              <p className="text-xs opacity-60 mt-2">Archives & starts next year</p>
            </div>
          </div>

          {/* Active Year Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-600">
            {(() => {
              const stats = getYearStats(activeYear.yearBS);
              return [
                { label: 'Records', value: stats.records },
                { label: 'Invoices', value: stats.invoices },
                { label: 'Revenue', value: `Rs. ${stats.totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs opacity-70">{s.label}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Year Selector Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        💡 Use the <b>Year Selector</b> in the top header bar to switch between active and archived fiscal years. Archived year data is read-only but fully viewable.
      </div>

      {/* All Years */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Fiscal Years</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[...fiscalYears].reverse().map(fy => {
            const stats = getYearStats(fy.yearBS);
            return (
              <div key={fy.id} className={`p-4 flex items-center justify-between ${fy.yearBS === currentFiscalYear ? 'bg-green-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {fy.status === 'active' ? <CheckCircle size={20} /> : <Archive size={20} />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{fy.label}</div>
                    <div className="text-xs text-gray-500">
                      {stats.records} records · {stats.invoices} invoices · Rs. {stats.totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    {fy.archivedAt && <div className="text-xs text-gray-400">Archived: {fy.archivedAt}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {fy.status}
                  </span>
                  {fy.yearBS !== currentFiscalYear && (
                    <button onClick={() => switchYear(fy.yearBS)}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      View
                    </button>
                  )}
                  {fy.yearBS === currentFiscalYear && (
                    <span className="text-xs text-green-600 font-medium">Viewing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carry-Forward Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">📋 Year-End Carry-Forward</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span><b>Active Farmers</b> — all farmer profiles carry to the new year</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span><b>Pending Advance Balances</b> — outstanding advances carry forward</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span><b>Current Rate</b> — base rate configuration continues</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold mt-0.5">✗</span>
            <span><b>Milk Records & Invoices</b> — stay in the archived year (clean start)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
