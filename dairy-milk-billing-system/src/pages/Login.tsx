import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const login = useStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success('Welcome to DairyFlow Pro!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <Milk className="text-green-700" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DairyFlow Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Milk Collection & Billing System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin or operator"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
            Sign In
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700 mb-2">Demo Credentials:</p>
          <p>👤 Admin: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
          <p>👤 Operator: <span className="font-mono">operator</span> / <span className="font-mono">op123</span></p>
        </div>
      </div>
    </div>
  );
}
