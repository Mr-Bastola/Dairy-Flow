import { useStore } from '../store/store';
import { getTodayBS, formatBSDate, BS_MONTHS } from '../utils/nepaliDate';
import { Milk, Users, TrendingUp, FileText, AlertTriangle, Sun, Sunset } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { milkRecords, farmers, invoices, advances, currentRate } = useStore();
  const today = getTodayBS();
  const todayStr = formatBSDate(today);
  const navigate = useNavigate();

  // Today's stats
  const todayRecords = milkRecords.filter(r => r.dateBS === todayStr);
  const todayLiters = todayRecords.reduce((s, r) => s + r.morningQty + r.eveningQty, 0);
  const todayRevenue = todayRecords.reduce((s, r) => s + r.totalAmount, 0);
  const activeFarmers = farmers.filter(f => f.status === 'active').length;
  const pendingInvoices = invoices.filter(i => i.status === 'generated').length;

  // Last 7 days trend
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const bs = formatBSDate({ year: today.year, month: today.month, day: today.day - (6 - i) });
    const recs = milkRecords.filter(r => r.dateBS === bs);
    return {
      day: `${today.month}/${today.day - (6 - i)}`,
      Morning: parseFloat(recs.reduce((s, r) => s + r.morningQty, 0).toFixed(1)),
      Evening: parseFloat(recs.reduce((s, r) => s + r.eveningQty, 0).toFixed(1)),
      Revenue: parseFloat(recs.reduce((s, r) => s + r.totalAmount, 0).toFixed(0)),
    };
  });

  // Farmer leaderboard (by total liters)
  const leaderboard = farmers
    .filter(f => f.status === 'active')
    .map(f => {
      const recs = milkRecords.filter(r => r.farmerId === f.id);
      const totalQty = recs.reduce((s, r) => s + r.morningQty + r.eveningQty, 0);
      const totalAmt = recs.reduce((s, r) => s + r.totalAmount, 0);
      return { ...f, totalQty: parseFloat(totalQty.toFixed(1)), totalAmt: parseFloat(totalAmt.toFixed(2)) };
    })
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);

  // Pending advance alerts
  const highAdvances = farmers
    .map(f => ({
      ...f,
      outstanding: advances.filter(a => a.farmerId === f.id).reduce((s, a) => s + a.remainingBalance, 0),
    }))
    .filter(f => f.outstanding > 3000);

  const cards = [
    { label: "Today's Liters", value: `${todayLiters.toFixed(1)} L`, icon: Milk, color: 'bg-blue-500', sub: `${todayRecords.length} entries` },
    { label: "Today's Revenue", value: fmt(todayRevenue), icon: TrendingUp, color: 'bg-green-500', sub: `Rate: Rs.${currentRate}` },
    { label: 'Active Farmers', value: activeFarmers, icon: Users, color: 'bg-purple-500', sub: `${farmers.length} total` },
    { label: 'Pending Bills', value: pendingInvoices, icon: FileText, color: 'bg-orange-500', sub: 'unpaid invoices' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">{today.day} {BS_MONTHS[today.month - 1]} {today.year} BS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/entry')}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2">
            <Milk size={15} /> New Entry
          </button>
          <button onClick={() => navigate('/billing')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <FileText size={15} /> Generate Bills
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2 rounded-lg ${c.color} mb-3`}>
              <c.icon className="text-white" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            <div className="text-xs text-gray-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" /> Morning vs Evening (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v} L`} />
              <Legend />
              <Bar dataKey="Morning" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Evening" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" /> Revenue Trend (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `Rs.${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">🏆 Top Farmers by Collection</h3>
          <div className="space-y-2">
            {leaderboard.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
            {leaderboard.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-700">{f.totalQty} L</div>
                  <div className="text-xs text-gray-400">{fmt(f.totalAmt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> High Advance Alerts
          </h3>
          {highAdvances.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">✅ No high outstanding advances</div>
          ) : (
            <div className="space-y-2">
              {highAdvances.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.id}</div>
                  </div>
                  <div className="text-sm font-bold text-orange-600">{fmt(f.outstanding)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
