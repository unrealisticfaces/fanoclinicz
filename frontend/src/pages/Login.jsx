import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-fano-bg p-4">
      <div className="w-full max-w-[420px]">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-fano-primary tracking-tight">
            FANO DENTAL CLINIC
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-fano-surface rounded-xl shadow-sm border border-fano-border p-8">
          <h2 className="text-lg font-semibold text-center text-fano-text mb-6">
            Sign in to your account
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-fano-text mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-fano-primary focus:ring-1 focus:ring-fano-primary transition-all"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-fano-text">
                  Password
                </label>
                <button type="button" className="text-xs text-fano-muted hover:text-fano-primary">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-fano-primary focus:ring-1 focus:ring-fano-primary transition-all pe-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-fano-primary hover:bg-fano-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm mt-2"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}