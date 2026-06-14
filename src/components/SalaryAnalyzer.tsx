import React, { useState } from 'react';
import { User, SalaryStructure, ComparisonResult } from '../types';
import { 
  Calculator, 
  HelpCircle, 
  Check, 
  Layers, 
  Download, 
  ChevronRight, 
  Printer, 
  RefreshCw 
} from 'lucide-react';

interface SalaryAnalyzerProps {
  user: User;
  token: string | null;
  comparison: ComparisonResult | null;
  onRefreshProfile: (updatedUser: User) => void;
}

export default function SalaryAnalyzer({ user, token, comparison, onRefreshProfile }: SalaryAnalyzerProps) {
  // Store form elements matching User profile salary state
  const [basic, setBasic] = useState(user.profile.salary.basic);
  const [hra, setHra] = useState(user.profile.salary.hra);
  const [specialAllowance, setSpecialAllowance] = useState(user.profile.salary.specialAllowance);
  const [lta, setLta] = useState(user.profile.salary.lta);
  const [bonus, setBonus] = useState(user.profile.salary.bonus);
  const [employerPf, setEmployerPf] = useState(user.profile.salary.employerPf);
  const [professionalTax, setProfessionalTax] = useState(user.profile.salary.professionalTax);
  const [otherComponents, setOtherComponents] = useState(user.profile.salary.otherComponents);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const totalCTC = basic + hra + specialAllowance + lta + bonus + employerPf + otherComponents;

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: SalaryStructure = {
        basic: Number(basic),
        hra: Number(hra),
        specialAllowance: Number(specialAllowance),
        lta: Number(lta),
        bonus: Number(bonus),
        employerPf: Number(employerPf),
        professionalTax: Number(professionalTax),
        otherComponents: Number(otherComponents)
      };

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ salary: payload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onRefreshProfile(data.user);
      alert('Salary structure saved and tax calculations updated successfully!');
    } catch (err: any) {
      alert(`Failed to save salary configuration: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    setExporting(type);
    
    // Simulate generation and download
    setTimeout(() => {
      setExporting(null);
      
      // Setup mock content download
      const reportHeaders = ["Salary Component", "Valuation (INR)"];
      const reportRows = [
        ["Basic Pay", basic],
        ["HRA", hra],
        ["Special Allowance", specialAllowance],
        ["LTA", lta],
        ["Bonus", bonus],
        ["Employer PF", employerPf],
        ["Professional Tax", professionalTax],
        ["Other Components", otherComponents],
        ["Total Cost to Company (CTC)", totalCTC]
      ];
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += reportHeaders.join(",") + "\n";
      reportRows.forEach(row => {
        csvContent += row.join(",") + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Salary_Tax_Report_${user.name.replace(/\s+/g, '_')}.${type === 'excel' ? 'csv' : 'txt'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  if (!comparison) return null;

  const { oldRegime, newRegime, recommendedRegime, netSavings, hraExemption } = comparison;

  return (
    <div id="salary_analyzer" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* 1/3 Left Form: Edit Components */}
      <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-5 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" /> Structure Salary Breakdown
        </h3>

        <form onSubmit={handleSaveSalary} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
                <span>Basic Salary (Annual)</span>
                <span className="font-bold text-slate-755">₹{basic.toLocaleString('en-IN')}</span>
              </label>
              <input
                id="salary_input_basic"
                type="number"
                value={basic}
                onChange={(e) => setBasic(Number(e.target.value))}
                required
                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
              />
            </div>

            <div>
              <label className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-bold text-slate-755">₹{hra.toLocaleString('en-IN')}</span>
              </label>
              <input
                id="salary_input_hra"
                type="number"
                value={hra}
                onChange={(e) => setHra(Number(e.target.value))}
                required
                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
              />
            </div>

            <div>
              <label className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
                <span>Special Allowance (Annual)</span>
                <span className="font-bold text-slate-755">₹{specialAllowance.toLocaleString('en-IN')}</span>
              </label>
              <input
                id="salary_input_special"
                type="number"
                value={specialAllowance}
                onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">LTA (Annual)</label>
                <input
                  id="salary_input_lta"
                  type="number"
                  value={lta}
                  onChange={(e) => setLta(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Bonus / Commissions</label>
                <input
                  id="salary_input_bonus"
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employer PF Contribution</label>
                <input
                  id="salary_input_pf"
                  type="number"
                  value={employerPf}
                  onChange={(e) => setEmployerPf(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Professional Tax</label>
                <input
                  id="salary_input_proftax"
                  type="number"
                  value={professionalTax}
                  onChange={(e) => setProfessionalTax(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Other Earnings / Incentives</label>
              <input
                id="salary_input_other"
                type="number"
                value={otherComponents}
                onChange={(e) => setOtherComponents(Number(e.target.value))}
                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2 rounded-xl transition-colors focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="salary_btn_submit"
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-colors shadow-sm shadow-indigo-150 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>Recalculate Savings Calibration</>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
          <span className="font-medium text-slate-500">Gross Wage Profile (CTC):</span>
          <span className="font-bold text-slate-800">₹{totalCTC.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 2/3 Right Panels: Comparison & Table Breakdown */}
      <div className="xl:col-span-2 space-y-6">
        {/* Export Buttons bar */}
        <div className="flex justify-between items-center bg-white rounded-2xl border border-slate-100 px-6 py-4 shadow-sm">
          <div>
            <h4 className="font-bold text-sm text-slate-800">Analytical Tax Report</h4>
            <p className="text-[10px] text-slate-400">Save structured salary calculations instantly</p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn_export_xls"
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs text-slate-650 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting === 'excel' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              id="btn_export_pdf"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 rounded-xl text-xs text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              {exporting === 'pdf' ? 'Preparing...' : 'PDF Report'}
            </button>
          </div>
        </div>

        {/* Side-by-side slabs breakdown breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-slate-800 border-b border-slate-50 pb-3 mb-5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> Slabs Taxation Breakdowns
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime Slabs breakdown */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Old Slabs Breakdown</h4>
                <span className="text-[10px] text-slate-400 font-semibold">(FY 2025-26)</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {oldRegime.slabsBreakdown.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50/50 rounded-lg text-xs">
                    <span className="text-slate-500 font-medium">{b.slab}</span>
                    <div className="text-right">
                      <div className="font-bold text-slate-705">₹{Math.round(b.taxInSlab).toLocaleString('en-IN')}</div>
                      <div className="text-[9px] text-slate-400">on ₹{Math.round(b.taxableInSlab).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Subtotal Slabs Tax:</span>
                <span className="font-bold text-slate-800">
                  ₹{Math.round(oldRegime.baseTax).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* New Regime Slabs breakdown */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">New Slabs Breakdown</h4>
                <span className="text-[10px] text-slate-400 font-semibold">(FY 2025-26 Standard)</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {newRegime.slabsBreakdown.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50/50 rounded-lg text-xs">
                    <span className="text-slate-500 font-medium">{b.slab}</span>
                    <div className="text-right">
                      <div className="font-bold text-slate-705">₹{Math.round(b.taxInSlab).toLocaleString('en-IN')}</div>
                      <div className="text-[9px] text-slate-400">on ₹{Math.round(b.taxableInSlab).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Subtotal Slabs Tax:</span>
                <span className="font-bold text-slate-800">
                  ₹{Math.round(newRegime.baseTax).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h4 className="font-semibold text-slate-800 text-sm">Regime Side-by-Side Tax Computation</h4>
          </div>
          <div className="overflow-x-auto">
            <table id="table_salary_breakdown" className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-405 font-semibold text-[10px] uppercase border-b border-slate-100">
                  <th className="px-6 py-3.5">Tax Calculation Flow</th>
                  <th className="px-6 py-3.5">Old Tax Regime</th>
                  <th className="px-6 py-3.5">New Tax Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="px-6 py-4">Total CTC Gross Salary</td>
                  <td className="px-6 py-4">₹{totalCTC.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">₹{totalCTC.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-emerald-600">Standard Deduction Limit</td>
                  <td className="px-6 py-4 text-emerald-600">-₹{oldRegime.grossSalary >= 50000 ? '50,000' : '0'}</td>
                  <td className="px-6 py-4 text-emerald-600">-₹{newRegime.grossSalary >= 75000 ? '75,000' : '0'}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-emerald-600">HRA Tax Exemption Sec 10(13A)</td>
                  <td className="px-6 py-4 text-emerald-600">-₹{Math.round(hraExemption).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-emerald-600">₹0 (Not Permitted)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-emerald-600">Declared Investment Deductions (Sec 80C, 80D, etc)</td>
                  <td className="px-6 py-4 text-emerald-600">
                    -₹{Math.max(0, Math.round(oldRegime.exemptionsAndDeductions - 50000 - hraExemption)).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-emerald-600">₹0 (Not Permitted)</td>
                </tr>
                <tr className="bg-slate-50/20 font-bold text-slate-800">
                  <td className="px-6 py-4">Net Taxable Income wages</td>
                  <td className="px-6 py-4">₹{Math.round(oldRegime.taxableIncome).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">₹{Math.round(newRegime.taxableIncome).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Base Tax (Post Sec 87A Rebates)</td>
                  <td className="px-6 py-4">₹{Math.round(oldRegime.baseTax).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">₹{Math.round(newRegime.baseTax).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Health & Education Cess (4%)</td>
                  <td className="px-6 py-3.5">₹{Math.round(oldRegime.cess).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3.5">₹{Math.round(newRegime.cess).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-indigo-50/20 font-extrabold text-slate-900 border-t border-slate-200">
                  <td className="px-6 py-4 text-indigo-700">Total Tax Payable (Cess Included)</td>
                  <td className="px-6 py-4">₹{Math.round(oldRegime.totalTax).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">₹{Math.round(newRegime.totalTax).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
