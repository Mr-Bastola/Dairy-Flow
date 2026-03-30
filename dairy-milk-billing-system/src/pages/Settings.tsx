import { useState } from 'react';
import { useStore } from '../store/store';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { profile, updateProfile } = useStore();
  const [form, setForm] = useState({ ...profile });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    toast.success('Settings saved!');
  };

  const fields = [
    { label: 'Dairy Name', key: 'dairyName', type: 'text', placeholder: 'Nagarkot Dairy Cooperative' },
    { label: 'Address', key: 'address', type: 'text', placeholder: 'Ward 5, Nagarkot, Bhaktapur' },
    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '9841000000' },
    { label: 'Registration Number', key: 'registrationNumber', type: 'text', placeholder: 'DC-2081-045' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Settings</h2>

      {/* Dairy Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🏪 Dairy Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          {fields.map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          ))}
          <button type="submit"
            className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors">
            <Save size={16} /> Save Changes
          </button>
        </form>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">ℹ️ System Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Application</span>
            <span className="font-medium">DairyFlow Pro</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">2.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Calendar</span>
            <span className="font-medium">Bikram Sambat (BS)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Timezone</span>
            <span className="font-medium">Asia/Kathmandu (UTC+5:45)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Fiscal Year</span>
            <span className="font-medium">Baisakh 1 — Chaitra End</span>
          </div>
        </div>
      </div>

      {/* Access Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <div className="font-semibold mb-1">👤 Access Information</div>
        <p>Both <b>Admin</b> and <b>Operator</b> can update dairy profile settings. Rate configuration requires visiting the Rate Config page. Fiscal Year management is available under Fiscal Years.</p>
      </div>
    </div>
  );
}
