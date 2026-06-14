import React, { useState, useEffect } from 'react';
import { User, FinancialGoal } from '../types';
import { 
  PiggyBank, 
  Trash2, 
  Plus, 
  TrendingUp, 
  CalendarDays, 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface TdsForecast {
  annualTaxPayable: number;
  monthlyTds: number;
  activeRegime: 'old' | 'new';
  monthlyBreakdown: {
    month: string;
    forecastTds: number;
    status: 'Deducted' | 'Projected';
    cumulativeTaxPaid: number;
    remainingTaxLiability: number;
  }[];
  totalDeductedSoFar: number;
  remainingTaxLiability: number;
}

interface GoalsAndTdsProps {
  user: User;
  token: string | null;
  goals: FinancialGoal[];
  onRefreshGoals: () => void;
}

export default function GoalsAndTds({ user, token, goals, onRefreshGoals }: GoalsAndTdsProps) {
  const [tdsData, setTdsData] = useState<TdsForecast | null>(null);
  const [loadingTds, setLoadingTds] = useState(false);
  
  // Create Goal form states
  const [gName, setGName] = useState('');
  const [gType, setGType] = useState<'home' | 'retirement' | 'emergency' | 'car' | 'vacation'>('home');
  const [gTarget, setGTarget] = useState(1000000);
  const [gYears, setGYears] = useState(5);
  const [gSavings, setGSavings] = useState(15000);
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchTdsForecast = async () => {
    setLoadingTds(true);
    try {
      const res = await fetch('/api/tds/forecast', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTdsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTds(false);
    }
  };

  useEffect(() => {
    fetchTdsForecast();
  }, [user]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;
    setSavingGoal(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: gName,
          type: gType,
          targetAmount: gTarget,
          targetYears: gYears,
          monthlySavings: gSavings
        })
      });

      if (res.ok) {
        setGName('');
        onRefreshGoals();
        alert('Goal target configured successfully!');
      }
    } catch (err: any) {
      alert(`Error creating goal: ${err.message}`);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefreshGoals();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div id="goals_tds_section" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Target goals dashboard lists & Creators (2 cols) */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-5 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-600 animate-bounce" /> Long-Term Financial Goal Planning
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Goal Form */}
            <form onSubmit={handleCreateGoal} className="space-y-4 md:col-span-1 border-r border-slate-100 pr-0 md:pr-6">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Enter New goal target</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-505 mb-1">Goal Designation</label>
                  <input
                    id="goal_input_name"
                    type="text"
                    required
                    placeholder="e.g. Dream Apartment Downpayment"
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    className="w-full text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-505 px-3 py-2 rounded-xl focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-505 mb-1">Goal Classification</label>
                  <select
                    id="goal_input_type"
                    value={gType}
                    onChange={(e) => setGType(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 focus:border-indigo-505 px-3 py-2.5 rounded-xl focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="home">Home / Property</option>
                    <option value="retirement">Retirement Wealth</option>
                    <option value="emergency">Emergency / Reserve</option>
                    <option value="car">Car Purchase</option>
                    <option value="vacation">International Vacation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-550 mb-1">Target (INR)</label>
                    <input
                      id="goal_input_target"
                      type="number"
                      required
                      value={gTarget}
                      onChange={(e) => setGTarget(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 focus:border-indigo-505 px-2 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-550 mb-1">Duration (Years)</label>
                    <input
                      id="goal_input_years"
                      type="number"
                      required
                      min="1"
                      value={gYears}
                      onChange={(e) => setGYears(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 focus:border-indigo-505 px-2 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-555 mb-1">Intended Monthly Saving</label>
                  <input
                    id="goal_input_saving"
                    type="number"
                    value={gSavings}
                    onChange={(e) => setGSavings(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 focus:border-indigo-505 px-3 py-2 rounded-xl focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Calculates optimal allocations for compound index returns.</p>
                </div>
              </div>

              <button
                id="goal_btn_submit"
                type="submit"
                disabled={savingGoal}
                className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {savingGoal ? <Loader2 className="w-3 animate-spin" /> : <Plus className="w-4 h-4" />} Create Goal
              </button>
            </form>

            {/* List active goals */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Ongoing Targets Portfolio</h4>
              
              {goals.length === 0 ? (
                <div className="text-center py-12 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Lightbulb className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Configure your first retirement or property target to receive AI asset class allocations.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {goals.map((goal) => {
                    const progress = goal.currentSaved > 0 
                      ? Math.min(100, Math.round((goal.currentSaved/goal.targetAmount)*100))
                      : 0;
                    return (
                      <div key={goal.id} className="p-4 border border-slate-100 hover:border-slate-200 transition-all rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                              {goal.type} goal
                            </span>
                            <h5 className="font-bold text-xs text-slate-800 tracking-tight mt-1">{goal.name}</h5>
                          </div>
                          <button
                            id={`btn_delete_goal_${goal.id}`}
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 text-slate-355 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Progress Meter bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                            <span>Saves matching: {progress}%</span>
                            <span>INR {goal.currentSaved.toLocaleString('en-IN')} / {goal.targetAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>

                        {/* Suggestions matches */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/50">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Recommended tax-shields:</span>
                          {goal.suggestedInvestments.map((s, idx) => (
                            <span key={idx} className="p-1 px-2 bg-slate-50 text-slate-600 text-[9px] font-bold rounded-md uppercase border border-slate-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly TDS Forecast panel (1 col) */}
      <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Monthly TDS Projection
          </h3>

          {loadingTds ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : tdsData ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Gross annual tax forecast:</span>
                  <span className="font-bold text-white text-sm">₹{Math.round(tdsData.annualTaxPayable).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Monthly withholdings:</span>
                  <span className="font-bold text-emerald-400 text-sm">₹{Math.round(tdsData.monthlyTds).toLocaleString('en-IN')}/mo</span>
                </div>
                <div className="h-[1px] bg-slate-800"></div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Deducted to date (Apr-Jun):</span>
                  <span>₹{Math.round(tdsData.totalDeductedSoFar).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Outstanding reserve balance:</span>
                  <span>₹{Math.round(tdsData.remainingTaxLiability).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Forecast monthly vertical grid list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tdsData.monthlyBreakdown.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-755 block">{m.month} Forecast</span>
                      <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
                        m.status === 'Deducted' ? 'text-indigo-600' : 'text-slate-400'
                      }`}>{m.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block">₹{m.forecastTds.toLocaleString('en-IN')}</span>
                      <span className="text-[8.5px] text-slate-400 block font-semibold">Reserve: ₹{m.remainingTaxLiability.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">Forecast statistics unavailable.</div>
          )}
        </div>
      </div>
    </div>
  );
}
