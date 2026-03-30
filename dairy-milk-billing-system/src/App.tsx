import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/store';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyEntry from './pages/DailyEntry';
import Farmers from './pages/Farmers';
import Ledger from './pages/Ledger';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Advances from './pages/Advances';
import RateConfig from './pages/RateConfig';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FiscalYears from './pages/FiscalYears';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useStore(s => s.isLoggedIn);
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        success: { style: { background: '#16a34a', color: 'white' } },
        error: { style: { background: '#dc2626', color: 'white' } },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="entry" element={<DailyEntry />} />
          <Route path="farmers" element={<Farmers />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="billing" element={<Billing />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="advances" element={<Advances />} />
          <Route path="rates" element={<RateConfig />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="fiscal-years" element={<FiscalYears />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
