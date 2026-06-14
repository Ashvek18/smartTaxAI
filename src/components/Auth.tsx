import React, { useState } from 'react';
import { User } from '../types';
import { Shield, UserPlus, LogIn, Key, Loader2, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  user: User | null;
  token: string | null;
  onLogin: (user: User, token: string) => void;
  onLogout: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function Auth({ user, token, onLogin, onLogout, onProfileUpdate }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Profile edit states (for inside the application settings)
  const [tempName, setTempName] = useState(user?.name || '');
  const [tempAge, setTempAge] = useState(user?.profile?.age || 30);
  const [tempRisk, setTempRisk] = useState<'low' | 'medium' | 'high'>(user?.profile?.riskAppetite || 'medium');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  React.useEffect(() => {
    if (user) {
      setTempName(user.name);
      setTempAge(user.profile.age);
      setTempRisk(user.profile.riskAppetite);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { email, password, name, age } 
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication challenge failed.');
      }

      onLogin(data.user, data.token);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please fill in your registered email first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setUpdatingProfile(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: tempName,
          age: tempAge,
          riskAppetite: tempRisk
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      
      onProfileUpdate(data.user);
      setMessage('Personal risk profile and settings updated successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // If user is already authenticated, render their Profile Settings section
  if (user) {
    return (
      <div id="auth_profile_settings" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">My Tax Profile</h3>
              <p className="text-xs text-slate-400">Configure your global taxation assumptions</p>
            </div>
          </div>
          <button
            id="auth_btn_logout"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Registered Address (Email)</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-450 px-3.5 py-2.5 rounded-xl cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Human Name</label>
              <input
                id="profile_input_name"
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 rounded-xl transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Age (Years)</label>
              <input
                id="profile_input_age"
                type="number"
                value={tempAge}
                onChange={(e) => setTempAge(Number(e.target.value))}
                required
                min="18"
                max="100"
                className="w-full text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 rounded-xl transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">My Investment Risk Appetite</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((r) => (
                <button
                  key={r}
                  id={`risk_appetite_${r}`}
                  type="button"
                  onClick={() => setTempRisk(r)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    tempRisk === r
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {r} Risk
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              *Helps calibrate ELSS index, FD locked-in bonds, and equity exposure priorities of our advisory matching engine.
            </p>
          </div>

          <button
            id="auth_btn_update"
            type="submit"
            disabled={updatingProfile}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {updatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Profile Calibration
          </button>
        </form>
      </div>
    );
  }

  // Login / Registrant forms
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">SmartTaxAI Gateway</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {isRegister ? 'Create an account to track Indian IT Act comparison portfolios and SIP targets.' : 'Log in to calculate your income tax regimes and manage investment checklists.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Full Legal Name</label>
            <input
              id="register_name"
              type="text"
              placeholder="e.g. Rahul Patil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs border border-slate-250 hover:border-slate-350 focus:border-indigo-500 focus:outline-none px-3.5 py-3 rounded-xl transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email ID</label>
          <input
            id="login_email"
            type="email"
            placeholder="yourname@gmail.com or user@smarttax.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full text-xs border border-slate-250 hover:border-slate-350 focus:border-indigo-500 focus:outline-none px-3.5 py-3 rounded-xl transition-colors"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-500">Security Password</label>
            {!isRegister && (
              <button
                type="button"
                id="btn_forgot_password"
                onClick={handleForgotPassword}
                className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
              >
                Forgot?
              </button>
            )}
          </div>
          <input
            id="login_password"
            type="password"
            placeholder="password (user123 or admin123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full text-xs border border-slate-250 hover:border-slate-350 focus:border-indigo-500 focus:outline-none px-3.5 py-3 rounded-xl transition-colors"
          />
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Age (to track Senior Citizen slab benefits)</label>
            <input
              id="register_age"
              type="number"
              min="18"
              max="100"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              required
              className="w-full text-xs border border-slate-250 hover:border-slate-350 focus:border-indigo-500 focus:outline-none px-3.5 py-3 rounded-xl transition-colors"
            />
          </div>
        )}

        <button
          id="btn_auth_submit"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-3.5 rounded-xl transition-all shadow-sm shadow-indigo-150 cursor-pointer disabled:opacity-50 mt-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRegister ? (
            <>
              <UserPlus className="w-4 h-4" /> Sign Up & Initialize Profile
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Verify Credentials & Enter dashboard
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <button
          id="toggle_auth_mode"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setMessage('');
          }}
          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          {isRegister ? 'Already have an account? Log In here' : "First time planning? Open a Free Account"}
        </button>
      </div>

      {/* Show sandbox reminders for fast testing */}
      {/* {!isRegister && (
        <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            ⚡ Instant Sandbox Accounts:
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
            For Standard User: <code className="text-indigo-700">user@smarttax.ai</code> / <code className="text-indigo-700">user123</code><br/>
            For Global Admin: <code className="text-indigo-700">admin@smarttax.ai</code> / <code className="text-indigo-700">admin123</code>
          </p>
        </div>
      )} */}
    </div>
  );
}
