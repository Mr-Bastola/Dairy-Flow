/**
 * DairyFlow Pro — Unified Zustand Store
 * All app state: farmers, milk records, advances, invoices, settings
 * Uses persist middleware so data survives page refresh
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatBSDate, getTodayBS } from '../utils/nepaliDate';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface DairyProfile {
  dairyName: string;
  address: string;
  phone: string;
  registrationNumber: string;
  logoUrl: string;
}

export interface RateHistory {
  id: string;
  rate: number;
  effectiveFrom: string; // BS date string
  setBy: string;
  createdAt: string;
}

export interface Farmer {
  id: string;           // e.g. "F-001"
  name: string;
  phone: string;
  address: string;
  joiningDateBS: string;
  status: 'active' | 'inactive';
}

export interface MilkRecord {
  id: string;
  farmerId: string;
  dateBS: string;       // "YYYY/MM/DD"
  morningQty: number;
  morningFat: number;
  eveningQty: number;
  eveningFat: number;
  rateUsed: number;     // snapshot of rate at time of entry
  morningAmount: number;
  eveningAmount: number;
  totalAmount: number;
  enteredBy: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  farmerId: string;
  amount: number;
  remainingBalance: number;
  dateBS: string;
  reason: string;
  recordedBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  farmerId: string;
  periodStart: string;  // BS date string
  periodEnd: string;
  totalDays: number;
  totalQtyMorning: number;
  totalQtyEvening: number;
  totalQty: number;
  grossAmount: number;
  advanceDeduction: number;
  netPayable: number;
  status: 'generated' | 'paid' | 'cancelled';
  paymentDate?: string;
  paymentMethod?: 'cash' | 'bank' | 'upi';
  generatedBy: string;
  createdAt: string;
  records: MilkRecord[];  // snapshot of records for this period
}

export interface FiscalYear {
  id: string;
  yearBS: string;       // e.g. "2082"
  label: string;        // e.g. "2082 Nagarkot Dairy"
  status: 'active' | 'archived';
  archivedAt?: string;
  isCurrent: boolean;
}

// ─── Store Interface ───────────────────────────────────────────────────────────

interface DairyStore {
  // Auth
  currentUser: AppUser | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Profile
  profile: DairyProfile;
  updateProfile: (p: Partial<DairyProfile>) => void;

  // Rate
  currentRate: number;
  rateHistory: RateHistory[];
  setRate: (rate: number, effectiveFrom: string) => void;

  // Fiscal Years
  fiscalYears: FiscalYear[];
  currentFiscalYear: string;
  addFiscalYear: (year: FiscalYear) => void;
  closeCurrentYear: () => void;
  switchYear: (yearBS: string) => void;

  // Farmers
  farmers: Farmer[];
  addFarmer: (f: Omit<Farmer, 'id'>) => void;
  updateFarmer: (id: string, f: Partial<Farmer>) => void;
  toggleFarmerStatus: (id: string) => void;

  // Milk Records
  milkRecords: MilkRecord[];
  addMilkRecord: (data: {
    farmerId: string;
    dateBS: string;
    morningQty: number;
    morningFat: number;
    eveningQty: number;
    eveningFat: number;
  }) => { success: boolean; message: string };
  updateMilkRecord: (id: string, data: Partial<MilkRecord>) => void;
  deleteMilkRecord: (id: string) => void;

  // Advances
  advances: Advance[];
  addAdvance: (data: {
    farmerId: string;
    amount: number;
    dateBS: string;
    reason: string;
  }) => void;
  deductAdvance: (farmerId: string, amount: number, invoiceId: string) => number;

  // Invoices
  invoices: Invoice[];
  generateInvoice: (farmerId: string, periodStart: string, periodEnd: string) => Invoice | null;
  markInvoicePaid: (id: string, method: 'cash' | 'bank' | 'upi') => void;
  cancelInvoice: (id: string) => void;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_USERS: AppUser[] = [
  { id: 'U-001', name: 'Admin User', role: 'admin', username: 'admin' },
  { id: 'U-002', name: 'Operator Ram', role: 'operator', username: 'operator' },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  operator: 'op123',
};

const todayStr = formatBSDate(getTodayBS());
const currentYearBS = String(getTodayBS().year);

const SEED_FARMERS: Farmer[] = [
  { id: 'F-001', name: 'Ram Bahadur Thapa', phone: '9841001001', address: 'Ward 3, Kavre', joiningDateBS: '2081/01/01', status: 'active' },
  { id: 'F-002', name: 'Sita Kumari Rai', phone: '9841002002', address: 'Ward 5, Bhaktapur', joiningDateBS: '2081/02/15', status: 'active' },
  { id: 'F-003', name: 'Hari Prasad Sharma', phone: '9841003003', address: 'Ward 1, Lalitpur', joiningDateBS: '2081/03/10', status: 'active' },
  { id: 'F-004', name: 'Maya Devi Gurung', phone: '9841004004', address: 'Ward 7, Sindhupalchok', joiningDateBS: '2081/04/01', status: 'active' },
  { id: 'F-005', name: 'Bishnu Kumar Tamang', phone: '9841005005', address: 'Ward 2, Dolakha', joiningDateBS: '2081/05/20', status: 'active' },
];

// Generate sample milk records for demonstration
function generateSeedRecords(): MilkRecord[] {
  const records: MilkRecord[] = [];
  const rate = 18;
  const today = getTodayBS();
  
  // Generate for last 15 days for each farmer
  for (let d = 1; d <= 15; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(today.month).padStart(2, '0');
    const dateBS = `${today.year}/${monthStr}/${dayStr}`;
    
    SEED_FARMERS.forEach((f, fi) => {
      const mQty = parseFloat((5 + Math.random() * 10).toFixed(1));
      const mFat = parseFloat((3.5 + Math.random() * 2).toFixed(1));
      const eQty = parseFloat((4 + Math.random() * 8).toFixed(1));
      const eFat = parseFloat((3.2 + Math.random() * 2).toFixed(1));
      const mAmt = parseFloat((mQty * mFat * rate).toFixed(2));
      const eAmt = parseFloat((eQty * eFat * rate).toFixed(2));
      records.push({
        id: `MR-${today.year}${today.month}${d}-${fi + 1}`,
        farmerId: f.id,
        dateBS,
        morningQty: mQty,
        morningFat: mFat,
        eveningQty: eQty,
        eveningFat: eFat,
        rateUsed: rate,
        morningAmount: mAmt,
        eveningAmount: eAmt,
        totalAmount: parseFloat((mAmt + eAmt).toFixed(2)),
        enteredBy: 'U-002',
        createdAt: dateBS,
      });
    });
  }
  return records;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<DairyStore>()(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      currentUser: null,
      isLoggedIn: false,

      login: (username, password) => {
        if (DEFAULT_PASSWORDS[username] === password) {
          const user = DEFAULT_USERS.find(u => u.username === username);
          if (user) {
            set({ currentUser: user, isLoggedIn: true });
            return true;
          }
        }
        return false;
      },

      logout: () => set({ currentUser: null, isLoggedIn: false }),

      // ── Profile ────────────────────────────────────────────────────────────
      profile: {
        dairyName: 'Nagarkot Dairy Cooperative',
        address: 'Ward 5, Nagarkot, Bhaktapur',
        phone: '9841000000',
        registrationNumber: 'DC-2081-045',
        logoUrl: '',
      },
      updateProfile: (p) => set(s => ({ profile: { ...s.profile, ...p } })),

      // ── Rate ───────────────────────────────────────────────────────────────
      currentRate: 18,
      rateHistory: [
        { id: 'R-001', rate: 16, effectiveFrom: '2081/01/01', setBy: 'admin', createdAt: '2081/01/01' },
        { id: 'R-002', rate: 18, effectiveFrom: '2081/07/01', setBy: 'admin', createdAt: '2081/07/01' },
      ],

      setRate: (rate, effectiveFrom) => {
        const id = `R-${Date.now()}`;
        set(s => ({
          currentRate: rate,
          rateHistory: [...s.rateHistory, {
            id, rate, effectiveFrom,
            setBy: s.currentUser?.name || 'admin',
            createdAt: formatBSDate(getTodayBS()),
          }],
        }));
      },

      // ── Fiscal Years ───────────────────────────────────────────────────────
      fiscalYears: [
        {
          id: 'FY-2081',
          yearBS: '2081',
          label: '2081 Nagarkot Dairy',
          status: 'archived',
          archivedAt: '2082/01/01',
          isCurrent: false,
        },
        {
          id: 'FY-2082',
          yearBS: currentYearBS,
          label: `${currentYearBS} Nagarkot Dairy`,
          status: 'active',
          isCurrent: true,
        },
      ],
      currentFiscalYear: currentYearBS,

      addFiscalYear: (fy) => set(s => ({ fiscalYears: [...s.fiscalYears, fy] })),

      closeCurrentYear: () => {
        const s = get();
        const nextYear = String(parseInt(s.currentFiscalYear) + 1);
        const newYear: FiscalYear = {
          id: `FY-${nextYear}`,
          yearBS: nextYear,
          label: `${nextYear} ${s.profile.dairyName}`,
          status: 'active' as const,
          isCurrent: true,
        };
        set(ss => ({
          fiscalYears: [
            ...ss.fiscalYears.map(fy =>
              fy.isCurrent
                ? { ...fy, status: 'archived' as const, archivedAt: todayStr, isCurrent: false }
                : fy
            ),
            newYear,
          ],
          currentFiscalYear: nextYear,
        }));
      },

      switchYear: (yearBS) => set({ currentFiscalYear: yearBS }),

      // ── Farmers ────────────────────────────────────────────────────────────
      farmers: SEED_FARMERS,

      addFarmer: (f) => {
        const existing = get().farmers;
        const nextNum = existing.length + 1;
        const id = `F-${String(nextNum).padStart(3, '0')}`;
        set(s => ({ farmers: [...s.farmers, { ...f, id }] }));
      },

      updateFarmer: (id, f) => {
        set(s => ({ farmers: s.farmers.map(fm => fm.id === id ? { ...fm, ...f } : fm) }));
      },

      toggleFarmerStatus: (id) => {
        set(s => ({
          farmers: s.farmers.map(f =>
            f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
          ),
        }));
      },

      // ── Milk Records ───────────────────────────────────────────────────────
      milkRecords: generateSeedRecords(),

      addMilkRecord: (data) => {
        const s = get();
        // Check for duplicate (same farmer + same date)
        const existing = s.milkRecords.find(
          r => r.farmerId === data.farmerId && r.dateBS === data.dateBS
        );
        if (existing) {
          return { success: false, message: `Record already exists for this farmer on ${data.dateBS}. Please update the existing record.` };
        }

        const rate = s.currentRate;
        const mAmt = parseFloat((data.morningQty * data.morningFat * rate).toFixed(2));
        const eAmt = parseFloat((data.eveningQty * data.eveningFat * rate).toFixed(2));
        const total = parseFloat((mAmt + eAmt).toFixed(2));

        const record: MilkRecord = {
          id: `MR-${Date.now()}`,
          farmerId: data.farmerId,
          dateBS: data.dateBS,
          morningQty: data.morningQty,
          morningFat: data.morningFat,
          eveningQty: data.eveningQty,
          eveningFat: data.eveningFat,
          rateUsed: rate,
          morningAmount: mAmt,
          eveningAmount: eAmt,
          totalAmount: total,
          enteredBy: s.currentUser?.id || 'unknown',
          createdAt: formatBSDate(getTodayBS()),
        };

        set(ss => ({ milkRecords: [record, ...ss.milkRecords] }));
        return { success: true, message: 'Entry saved successfully!' };
      },

      updateMilkRecord: (id, data) => {
        set(s => ({
          milkRecords: s.milkRecords.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, ...data };
            // Recalculate if qty/fat changed
            if (data.morningQty !== undefined || data.morningFat !== undefined ||
                data.eveningQty !== undefined || data.eveningFat !== undefined) {
              updated.morningAmount = parseFloat((updated.morningQty * updated.morningFat * updated.rateUsed).toFixed(2));
              updated.eveningAmount = parseFloat((updated.eveningQty * updated.eveningFat * updated.rateUsed).toFixed(2));
              updated.totalAmount = parseFloat((updated.morningAmount + updated.eveningAmount).toFixed(2));
            }
            return updated;
          }),
        }));
      },

      deleteMilkRecord: (id) => {
        set(s => ({ milkRecords: s.milkRecords.filter(r => r.id !== id) }));
      },

      // ── Advances ───────────────────────────────────────────────────────────
      advances: [
        {
          id: 'ADV-001',
          farmerId: 'F-001',
          amount: 2000,
          remainingBalance: 2000,
          dateBS: '2082/02/10',
          reason: 'Feed purchase',
          recordedBy: 'U-001',
          createdAt: '2082/02/10',
        },
        {
          id: 'ADV-002',
          farmerId: 'F-003',
          amount: 1500,
          remainingBalance: 1500,
          dateBS: '2082/02/12',
          reason: 'Personal loan',
          recordedBy: 'U-001',
          createdAt: '2082/02/12',
        },
      ],

      addAdvance: (data) => {
        const s = get();
        const adv: Advance = {
          id: `ADV-${Date.now()}`,
          farmerId: data.farmerId,
          amount: data.amount,
          remainingBalance: data.amount,
          dateBS: data.dateBS,
          reason: data.reason,
          recordedBy: s.currentUser?.id || 'unknown',
          createdAt: formatBSDate(getTodayBS()),
        };
        set(ss => ({ advances: [...ss.advances, adv] }));
      },

      deductAdvance: (farmerId, maxDeduction, _invoiceId) => {
        let remaining = maxDeduction;
        let totalDeducted = 0;

        set(s => ({
          advances: s.advances.map(a => {
            if (a.farmerId !== farmerId || a.remainingBalance <= 0 || remaining <= 0) return a;
            const deduct = Math.min(a.remainingBalance, remaining);
            remaining -= deduct;
            totalDeducted += deduct;
            return { ...a, remainingBalance: parseFloat((a.remainingBalance - deduct).toFixed(2)) };
          }),
        }));

        return parseFloat(totalDeducted.toFixed(2));
      },

      // ── Invoices ───────────────────────────────────────────────────────────
      invoices: [],

      generateInvoice: (farmerId, periodStart, periodEnd) => {
        const s = get();
        const farmer = s.farmers.find(f => f.id === farmerId);
        if (!farmer) return null;

        // Get records in period
        const records = s.milkRecords.filter(
          r => r.farmerId === farmerId && r.dateBS >= periodStart && r.dateBS <= periodEnd
        );

        if (records.length === 0) return null;

        const totalQtyMorning = parseFloat(records.reduce((s, r) => s + r.morningQty, 0).toFixed(2));
        const totalQtyEvening = parseFloat(records.reduce((s, r) => s + r.eveningQty, 0).toFixed(2));
        const totalQty = parseFloat((totalQtyMorning + totalQtyEvening).toFixed(2));
        const grossAmount = parseFloat(records.reduce((s, r) => s + r.totalAmount, 0).toFixed(2));

        // Calculate advance deduction (cannot exceed gross amount)
        const totalOutstandingAdvance = s.advances
          .filter(a => a.farmerId === farmerId && a.remainingBalance > 0)
          .reduce((sum, a) => sum + a.remainingBalance, 0);

        const advanceDeduction = parseFloat(Math.min(grossAmount, totalOutstandingAdvance).toFixed(2));
        const netPayable = parseFloat((grossAmount - advanceDeduction).toFixed(2));

        // Generate invoice number
        const [year, month, day] = periodStart.split('/');
        const fCode = farmerId.replace('F-', '');
        const invNumber = `INV-${year}-${month}-${day}-${fCode}`;

        const invoice: Invoice = {
          id: `INV-${Date.now()}`,
          invoiceNumber: invNumber,
          farmerId,
          periodStart,
          periodEnd,
          totalDays: records.length,
          totalQtyMorning,
          totalQtyEvening,
          totalQty,
          grossAmount,
          advanceDeduction,
          netPayable,
          status: 'generated',
          generatedBy: s.currentUser?.name || 'admin',
          createdAt: formatBSDate(getTodayBS()),
          records: records.sort((a, b) => a.dateBS.localeCompare(b.dateBS)),
        };

        // Deduct advances
        if (advanceDeduction > 0) {
          get().deductAdvance(farmerId, advanceDeduction, invoice.id);
        }

        set(ss => ({ invoices: [invoice, ...ss.invoices] }));
        return invoice;
      },

      markInvoicePaid: (id, method) => {
        set(s => ({
          invoices: s.invoices.map(inv =>
            inv.id === id
              ? { ...inv, status: 'paid', paymentDate: formatBSDate(getTodayBS()), paymentMethod: method }
              : inv
          ),
        }));
      },

      cancelInvoice: (id) => {
        set(s => ({
          invoices: s.invoices.map(inv =>
            inv.id === id ? { ...inv, status: 'cancelled' } : inv
          ),
        }));
      },
    }),
    {
      name: 'dairyflow-pro-store',
      version: 1,
    }
  )
);
