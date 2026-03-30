import { useState, useRef } from 'react';
import { useStore, Invoice } from '../store/store';
import { Printer, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function InvoicePrint({ inv, farmerName, farmerPhone, farmerAddress, dairyName, dairyAddress, dairyPhone, dairyReg }: {
  inv: Invoice; farmerName: string; farmerPhone: string; farmerAddress: string;
  dairyName: string; dairyAddress: string; dairyPhone: string; dairyReg: string;
}) {
  const totMqty = inv.records.reduce((s, r) => s + r.morningQty, 0);
  const totEqty = inv.records.reduce((s, r) => s + r.eveningQty, 0);
  return (
    <div className="invoice-wrap font-mono text-xs p-4 max-w-[148mm] mx-auto bg-white" style={{ fontSize: '10px', lineHeight: '1.4' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <div className="text-sm font-bold uppercase">{dairyName}</div>
        <div>{dairyAddress}</div>
        <div>📞 {dairyPhone} | Reg: {dairyReg}</div>
      </div>
      {/* Invoice info */}
      <div className="border-b border-gray-400 pb-1 mb-2 text-[9px]">
        <div className="flex justify-between">
          <span><b>Invoice:</b> {inv.invoiceNumber}</span>
          <span><b>Date:</b> {inv.createdAt}</span>
        </div>
        <div><b>Period:</b> {inv.periodStart} — {inv.periodEnd} BS</div>
      </div>
      {/* Farmer */}
      <div className="border-b border-gray-400 pb-1 mb-2 text-[9px]">
        <div className="flex justify-between">
          <span><b>Farmer:</b> {farmerName}</span>
          <span><b>ID:</b> {inv.farmerId}</span>
        </div>
        <div className="flex justify-between">
          <span><b>Phone:</b> {farmerPhone}</span>
          <span><b>Addr:</b> {farmerAddress}</span>
        </div>
      </div>
      {/* Ledger */}
      <table className="w-full text-[9px] border-collapse mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-0.5">Date</th>
            <th className="text-center">QtyM</th>
            <th className="text-center">QtyE</th>
            <th className="text-center">FatM</th>
            <th className="text-center">FatE</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.records.map(r => (
            <tr key={r.id} className="border-b border-gray-200">
              <td className="py-0.5">{r.dateBS.slice(5)}</td>
              <td className="text-center">{r.morningQty}</td>
              <td className="text-center">{r.eveningQty}</td>
              <td className="text-center">{r.morningFat}</td>
              <td className="text-center">{r.eveningFat}</td>
              <td className="text-right">{r.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td className="py-0.5">TOTAL</td>
            <td className="text-center">{totMqty.toFixed(1)}</td>
            <td className="text-center">{totEqty.toFixed(1)}</td>
            <td colSpan={2} />
            <td className="text-right">{inv.grossAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      {/* Settlement */}
      <div className="border-t-2 border-black pt-1">
        <div className="flex justify-between"><span>Total Milk:</span><span>{inv.totalQty.toFixed(1)} L ({inv.totalDays} days)</span></div>
        <div className="flex justify-between"><span>Gross Amount:</span><span>{fmtRs(inv.grossAmount)}</span></div>
        <div className="flex justify-between text-red-600"><span>Advance Deduction:</span><span>- {fmtRs(inv.advanceDeduction)}</span></div>
        <div className="flex justify-between font-bold text-sm border-t border-black mt-1 pt-1">
          <span>NET PAYABLE:</span><span>{fmtRs(inv.netPayable)}</span>
        </div>
      </div>
      {/* Status & Signatures */}
      <div className="mt-3 border-t border-gray-400 pt-2 text-[9px]">
        <div className="flex justify-between mb-4">
          <span>Status: <b>{inv.status.toUpperCase()}</b></span>
          {inv.paymentDate && <span>Paid: {inv.paymentDate}</span>}
        </div>
        <div className="flex justify-between mt-6">
          <div className="border-t border-black w-24 text-center pt-0.5">Authorized By</div>
          <div className="border-t border-black w-24 text-center pt-0.5">Farmer Sign</div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const { invoices, farmers, markInvoicePaid, cancelInvoice, profile } = useStore();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'bank' | 'upi'>('cash');
  const [filter, setFilter] = useState<'all' | 'generated' | 'paid' | 'cancelled'>('all');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const filtered = invoices.filter(i => filter === 'all' || i.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const getFarmer = (id: string) => farmers.find(f => f.id === id);

  const handlePay = (id: string) => {
    markInvoicePaid(id, payMethod);
    toast.success('Invoice marked as paid!');
    setSelected(null);
  };

  const statusBadge = (s: string) => ({
    generated: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
  }[s] || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(['all', 'generated', 'paid', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 capitalize ${filter === f ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No invoices found. Generate them from Billing.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left p-3">Invoice #</th>
                  <th className="text-left p-3">Farmer</th>
                  <th className="text-left p-3">Period</th>
                  <th className="text-right p-3">Gross</th>
                  <th className="text-right p-3">Advance</th>
                  <th className="text-right p-3">Net Payable</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => {
                  const farmer = getFarmer(inv.farmerId);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-green-700">{inv.invoiceNumber}</td>
                      <td className="p-3">
                        <div className="font-medium">{farmer?.name}</div>
                        <div className="text-xs text-gray-400">{inv.farmerId}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{inv.periodStart.slice(5)} — {inv.periodEnd.slice(5)}</td>
                      <td className="p-3 text-right text-gray-700">{fmtRs(inv.grossAmount)}</td>
                      <td className="p-3 text-right text-orange-600">
                        {inv.advanceDeduction > 0 ? `- ${fmtRs(inv.advanceDeduction)}` : '—'}
                      </td>
                      <td className="p-3 text-right font-bold text-green-700">{fmtRs(inv.netPayable)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(inv.status)}`}>{inv.status}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelected(inv)} className="text-blue-500 hover:text-blue-700 p-1" title="View/Print">
                            <Eye size={15} />
                          </button>
                          {inv.status === 'generated' && (
                            <>
                              <button onClick={() => { setSelected(inv); }} className="text-green-500 hover:text-green-700 p-1" title="Mark Paid">
                                <CheckCircle size={15} />
                              </button>
                              <button onClick={() => { cancelInvoice(inv.id); toast.success('Invoice cancelled'); }}
                                className="text-red-400 hover:text-red-600 p-1" title="Cancel">
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal / Print View */}
      {selected && (() => {
        const farmer = getFarmer(selected.farmerId);
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 no-print">
                <h3 className="font-bold text-gray-900">{selected.invoiceNumber}</h3>
                <div className="flex gap-2">
                  {selected.status === 'generated' && (
                    <div className="flex items-center gap-2">
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value as 'cash' | 'bank' | 'upi')}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="upi">UPI</option>
                      </select>
                      <button onClick={() => handlePay(selected.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">
                        Mark Paid
                      </button>
                    </div>
                  )}
                  <button onClick={() => handlePrint()}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-blue-700">
                    <Printer size={13} /> Print
                  </button>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 px-2 text-xl">×</button>
                </div>
              </div>
              <div ref={printRef}>
                <InvoicePrint
                  inv={selected}
                  farmerName={farmer?.name || ''}
                  farmerPhone={farmer?.phone || ''}
                  farmerAddress={farmer?.address || ''}
                  dairyName={profile.dairyName}
                  dairyAddress={profile.address}
                  dairyPhone={profile.phone}
                  dairyReg={profile.registrationNumber}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
