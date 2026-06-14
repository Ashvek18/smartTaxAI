import React, { useState, useEffect } from 'react';
import { User, InvestmentProduct, AuditLog, TaxSlab } from '../types';
import { 
  LockKeyhole, 
  Trash2, 
  Plus, 
  Settings, 
  History, 
  Users, 
  TrendingUp, 
  HelpCircle,
  AlertOctagon,
  Globe,
  PlusCircle,
  Loader2
} from 'lucide-react';

interface AdminPanelProps {
  user: User;
  token: string | null;
}

export default function AdminPanel({ user, token }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'slabs' | 'products' | 'logs' | 'users'>('slabs');
  
  // Slabs state
  const [oldStdDeduct, setOldStdDeduct] = useState(50000);
  const [newStdDeduct, setNewStdDeduct] = useState(75000);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Products state
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'ELSS' | 'PPF' | 'NPS' | 'EPF' | 'FD' | 'SIP' | 'Health Insurance'>('ELSS');
  const [newProdReturns, setNewProdReturns] = useState(8);
  const [newProdLockIn, setNewProdLockIn] = useState('3 Years');
  const [newProdRisk, setNewProdRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newProdBenefit, setNewProdBenefit] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Audit Logs & Users Directory
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchSlabConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOldStdDeduct(data.standardDeductionOld);
        setNewStdDeduct(data.standardDeductionNew);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUserList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'slabs') fetchSlabConfig();
    else if (activeSubTab === 'products') fetchProducts();
    else if (activeSubTab === 'logs') fetchAuditLogs();
    else if (activeSubTab === 'users') fetchUsers();
  }, [activeSubTab]);

  const handleUpdateSlabs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          standardDeductionOld: Number(oldStdDeduct),
          standardDeductionNew: Number(newStdDeduct)
        })
      });
      if (res.ok) {
        alert('Global standard deduction configurations saved successfully.');
      }
    } catch (e) {
      alert('Error updating configuration.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdBenefit) return;
    setSavingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProdName,
          category: newProdCategory,
          expectedReturns: Number(newProdReturns),
          lockInValue: newProdLockIn,
          riskLevel: newProdRisk,
          taxBenefits: newProdBenefit,
          description: newProdDesc
        })
      });

      if (res.ok) {
        setNewProdName('');
        setNewProdBenefit('');
        setNewProdDesc('');
        fetchProducts();
        alert('Investment product added to catalog successfully!');
      }
    } catch (e) {
       console.error(e);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this investment product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchProducts();
    } catch (e) {
       console.error(e);
    }
  };

  return (
    <div id="admin_console" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[500px] space-y-6">
      {/* Header section console */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-50 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl">
            <LockKeyhole className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">SmartTaxAI Global Console</h3>
            <p className="text-xs text-slate-400">Manage tax parameters and audit security operations</p>
          </div>
        </div>

        {/* Sub tab select */}
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'slabs', name: 'IT Slabs Calibration', icon: Settings },
            { id: 'products', name: 'Products Database', icon: TrendingUp },
            { id: 'logs', name: 'Audit Logs Directory', icon: History },
            { id: 'users', name: 'User Directory', icon: Users }
          ] as const).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                id={`admin_subtab_${t.id}`}
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  activeSubTab === t.id 
                    ? 'bg-slate-900 border border-slate-900 text-white' 
                    : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub Tab Body render */}
      <div id="admin_subtab_body">
        {/* TAB 1: Slabs Configuration */}
        {activeSubTab === 'slabs' && (
          <div className="space-y-6 max-w-xl">
            <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Calibrate Standard Deductions</h4>
            
            {loadingConfig ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> Loading config...
              </div>
            ) : (
              <form onSubmit={handleUpdateSlabs} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1.5">Old Regime Standard Deduction</label>
                    <input
                      id="admin_old_std_ded"
                      type="number"
                      value={oldStdDeduct}
                      onChange={(e) => setOldStdDeduct(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1.5">New Regime Standard Deduction</label>
                    <input
                      id="admin_new_std_ded"
                      type="number"
                      value={newStdDeduct}
                      onChange={(e) => setNewStdDeduct(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal">
                  <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Important System Notice:</strong> Modifying global deductions parameters impacts calculations globally for all registered users across old and new tax estimations. Proceed with caution.
                  </div>
                </div>

                <button
                  id="admin_btn_save_slabs"
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Standard Deductions
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Products Database */}
        {activeSubTab === 'products' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
            {/* Create product form */}
            <form onSubmit={handleCreateProduct} className="xl:col-span-1 pr-0 xl:pr-6 border-r border-slate-100 space-y-4">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Register New Investment Scheme</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Scheme Title</label>
                  <input
                    id="admin_prod_name"
                    type="text"
                    required
                    placeholder="e.g. HDFC Tax Shield Fund"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-indigo-505 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 mb-1">Asset Class</label>
                    <select
                      id="admin_prod_cat"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 px-2 py-2.5 rounded-xl bg-white"
                    >
                      <option value="ELSS">ELSS Mutual Fund</option>
                      <option value="PPF">PPF Account</option>
                      <option value="NPS">Pension fund</option>
                      <option value="FD">Bank FDs</option>
                      <option value="SIP">SIPS Equities</option>
                      <option value="Health Insurance">Health Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 mb-1">Expected returns (%)</label>
                    <input
                      id="admin_prod_returns"
                      type="number"
                      required
                      min="0"
                      max="40"
                      value={newProdReturns}
                      onChange={(e) => setNewProdReturns(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 px-2 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 mb-1">Lock-In Period</label>
                    <input
                      id="admin_prod_lock"
                      type="text"
                      required
                      placeholder="e.g. 3 Years"
                      value={newProdLockIn}
                      onChange={(e) => setNewProdLockIn(e.target.value)}
                      className="w-full text-xs border border-slate-200 px-2 py-2 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-550 mb-1">Risk Rating</label>
                    <select
                      id="admin_prod_risk"
                      value={newProdRisk}
                      onChange={(e) => setNewProdRisk(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 px-2 py-2.5 rounded-xl bg-white"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Approved Tax Benefit Description</label>
                  <input
                    id="admin_prod_benefit"
                    type="text"
                    required
                    placeholder="e.g. Exemption under 80C up to ₹1.5L"
                    value={newProdBenefit}
                    onChange={(e) => setNewProdBenefit(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">General Description</label>
                  <textarea
                    id="admin_prod_desc"
                    rows={2}
                    placeholder="Short description of scheme goals"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  ></textarea>
                </div>
              </div>

              <button
                id="admin_prod_btn_submit"
                type="submit"
                disabled={savingProduct}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Add product to Catalog
              </button>
            </form>

            {/* List products catalog */}
            <div className="xl:col-span-2 space-y-4 h-[420px] overflow-y-auto">
              <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Registered Schemes list</h4>
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-755 block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{p.category} | Expected Returns: {p.expectedReturns}% CAGR | Lock: {p.lockInValue}</span>
                    </div>
                    <button
                      id={`btn_delete_product_${p.id}`}
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Audit Logs */}
        {activeSubTab === 'logs' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Global System Actions audit logs</h4>
            
            {loadingLogs ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> Pulling security log registers...
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                <table id="table_audit_logs" className="w-full text-left font-medium text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-405 font-bold uppercase tracking-wider text-[9px] border-b border-slate-105">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User Email</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-800 font-semibold">{log.userEmail}</td>
                        <td className="px-4 py-3 text-indigo-600 font-bold">{log.action}</td>
                        <td className="px-4 py-3">{log.details}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No security audit records logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: User Directory */}
        {activeSubTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-bold text-xs text-slate-405 uppercase tracking-wide">Registered Sandbox directory</h4>

            {loadingUsers ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> Pulling member indexes...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userList.map(u => (
                  <div key={u.id} className="p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold block text-slate-800 text-xs">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-650 border border-indigo-100'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase text-[8px]">Basic wage:</span>
                        ₹{u.profile.salary.basic.toLocaleString('en-IN')}
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase text-[8px]">Risk Appetite:</span>
                        {u.profile.riskAppetite.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
