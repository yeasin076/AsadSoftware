import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiChevronDown, FiChevronUp,
  FiAlertCircle, FiTrendingUp, FiTrendingDown, FiActivity
} from 'react-icons/fi';

const INV_CATEGORIES = ['General', 'Stock Purchase', 'Equipment', 'Marketing', 'Real Estate', 'Other'];

const fmt = (val) => parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [returns, setReturns] = useState({});        // { investmentId: [...] }
  const [returnsLoading, setReturnsLoading] = useState({});
  const [deleteInvId, setDeleteInvId] = useState(null);
  const [deleteRetId, setDeleteRetId] = useState(null);

  // Forms
  const today = new Date().toISOString().split('T')[0];
  const emptyInv = { title: '', invested_amount: '', category: 'General', investment_date: today, description: '' };
  const emptyRet = { revenue_amount: '', return_date: today, notes: '' };
  const [invForm, setInvForm] = useState(emptyInv);
  const [retForms, setRetForms] = useState({});       // { investmentId: formData }
  const [showRetForm, setShowRetForm] = useState({}); // { investmentId: bool }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchInvestments(); }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/investments');
      setInvestments(res.data.data);
    } catch {
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async (id) => {
    try {
      setReturnsLoading(prev => ({ ...prev, [id]: true }));
      const res = await api.get(`/investments/${id}/returns`);
      setReturns(prev => ({ ...prev, [id]: res.data.data }));
    } catch {
      toast.error('Failed to load revenue entries');
    } finally {
      setReturnsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!returns[id]) fetchReturns(id);
    }
  };

  // ── Add Investment ──────────────────────────────────────────────
  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!invForm.title || !invForm.invested_amount || !invForm.investment_date) {
      toast.error('Title, amount and date are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/investments', invForm);
      toast.success('Investment added!');
      setInvForm(emptyInv);
      setShowAddForm(false);
      fetchInvestments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add investment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Investment ───────────────────────────────────────────
  const handleDeleteInvestment = async (id) => {
    try {
      await api.delete(`/investments/${id}`);
      toast.success('Investment deleted');
      setDeleteInvId(null);
      setInvestments(prev => prev.filter(i => i.id !== id));
      const newReturns = { ...returns };
      delete newReturns[id];
      setReturns(newReturns);
    } catch {
      toast.error('Failed to delete investment');
    }
  };

  // ── Add Revenue ─────────────────────────────────────────────────
  const handleAddReturn = async (e, invId) => {
    e.preventDefault();
    const form = retForms[invId] || emptyRet;
    if (!form.revenue_amount || !form.return_date) {
      toast.error('Amount and date are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/investments/${invId}/returns`, form);
      toast.success('Revenue added!');
      setRetForms(prev => ({ ...prev, [invId]: emptyRet }));
      setShowRetForm(prev => ({ ...prev, [invId]: false }));
      await fetchReturns(invId);
      fetchInvestments(); // refresh totals
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add revenue');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Revenue ──────────────────────────────────────────────
  const handleDeleteReturn = async (retId, invId) => {
    try {
      await api.delete(`/investments/returns/${retId}`);
      toast.success('Revenue entry deleted');
      setDeleteRetId(null);
      setReturns(prev => ({ ...prev, [invId]: (prev[invId] || []).filter(r => r.id !== retId) }));
      fetchInvestments();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  // ── Status Toggle ───────────────────────────────────────────────
  const toggleStatus = async (inv) => {
    const newStatus = inv.status === 'Active' ? 'Closed' : 'Active';
    try {
      await api.patch(`/investments/${inv.id}/status`, { status: newStatus });
      setInvestments(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i));
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Summary ─────────────────────────────────────────────────────
  const totalInvested = investments.reduce((s, i) => s + parseFloat(i.invested_amount || 0), 0);
  const totalRevenue  = investments.reduce((s, i) => s + parseFloat(i.total_revenue || 0), 0);
  const totalProfit   = totalRevenue - totalInvested;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Investment Tracker</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus size={18} />
          <span>Add Investment</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-gray-600 font-medium">Total Invested</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">৳{fmt(totalInvested)}</p>
          <p className="text-xs text-gray-500 mt-1">{investments.length} investment(s)</p>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">৳{fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">All returns combined</p>
        </div>
        <div className={`card border ${totalProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-gray-600 font-medium">Net Profit</p>
          <p className={`text-3xl font-bold mt-2 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ৳{fmt(totalProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Revenue − Invested</p>
        </div>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Investment</h3>
          <form onSubmit={handleAddInvestment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Title *</label>
              <input
                type="text"
                placeholder="e.g. Samsung Stock Purchase"
                value={invForm.title}
                onChange={(e) => setInvForm({ ...invForm, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invested Amount (৳) *</label>
              <input
                type="number"
                placeholder="0.00"
                value={invForm.invested_amount}
                onChange={(e) => setInvForm({ ...invForm, invested_amount: e.target.value })}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={invForm.category}
                onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                className="input-field"
              >
                {INV_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Date *</label>
              <input
                type="date"
                value={invForm.investment_date}
                onChange={(e) => setInvForm({ ...invForm, investment_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                placeholder="Details about this investment..."
                value={invForm.description}
                onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                className="input-field resize-none"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Investment'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setInvForm(emptyInv); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Investments List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : investments.length === 0 ? (
        <div className="card text-center py-16">
          <FiActivity size={52} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No investments yet</p>
          <button onClick={() => setShowAddForm(true)} className="mt-3 text-primary-600 hover:underline text-sm font-medium">
            + Add your first investment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => {
            const profit = parseFloat(inv.total_profit || 0);
            const revenue = parseFloat(inv.total_revenue || 0);
            const invested = parseFloat(inv.invested_amount || 0);
            const roi = invested > 0 ? ((profit / invested) * 100).toFixed(1) : '0.0';
            const isExpanded = expandedId === inv.id;
            const invReturns = returns[inv.id] || [];

            return (
              <div key={inv.id} className="card border border-gray-200 p-0 overflow-hidden">

                {/* Investment Header */}
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{inv.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          inv.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {inv.status}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{inv.category}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(inv.investment_date).toLocaleDateString('en-GB')}
                        {inv.description && <span className="ml-2 italic">{inv.description}</span>}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(inv)}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        Mark {inv.status === 'Active' ? 'Closed' : 'Active'}
                      </button>
                      {deleteInvId === inv.id ? (
                        <div className="flex items-center space-x-1">
                          <FiAlertCircle size={14} className="text-red-500" />
                          <span className="text-xs text-red-600">Sure?</span>
                          <button onClick={() => handleDeleteInvestment(inv.id)} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                          <button onClick={() => setDeleteInvId(null)} className="text-xs text-gray-500 hover:underline">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteInvId(inv.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Invested</p>
                      <p className="text-base font-bold text-blue-600">৳{fmt(invested)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Revenue</p>
                      <p className="text-base font-bold text-green-600">৳{fmt(revenue)}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <p className="text-xs text-gray-500 mb-0.5">Profit</p>
                      <div className={`flex items-center justify-center space-x-1 ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profit >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                        <p className="text-base font-bold">৳{fmt(Math.abs(profit))}</p>
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${parseFloat(roi) >= 0 ? 'bg-purple-50' : 'bg-orange-50'}`}>
                      <p className="text-xs text-gray-500 mb-0.5">ROI</p>
                      <p className={`text-base font-bold ${parseFloat(roi) >= 0 ? 'text-purple-600' : 'text-orange-500'}`}>
                        {roi}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => toggleExpand(inv.id)}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
                  >
                    <span>{isExpanded ? 'Hide Revenue Entries' : `View Revenue Entries${invReturns.length ? ` (${invReturns.length})` : ''}`}</span>
                    {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded: Revenue Entries */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">

                    {/* Add Revenue Button / Form */}
                    {!showRetForm[inv.id] ? (
                      <button
                        onClick={() => {
                          setShowRetForm(prev => ({ ...prev, [inv.id]: true }));
                          setRetForms(prev => ({ ...prev, [inv.id]: { ...emptyRet } }));
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <FiPlus size={15} />
                        <span>Add Revenue Entry</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => handleAddReturn(e, inv.id)}
                        className="bg-white border border-green-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Amount (৳) *</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={retForms[inv.id]?.revenue_amount || ''}
                            onChange={(e) => setRetForms(prev => ({ ...prev, [inv.id]: { ...prev[inv.id], revenue_amount: e.target.value } }))}
                            className="input-field text-sm"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                          <input
                            type="date"
                            value={retForms[inv.id]?.return_date || today}
                            onChange={(e) => setRetForms(prev => ({ ...prev, [inv.id]: { ...prev[inv.id], return_date: e.target.value } }))}
                            className="input-field text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                          <input
                            type="text"
                            placeholder="Description..."
                            value={retForms[inv.id]?.notes || ''}
                            onChange={(e) => setRetForms(prev => ({ ...prev, [inv.id]: { ...prev[inv.id], notes: e.target.value } }))}
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="sm:col-span-3 flex space-x-2">
                          <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Save Revenue'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRetForm(prev => ({ ...prev, [inv.id]: false }))}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Revenue Table */}
                    {returnsLoading[inv.id] ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                      </div>
                    ) : invReturns.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">No revenue entries yet</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {invReturns.map((ret, idx) => (
                              <tr key={ret.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                  {new Date(ret.return_date).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">
                                  ৳{fmt(ret.revenue_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{ret.notes || '-'}</td>
                                <td className="px-4 py-3">
                                  {deleteRetId === ret.id ? (
                                    <div className="flex items-center space-x-1">
                                      <FiAlertCircle size={12} className="text-red-500" />
                                      <span className="text-xs text-red-600">Sure?</span>
                                      <button onClick={() => handleDeleteReturn(ret.id, inv.id)} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                                      <button onClick={() => setDeleteRetId(null)} className="text-xs text-gray-500 hover:underline">No</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setDeleteRetId(ret.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                      <FiTrash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {/* Subtotal row */}
                            <tr className="bg-green-50 font-semibold">
                              <td colSpan={2} className="px-4 py-3 text-sm text-gray-700">Total Revenue</td>
                              <td className="px-4 py-3 text-sm text-green-700">
                                ৳{fmt(invReturns.reduce((s, r) => s + parseFloat(r.revenue_amount || 0), 0))}
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Next Investment CTA */}
          <button
            onClick={() => { setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-full border-2 border-dashed border-primary-300 rounded-xl py-4 text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <FiPlus size={20} />
            <span>Add Next Investment</span>
          </button>
        </div>
      )}
    </div>
  );
}
