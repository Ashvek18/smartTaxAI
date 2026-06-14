import React from 'react';
import { ComparisonResult, User, FinancialGoal } from '../types';
import { 
  PiggyBank, 
  TrendingDown, 
  Calendar, 
  Award, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  Coins 
} from 'lucide-react';

interface DashboardProps {
  user: User;
  comparison: ComparisonResult | null;
  goals: FinancialGoal[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ user, comparison, goals, onNavigate }: DashboardProps) {
  if (!comparison) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { oldRegime, newRegime, recommendedRegime, netSavings } = comparison;
  const activeRegimeResult = recommendedRegime === 'old' ? oldRegime : newRegime;
  
  // Calculate potential metrics
  const grossIncome = comparison.grossSalary;
  const netTakeHome = grossIncome - activeRegimeResult.totalTax - user.profile.salary.professionalTax;
  
  // 80C percentage utilization
  const sec80CValue = user.profile.deductions.sec80C;
  const percentage80C = Math.min(100, Math.round((sec80CValue / 150000) * 100));

  // Medical policy utilization
  const sec80DValue = user.profile.deductions.sec80D;
  const percentage80D = Math.min(100, Math.round((sec80DValue / 25050) * 100)); // Standard limit for self, up to 25k

  // Goals savings status
  const totalGoalsCount = goals.length;
  const totalTargetGoalsAmount = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSavedGoals = goals.reduce((acc, g) => acc + g.currentSaved, 0);
  const goalsSavedPercent = totalTargetGoalsAmount > 0 ? Math.round((totalSavedGoals / totalTargetGoalsAmount) * 100) : 0;

  return (
    <div id="smarttax_dashboard" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial-gradient from-emerald-400 to-indigo-600 rounded-l-full pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 rounded-full text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
            <Sparkles className="w-3 h-3 text-emerald-400" /> AI Optimization Calibrated
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Greetings, {user.name}
          </h2>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            SmartTaxAI analyzed your salary of <strong className="text-white">₹{(grossIncome).toLocaleString('en-IN')}</strong>. 
            By choosing the <strong className="text-emerald-400 uppercase">{recommendedRegime} Tax Regime</strong>, you minimize your obligation, keeping more of your hard-earned value.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
               id="dash_btn_analyze"
               onClick={() => onNavigate('salary')}
               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Analyze salary
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
               id="dash_btn_optimize"
               onClick={() => onNavigate('investment')}
               className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Ask AI recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Pay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Gross Annual Income</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight">₹{grossIncome.toLocaleString('en-IN')}</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">Total salary structure valuation (CTC)</p>
          </div>
        </div>

        {/* Card 2: Net Take Home */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Est. Net Take-Home</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-emerald-600 tracking-tight">₹{Math.round(netTakeHome).toLocaleString('en-IN')}</h4>
            <p className="text-[10px] text-emerald-600/80 mt-1 leading-normal">
              ₹{Math.round(netTakeHome / 12).toLocaleString('en-IN')} average monthly payout
            </p>
          </div>
        </div>

        {/* Card 3: Tax Payable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Annual Tax Liability</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight">
              ₹{Math.round(activeRegimeResult.totalTax).toLocaleString('en-IN')}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Effective tax rate: {((activeRegimeResult.totalTax / grossIncome) * 100 || 0).toFixed(1)}% (cess included)
            </p>
          </div>
        </div>

        {/* Card 4: Net Savings / Optimization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recommendation Shield</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold text-indigo-600 tracking-tight uppercase">
              {recommendedRegime === 'new' ? 'NEW REGIME' : 'OLD REGIME'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              {netSavings > 0 
                ? `Saves you ₹${Math.round(netSavings).toLocaleString('en-IN')} compared to other regime!` 
                : "Both regimes yield equal tax liability on this layout."}
            </p>
          </div>
        </div>
      </div>

      {/* Main split sections: Left (Tax Gauge & Regimes) | Right (Highlights & Goals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Regimes Comparison & Optimization Gauge */}
        <div className="lg:col-span-2 space-y-6">
          {/* Regime Side-by-Side Quickview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-4">Regime Performance Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Regime Summary */}
              <div className={`p-5 rounded-2xl border transition-all ${
                recommendedRegime === 'old' 
                  ? 'bg-indigo-50/40 border-indigo-200' 
                  : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-slate-700 tracking-wider">OLD TAX REGIME</h4>
                  {recommendedRegime === 'old' && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold tracking-widest uppercase">OPTIMAL</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Taxable Income:</span>
                    <span className="font-semibold text-slate-800">₹{Math.round(oldRegime.taxableIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Exemptions & Deductions:</span>
                    <span className="font-semibold text-emerald-600">-₹{Math.round(oldRegime.exemptionsAndDeductions).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 my-2"></div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650">
                    <span>Base Tax Obligations:</span>
                    <span>₹{Math.round(oldRegime.baseTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650">
                    <span>Standard Cess (4%):</span>
                    <span>₹{Math.round(oldRegime.cess).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 pt-2">
                    <span>Total Tax Liabilities:</span>
                    <span className={recommendedRegime === 'old' ? 'text-indigo-600' : 'text-slate-700'}>
                      ₹{Math.round(oldRegime.totalTax).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Regime Summary */}
              <div className={`p-5 rounded-2xl border transition-all ${
                recommendedRegime === 'new' 
                  ? 'bg-indigo-50/45 border-indigo-200' 
                  : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-slate-700 tracking-wider">NEW TAX REGIME</h4>
                  {recommendedRegime === 'new' && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold tracking-widest uppercase">OPTIMAL</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Taxable Income:</span>
                    <span className="font-semibold text-slate-800">₹{Math.round(newRegime.taxableIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Exemptions & Deductions:</span>
                    <span className="font-semibold text-emerald-600">-₹{Math.round(newRegime.exemptionsAndDeductions).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 my-2"></div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650">
                    <span>Base Tax Obligations:</span>
                    <span>₹{Math.round(newRegime.baseTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650">
                    <span>Standard Cess (4%):</span>
                    <span>₹{Math.round(newRegime.cess).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 pt-2">
                    <span>Total Tax Liabilities:</span>
                    <span className={recommendedRegime === 'new' ? 'text-indigo-600' : 'text-slate-700'}>
                      ₹{Math.round(newRegime.totalTax).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Deduction Limits Gauges */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-semibold text-slate-800">Deduction Shields Utilization</h3>
              <button
                id="dash_btn_deduct"
                onClick={() => onNavigate('deduction')}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Claim Deductions & HRA Exemption
              </button>
            </div>

            <div className="space-y-4">
              {/* Section 80C limit */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                  <span className="font-medium text-slate-700">Section 80C Deductions (ELSS, PPF, EPF)</span>
                  <span className="font-semibold">₹{sec80CValue.toLocaleString('en-IN')} / ₹1,50,000 ({percentage80C}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    id="dash_pb_80c"
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage80C}%` }}
                  ></div>
                </div>
              </div>

              {/* Section 80D limit */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                  <span className="font-medium text-slate-700">Section 80D Medical Insurance premium shield</span>
                  <span className="font-semibold">₹{sec80DValue.toLocaleString('en-IN')} / ₹50,000 ({percentage80D}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    id="dash_pb_80d"
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage80D}%` }}
                  ></div>
                </div>
              </div>

              {/* NPS section limit */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                  <span className="font-medium text-slate-700">NPS Sec 80CCD(1B) Extra shielding capacity</span>
                  <span className="font-semibold">₹{user.profile.deductions.nps80CCD1B.toLocaleString('en-IN')} / ₹50,000</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    id="dash_pb_nps"
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((user.profile.deductions.nps80CCD1B/50000)*100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: Financial Goal Summaries & Urgent Advice */}
        <div className="space-y-6">
          {/* Action List panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Action Checklist
            </h3>
            
            <div className="space-y-3.5">
              {recommendedRegime === 'old' && sec80CValue < 150000 && (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-xs text-amber-900">Maximize 80C Allocation</h5>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                      You have ₹{(150000 - sec80CValue).toLocaleString('en-IN')} unused 80C capacity. Allocate to ELSS or PPF to save an extra ₹{Math.round((150000 - sec80CValue) * 0.2).toLocaleString('en-IN')} in taxes.
                    </p>
                  </div>
                </div>
              )}

              {user.profile.deductions.rentPaid > 0 && recommendedRegime === 'new' && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-xs text-indigo-950 text-indigo-900">New Regime Disables HRA</h5>
                    <p className="text-[10px] text-indigo-700 mt-0.5 leading-relaxed">
                      Your rent does not give HRA tax exemptions under the New flat-rate Regime. Standard deduction (₹75k) is already applied automatically. No action required.
                    </p>
                  </div>
                </div>
              )}

              {user.profile.deductions.rentPaid > 0 && recommendedRegime === 'old' && comparison.hraExemption > 0 && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <h5 className="font-semibold text-xs text-emerald-950 text-emerald-900">HRA Exemption Claimed</h5>
                    <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                      Claimed ₹{Math.round(comparison.hraExemption).toLocaleString('en-IN')} in tax exemptions under Section 10(13A). Ensure rent agreement is in place.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1 shrink-0"></div>
                <div>
                  <h5 className="font-semibold text-xs text-slate-800">Add NPS For Extra ₹50k Limit</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Earners can declare Section 80CCD(1B) investment separately under the Old regime to subtract ₹50,000 from taxable wages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Goal tracker panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-indigo-600" /> Goal Targets Status
              </h3>
              <button
                id="dash_btn_goals"
                onClick={() => onNavigate('forecast')}
                className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Create Goal
              </button>
            </div>

            {totalGoalsCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">No active goals configured.</p>
                <button
                  onClick={() => onNavigate('forecast')}
                  className="mt-3 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-semibold cursor-pointer"
                >
                  Configure Goal Targets
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-50/50 flex justify-between items-center text-xs">
                  <div className="text-slate-500 font-medium">Accumulation Pool Status:</div>
                  <div className="font-bold text-indigo-700">
                    ₹{totalSavedGoals.toLocaleString('en-IN')} / ₹{totalTargetGoalsAmount.toLocaleString('en-IN')} ({goalsSavedPercent}%)
                  </div>
                </div>

                <div className="space-y-2.5">
                  {goals.map((goal) => {
                    const percent = Math.min(100, Math.round((goal.currentSaved / goal.targetAmount) * 100));
                    return (
                      <div key={goal.id} className="p-2.5 border border-slate-100 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{goal.name}</span>
                          <span className="text-slate-500 text-[10px]">
                            ₹{goal.currentSaved.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400">
                          <span>Timeline: {goal.targetYears} Years</span>
                          <span>Allocation: ₹{goal.monthlyInvestment.toLocaleString('en-IN')}/mo</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
