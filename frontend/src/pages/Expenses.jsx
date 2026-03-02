import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiCalendar, FiTrendingUp, FiDollarSign, FiPlus, FiTrash2, FiAlertCircle, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const CATEGORIES = ['General', 'Rent', 'Salary', 'Electricity', 'Transport', 'Marketing', 'Maintenance', 'Other'];

const Expenses = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    date: today,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'General',
    expense_date: today,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const buildParams = () => {
    if (activeTab === 'daily') return `type=daily&date=${filters.date}`;
    if (activeTab === 'monthly') return `type=monthly&month=${filters.month}&year=${filters.year}`;
    return `type=yearly&year=${filters.year}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const [summaryRes, expensesRes] = await Promise.all([
        api.get(`/expenses/summary?${params}`),
        api.get(`/expenses?${params}`)
      ]);
      setSummary(summaryRes.data.data);
      setExpenses(expensesRes.data.data.expenses);
    } catch (error) {
      toast.error('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.expense_date) {
      toast.error('Title, amount and date are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/expenses', form);
      toast.success('Expense added successfully');
      setForm({ title: '', amount: '', category: 'General', expense_date: today, notes: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setDeleteId(null);
    setEditForm({
      title:        exp.title,
      amount:       parseFloat(exp.amount),
      category:     exp.category,
      expense_date: exp.expense_date.split('T')[0],
      notes:        exp.notes || ''
    });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const handleUpdate = async (id) => {
    if (!editForm.title || !editForm.amount || !editForm.expense_date) {
      toast.error('Title, amount and date are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`/expenses/${id}`, editForm);
      toast.success('Expense updated');
      setEditId(null);
      setEditForm({});
      fetchData();
    } catch (error) {
      toast.error('Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'daily', label: 'Daily', icon: FiCalendar },
    { id: 'monthly', label: 'Monthly', icon: FiTrendingUp },
    { id: 'yearly', label: 'Yearly', icon: FiDollarSign }
  ];

  const netColor = summary && parseFloat(summary.netProfit) >= 0 ? 'text-green-600' : 'text-red-600';
  const netBg = summary && parseFloat(summary.netProfit) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Expense</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g. Shop Rent"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Additional details..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        {activeTab === 'daily' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="input-field max-w-xs"
            />
          </div>
        )}
        {activeTab === 'monthly' && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="input-field"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'yearly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="input-field max-w-xs"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-purple-50 border border-purple-200">
                <p className="text-sm text-gray-600 font-medium">Sales Profit</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">৳{summary.totalProfit}</p>
                <p className="text-xs text-gray-500 mt-1">From phone sales</p>
              </div>
              <div className="card bg-red-50 border border-red-200">
                <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-red-500 mt-2">৳{summary.totalExpense}</p>
                <p className="text-xs text-gray-500 mt-1">All expenses combined</p>
              </div>
              <div className={`card border ${netBg}`}>
                <p className="text-sm text-gray-600 font-medium">Net Profit</p>
                <p className={`text-3xl font-bold mt-2 ${netColor}`}>৳{summary.netProfit}</p>
                <p className="text-xs text-gray-500 mt-1">Profit after expenses</p>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Expenses List
              {expenses.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">({expenses.length} entries)</span>
              )}
            </h3>

            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <FiDollarSign size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No expenses recorded for this period</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-primary-600 hover:underline text-sm font-medium"
                >
                  + Add first expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((exp) => (
                      editId === exp.id ? (
                        /* ── Inline Edit Row ── */
                        <tr key={exp.id} className="bg-yellow-50">
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={editForm.expense_date}
                              onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                              className="input-field text-sm py-1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="input-field text-sm py-1"
                              placeholder="Title"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="input-field text-sm py-1"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="input-field text-sm py-1"
                              placeholder="Notes"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="input-field text-sm py-1 w-28"
                              min="0" step="0.01"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUpdate(exp.id)}
                                disabled={submitting}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Save"
                              >
                                <FiCheck size={17} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Cancel"
                              >
                                <FiX size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        /* ── Normal Row ── */
                        <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exp.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {exp.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">
                          ৳{parseFloat(exp.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {deleteId === exp.id ? (
                            <div className="flex items-center space-x-2">
                              <FiAlertCircle size={14} className="text-red-500" />
                              <span className="text-xs text-red-600">Sure?</span>
                              <button
                                onClick={() => handleDelete(exp.id)}
                                className="text-xs text-red-600 font-semibold hover:underline"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => startEdit(exp)}
                                className="text-blue-400 hover:text-blue-600 transition-colors"
                                title="Edit expense"
                              >
                                <FiEdit2 size={15} />
                              </button>
                              <button
                                onClick={() => { setDeleteId(exp.id); setEditId(null); }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Delete expense"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Expenses;
