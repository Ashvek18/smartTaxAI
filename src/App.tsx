import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComparisonResult, User, FinancialGoal } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SalaryAnalyzer from './components/SalaryAnalyzer';
import DeductionsPlanner from './components/DeductionsPlanner';
import InvestmentAdvisor from './components/InvestmentAdvisor';
import GoalsAndTds from './components/GoalsAndTds';
import AdminPanel from './components/AdminPanel';
import { 
  Sparkles, 
  LayoutDashboard, 
  Coins, 
  ShieldAlert, 
  ShieldCheck, 
  Target, 
  LockKeyhole, 
  LogOut, 
  User as UserIcon, 
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Session states
  const [token, setToken] = useState<string | null>(localStorage.getItem('smarttax_jwt'));
  const [user, setUser] = useState<User | null>(null);
  
  // App metrics & goals states
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // UX states
  const [loadingMe, setLoadingMe] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticate user session on boot
  const fetchMe = async (activeToken: string) => {
    setLoadingMe(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        // Clear stale session
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe(token);
    }
  }, [token]);

  // Fetch active calculations whenever User structure changes
  const fetchComparison = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tax/comparison', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setComparison(data);
    } catch (e) {
      console.error('Failed to resolve comparison:', e);
    }
  };

  // Fetch registered goals
  const fetchGoals = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setGoals(data || []);
    } catch (e) {
      console.error('Failed to retrieve goal list:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComparison();
      fetchGoals();
    }
  }, [user]);

  const handleLogin = (newUser: User, jwt: string) => {
    localStorage.setItem('smarttax_jwt', jwt);
    setToken(jwt);
    setUser(newUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('smarttax_jwt');
    setToken(null);
    setUser(null);
    setComparison(null);
    setGoals([]);
    setActiveTab('dashboard');
  };

  const handleProfileSynced = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const navTabs = [
    { id: 'dashboard', name: 'Optimized Terminal', icon: LayoutDashboard },
    { id: 'salary', name: 'Salary Analyzer', icon: Coins },
    { id: 'deduction', name: 'Deductions checklist', icon: ShieldCheck },
    { id: 'investment', name: 'AdvisoryMATCH & AI', icon: Sparkles },
    { id: 'forecast', name: 'TDS & Goal Planner', icon: Target },
    ...(user?.role === 'admin' ? [{ id: 'admin', name: 'Global Console', icon: LockKeyhole }] : [])
  ];

  if (loadingMe) {
    return (
      <div className="flex flex-col gap-3 justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-xs font-semibold text-slate-400">Loading SmartTaxAI session context...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-600">
      {/* Brand Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-md block leading-none">SmartTaxAI</span>
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5 block">Indian FY 2025-26 Planner</span>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              {/* Desktop Nav menu */}
              <nav className="hidden lg:flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {navTabs.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      id={`nav_tab_${t.id}`}
                      onClick={() => {
                        setActiveTab(t.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        activeTab === t.id 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.name}
                    </button>
                  );
                })}
              </nav>

              {/* Profile tag & logout */}
              <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                <div className="text-right hidden sm:block">
                  <span className="font-bold text-slate-850 text-xs block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{user.role} configuration</span>
                </div>
                <button
                  id="btn_logout_header"
                  onClick={handleLogout}
                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-505 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) 
          : (
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">TAX PLANNER</span>
            </div>
          )
          }
        </div>

        {/* Mobile menu modal dropdown */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white p-4 space-y-2 animate-fade-in">
            {navTabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  id={`m_nav_tab_${t.id}`}
                  onClick={() => {
                    setActiveTab(t.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl ${
                    activeTab === t.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Auth 
                user={user} 
                token={token} 
                onLogin={handleLogin} 
                onLogout={handleLogout} 
                onProfileUpdate={handleProfileSynced} 
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  user={user} 
                  comparison={comparison} 
                  goals={goals} 
                  onNavigate={(tab) => {
                    if (tab === 'salary' || tab === 'deduction' || tab === 'investment' || tab === 'forecast') {
                      setActiveTab(tab);
                    }
                  }} 
                />
              )}

              {activeTab === 'salary' && (
                <SalaryAnalyzer 
                  user={user} 
                  token={token} 
                  comparison={comparison} 
                  onRefreshProfile={handleProfileSynced} 
                />
              )}

              {activeTab === 'deduction' && (
                <DeductionsPlanner 
                  user={user} 
                  token={token} 
                  comparison={comparison} 
                  onRefreshProfile={handleProfileSynced} 
                />
              )}

              {activeTab === 'investment' && (
                <InvestmentAdvisor 
                  user={user} 
                  token={token} 
                />
              )}

              {activeTab === 'forecast' && (
                <GoalsAndTds 
                  user={user} 
                  token={token} 
                  goals={goals} 
                  onRefreshGoals={fetchGoals} 
                />
              )}

              {activeTab === 'admin' && (
                user.role === 'admin' ? (
                  <AdminPanel user={user} token={token} />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-bounce" />
                    <h3 className="text-md font-bold text-slate-800">Console locked</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Administrator session credentials must be active to enter this console. Return to My Profile tab to calibrate sandbox parameters.
                    </p>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer disclaimer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-[10.5px] font-semibold text-slate-400 leading-normal">
            ⚙️ **SmartTaxAI** is an educational, full-stack simulator for Indian taxation optimization standards.
          </p>
          <p className="text-[9px] text-slate-400">
            Calculations are aligned with Union Finance Budget definitions (Indian fiscal years) and Section 10(13A)/80C/80D guide caps.
          </p>
        </div>
      </footer>
    </div>
  );
}
