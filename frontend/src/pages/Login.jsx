import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { IconEye, IconEyeOff, IconDeviceTablet, IconSpeakerphone } from '@tabler/icons-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/auth/login', {
        email, password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[420px]">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 tracking-widest uppercase">
            Fano Dental
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-center text-gray-800 mb-6">
            Sign in to Admin Dashboard
          </h2>
          
          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="admin@fanodental.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium pe-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-lg transition-all text-sm shadow-md mt-2"
            >
              Secure Sign In
            </button>
          </form>

          {/* APK Quick Launch Links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Tablet Modes</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/kiosk" className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-gray-600 hover:text-blue-600 transition-colors group">
                <IconDeviceTablet size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Kiosk</span>
              </Link>
              <Link to="/staff" className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-gray-600 hover:text-blue-600 transition-colors group">
                <IconSpeakerphone size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Triage</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}