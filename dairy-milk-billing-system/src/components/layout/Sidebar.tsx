import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, BookOpen,
  Receipt, FileText, CreditCard, TrendingUp,
  Settings, Calendar, LogOut, Milk, ChevronLeft,
  DollarSign,
} from 'lucide-react';
import { useStore } from '../../store/store';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entry', icon: ClipboardList, label: 'Daily Entry' },
  { to: '/farmers', icon: Users, label: 'Farmers' },
  { to: '/ledger', icon: BookOpen, label: 'Ledger' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/advances', icon: CreditCard, label: 'Advances' },
  { to: '/rates', icon: DollarSign, label: 'Rate Config' },
  { to: '/reports', icon: TrendingUp, label: 'Reports' },
  { to: '/fiscal-years', icon: Calendar, label: 'Fiscal Years' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface Props { open: boolean; setOpen: (v: boolean) => void; }

export default function Sidebar({ open, setOpen }: Props) {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`${open ? 'w-56' : 'w-14'} flex flex-col bg-green-900 text-white transition-all duration-200 shrink-0`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-green-800">
        {open && (
          <div className="flex items-center gap-2">
            <Milk className="text-green-300 shrink-0" size={22} />
            <span className="font-bold text-sm leading-tight">DairyFlow<br /><span className="text-green-300 text-xs font-normal">Pro</span></span>
          </div>
        )}
        {!open && <Milk className="text-green-300 mx-auto" size={22} />}
        {open && (
          <button onClick={() => setOpen(false)} className="text-green-400 hover:text-white">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mx-1 my-0.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-200 hover:bg-green-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-green-800 p-3">
        {open && currentUser && (
          <div className="text-xs text-green-300 mb-2 truncate">
            <div className="font-medium text-white truncate">{currentUser.name}</div>
            <div className="capitalize">{currentUser.role}</div>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-green-300 hover:text-white text-sm w-full px-1 py-1.5 rounded hover:bg-green-800 transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
