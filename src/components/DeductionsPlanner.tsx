import React, { useState } from 'react';
import { User, TaxDeductions, ComparisonResult } from '../types';
import { 
  ShieldCheck, 
  HelpCircle, 
  Scale, 
  MapPin, 
  Sparkles, 
  TrendingDown, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface DeductionsPlannerProps {
  user: User;
  token: string | null;
  comparison: ComparisonResult | null;
  onRefreshProfile: (updatedUser: User) => void;
}

export default function DeductionsPlanner({ user, token, comparison, onRefreshProfile }: DeductionsPlannerProps) {
  // Setup forms linked to user deductions profile
  const [sec80C, setSec80C] = useState(user.profile.deductions.sec80C);
  const [sec80D, setSec80D] = useState(user.profile.deductions.sec80D);
  const [nps80CCD1B, setNps80CCD1B] = useState(user.profile.deductions.nps80CCD1B);
  const [homeLoanInterest, setHomeLoanInterest] = useState(user.profile.deductions.homeLoanInterest);
  const [educationLoan, setEducationLoan] = useState(user.profile.deductions.educationLoan);
  const [donations, setDonations] = useState(user.profile.deductions.donations);
  const [rentPaid, setRentPaid] = useState(user.profile.deductions.rentPaid);
  const [metroCity, setMetroCity] = useState(user.profile.deductions.metroCity);
  
  const [saving, setSaving] = useState(false);

  // Maximum caps guidance under Act
  const max80C = 150000;
  const max80D = 50000;
  const maxNps = 50000;
  const maxHomeInterest = 200000;

  const handleSaveDeductions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: TaxDeductions = {
        sec80C: Number(sec80C),
        sec80D: Number(sec80D),
        nps80CCD1B: Number(nps80CCD1B),
        homeLoanInterest: Number(homeLoanInterest),
        educationLoan: Number(educationLoan),
        donations: Number(donations),
        rentPaid: Number(rentPaid),
        metroCity
      };

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deductions: payload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onRefreshProfile(data.user);
      alert('Deductions and rent records updated successfully!');
    } catch (err: any) {
      alert(`Error updating deductions: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!comparison) return null;

  return (
    <div id="deductions_planner" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left 2/3: Form entry */}
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-5 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Optimize Section Exemption Limits
        </h3>

        <form onSubmit={handleSaveDeductions} className="space-y-6">
          {/* Section 80C, 80D, and NPS (Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Standard Investments</h4>
              
              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-505 mb-1.5">
                  <span>Section 80C (PPF, ELSS, EPF, Insurance)</span>
                  <span className="text-slate-400">Max ₹1.5L</span>
                </label>
                <div className="relative">
                  <input
                    id="deduct_input_80c"
                    type="number"
                    max={max80C}
                    value={sec80C}
                    onChange={(e) => setSec80C(Math.min(max80C, Number(e.target.value)))}
                    className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2.5 rounded-xl focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">INR</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={max80C}
                  step="5000"
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  className="w-full mt-2 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-505 mb-1.5">
                  <span>Section 80D (Health Premium Protection)</span>
                  <span className="text-slate-400">Max ₹50K</span>
                </label>
                <div className="relative">
                  <input
                    id="deduct_input_80d"
                    type="number"
                    max={max80D}
                    value={sec80D}
                    onChange={(e) => setSec80D(Math.min(max80D, Number(e.target.value)))}
                    className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2.5 rounded-xl focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">INR</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-505 mb-1.5">
                  <span>National Pension Scheme Sec 80CCD(1B)</span>
                  <span className="text-slate-400">Max ₹50K</span>
                </label>
                <div className="relative">
                  <input
                    id="deduct_input_nps"
                    type="number"
                    max={maxNps}
                    value={nps80CCD1B}
                    onChange={(e) => setNps80CCD1B(Math.min(maxNps, Number(e.target.value)))}
                    className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2.5 rounded-xl focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">INR</span>
                </div>
              </div>
            </div>

            {/* Loans and Rent info */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Rent & Special Exemptions</h4>

              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-505 mb-1.5">
                  <span>Annual House Rent Paid (For HRA)</span>
                  <span className="text-[10px] text-indigo-600">Calculates Sec 10(13A)</span>
                </label>
                <div className="relative">
                  <input
                    id="deduct_input_rent"
                    type="number"
                    value={rentPaid}
                    onChange={(e) => setRentPaid(Number(e.target.value))}
                    className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2.5 rounded-xl focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">INR</span>
                </div>
              </div>

              <div className="flex gap-4 items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                  <span className="block text-xs font-bold text-slate-700">Metro City Exemption</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Metro (Mumbai, Delhi, Kolkata, Chennai) triggers 50% Basic salary cap instead of 40%.</p>
                </div>
                <button
                  id="btn_metro_toggle"
                  type="button"
                  onClick={() => setMetroCity(!metroCity)}
                  className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer ${
                    metroCity 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-slate-250 text-slate-600'
                  }`}
                >
                  {metroCity ? 'Metro (50%)' : 'Non-Metro (40%)'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1">Home Loan Int (Sec 24b)</label>
                  <input
                    id="deduct_input_homeland"
                    type="number"
                    max={maxHomeInterest}
                    value={homeLoanInterest}
                    onChange={(e) => setHomeLoanInterest(Math.min(maxHomeInterest, Number(e.target.value)))}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-550 mb-1">Education Loan Int (Sec 80E)</label>
                  <input
                    id="deduct_input_eduland"
                    type="number"
                    value={educationLoan}
                    onChange={(e) => setEducationLoan(Number(e.target.value))}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1">Approved G-Donations (Sec 80G)</label>
                <input
                  id="deduct_input_donations"
                  type="number"
                  value={donations}
                  onChange={(e) => setDonations(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex justify-end">
            <button
              id="deduct_btn_submit"
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Update Exemptions & Calculate Slabs
            </button>
          </div>
        </form>
      </div>

      {/* Exemption Limits Summary & Potential Savings indicator */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm tracking-tight mb-4 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-400" /> Comparison Balance
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="block text-[10px] text-slate-300 font-semibold uppercase tracking-wide">Approved HRA Exemption</span>
              <h4 className="text-lg font-bold mt-1 text-emerald-400">
                ₹{Math.round(comparison.hraExemption || 0).toLocaleString('en-IN')}
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                Leastar calculation based on Section 10(13A).
              </p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="block text-[10px] text-slate-300 font-semibold uppercase tracking-wide">Total Deductions Claimed</span>
              <h4 className="text-lg font-bold mt-1">
                ₹{Math.round(comparison.oldRegime.exemptionsAndDeductions).toLocaleString('en-IN')}
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                Standard deduction of ₹50k included inside of Old configuration.
              </p>
            </div>

            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
              <span className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Regime Recommendation</span>
              <h4 className="text-md font-bold mt-1 capitalize text-emerald-300">
                {comparison.recommendedRegime.toUpperCase()} REGIME
              </h4>
              <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                By preferring this regime, you can capture up to <strong className="text-white">₹{Math.round(comparison.netSavings).toLocaleString('en-IN')}</strong> in annual withhold savings!
              </p>
            </div>
          </div>
        </div>

        {/* Informational Guidelines section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Deductions Master Guidelines</h4>
          
          <div className="space-y-3 text-[11px] leading-relaxed text-slate-500">
            <div className="flex gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-750 block">Section 80C Shield</strong>
                Invest in tax-saving ELSS indexes (highest returns, 3-year lock-in) or regular PPF accounts to claim up to ₹1,50,000 annually.
              </div>
            </div>

            <div className="flex gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-750 block">Sec 80D - Health Protection</strong>
                Claim up to ₹25,000 premium paid for family cover, plus an extra ₹25k to ₹50k for protective medical coverage of senior parents.
              </div>
            </div>

            <div className="flex gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-750 block">Section 24(b) Home loan Shield</strong>
                Deduct up to ₹2,000,000 on interest paid for self-occupied primary residential purchases within the fiscal year.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
