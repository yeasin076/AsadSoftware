import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiEye, FiPrinter, FiFileText,
  FiAlertCircle, FiX, FiShoppingBag, FiDownload
} from 'react-icons/fi';

const SHOP_NAME    = "APPLE HQ";
const SHOP_SLOGAN  = "Where Luxury Meets Technology";
const SHOP_ADDRESS = 'Head office: 20, Sobujbag, Sobujbag Thana, Basabo, Dhaka -1214';
const SHOP_PHONE   = '01410959634';

const emptyItem = { description: '', quantity: 1, unit_price: '' };

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashMemo() {
  const [memos, setMemos]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [viewMemo, setViewMemo]       = useState(null);   // full memo object
  const [viewLoading, setViewLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const printRef = useRef();

  // Manual form state
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    memo_date: today,
    notes: '',
    items: [{ ...emptyItem }]
  });

  useEffect(() => { fetchMemos(); }, []);

  const fetchMemos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cashmemo');
      setMemos(res.data.data);
    } catch { toast.error('Failed to load memos'); }
    finally { setLoading(false); }
  };

  const openMemo = async (id) => {
    try {
      setViewLoading(true);
      const res = await api.get(`/cashmemo/${id}`);
      setViewMemo(res.data.data);
    } catch { toast.error('Failed to load memo'); }
    finally { setViewLoading(false); }
  };

  // ── Items management ─────────────────────────────────────────────
  const setItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };
  const addItem    = ()      => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx)   => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const totalAmount = form.items.reduce(
    (s, i) => s + (parseFloat(i.quantity || 1) * parseFloat(i.unit_price || 0)), 0
  );

  // ── Submit manual memo ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasEmpty = form.items.some(i => !i.description || !i.unit_price);
    if (hasEmpty) { toast.error('Please fill all item fields'); return; }
    try {
      setSubmitting(true);
      const res = await api.post('/cashmemo', form);
      toast.success(`Memo ${res.data.data.memo_number} created!`);
      setForm({ customer_name: '', customer_phone: '', memo_date: today, notes: '', items: [{ ...emptyItem }] });
      setShowForm(false);
      await fetchMemos();
      // Auto-open the newly created memo
      openMemo(res.data.data.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create memo');
    } finally { setSubmitting(false); }
  };

  // ── Delete memo ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/cashmemo/${id}`);
      toast.success('Memo deleted');
      setDeleteId(null);
      setMemos(prev => prev.filter(m => m.id !== id));
      if (viewMemo?.id === id) setViewMemo(null);
    } catch { toast.error('Failed to delete memo'); }
  };

  // ── Print ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=700,height=900');
    win.document.write(`
      <html><head><title>Cash Memo</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color:#111; padding:20px; }
        .memo-wrap { max-width:620px; margin:0 auto; border:1px solid #ddd; padding:24px; }
        .shop-header { text-align:center; border-bottom:2px solid #1e3a5f; padding-bottom:12px; margin-bottom:16px; }
        .shop-name { font-size:22px; font-weight:700; color:#1e3a5f; }
        .shop-slogan { font-size:11px; font-style:italic; color:#6b7280; margin-top:2px; }
        .shop-sub  { font-size:12px; color:#555; margin-top:2px; }
        .memo-meta { display:flex; justify-content:space-between; margin-bottom:14px; font-size:12px; }
        .memo-meta div { line-height:1.7; }
        .label { font-weight:600; color:#444; }
        table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        th { background:#1e3a5f; color:#fff; padding:8px 10px; text-align:left; font-size:12px; }
        td { padding:7px 10px; border-bottom:1px solid #e5e7eb; font-size:12px; }
        td.num { text-align:right; }
        .total-row td { font-weight:700; font-size:13px; border-top:2px solid #1e3a5f; }
        .footer { margin-top:24px; display:flex; justify-content:space-between; padding-top:12px; border-top:1px dashed #ccc; font-size:11px; color:#666; }
        .sig-line { margin-top:30px; border-top:1px solid #555; padding-top:4px; text-align:center; width:140px; }
        .type-badge { display:inline-block; font-size:10px; font-weight:600; color:#374151; }
        .notes { font-size:11px; color:#555; margin-bottom:12px; }
        @media print { body{padding:0;} .memo-wrap{border:none;} }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  // ── Download PDF ─────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      const opt = {
        margin:      [8, 8, 8, 8],
        filename:    `${viewMemo.memo_number}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  // ── Render memo content (for modal + print) ──────────────────────
  const MemoContent = ({ memo }) => {
    if (!memo) return null;
    const items = memo.items || [];
    const itemTotal = items.reduce(
      (s, i) => s + (parseInt(i.quantity) * parseFloat(i.unit_price)), 0
    );
    return (
      <div className="memo-wrap">
        {/* Shop header */}
        <div className="shop-header">
          <div className="shop-name">{SHOP_NAME}</div>
          <div className="shop-slogan">{SHOP_SLOGAN}</div>
          <div className="shop-sub">{SHOP_ADDRESS} &nbsp;|&nbsp; {SHOP_PHONE}</div>
        </div>

        {/* Memo meta */}
        <div className="memo-meta">
          <div>
            <div><span className="label">Memo No:</span> {memo.memo_number}</div>
            <div><span className="label">Date:</span> {new Date(memo.memo_date).toLocaleDateString('en-GB')}</div>
            <div><span className="label">Type:</span> <span className="type-badge">{memo.type === 'sale' ? 'Phone Sell' : 'Manual'}</span></div>
          </div>
          <div>
            <div><span className="label">Customer:</span> {memo.customer_name}</div>
            {memo.customer_phone && <div><span className="label">Phone:</span> {memo.customer_phone}</div>}
          </div>
        </div>

        {/* Items */}
        <table>
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>Description</th>
              <th style={{ width: 50, textAlign: 'right' }}>Qty</th>
              <th style={{ width: 100, textAlign: 'right' }}>Unit Price</th>
              <th style={{ width: 110, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td>{idx + 1}</td>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">৳{fmt(item.unit_price)}</td>
                <td className="num">৳{fmt(parseInt(item.quantity) * parseFloat(item.unit_price))}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={4} style={{ textAlign: 'right' }}>Grand Total</td>
              <td className="num">৳{fmt(itemTotal)}</td>
            </tr>
          </tbody>
        </table>

        {memo.notes && <div className="notes">Note: {memo.notes}</div>}

        {/* Footer + signature */}
        <div className="footer">
          <div>Thank you for your purchase!</div>
          <div className="sig-line">Authorized Signature</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Print styles inserted into page head (invisible) */}
      <style>{`
        .memo-wrap { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; }
        .shop-header { text-align:center; border-bottom:2px solid #1e3a5f; padding-bottom:12px; margin-bottom:16px; }
        .shop-name { font-size:22px; font-weight:700; color:#1e3a5f; }
        .shop-slogan { font-size:11px; font-style:italic; color:#6b7280; margin-top:2px; }
        .shop-sub  { font-size:12px; color:#555; margin-top:2px; }
        .memo-meta { display:flex; justify-content:space-between; margin-bottom:14px; font-size:12px; }
        .memo-meta div { line-height:1.8; }
        .label { font-weight:600; color:#444; margin-right:4px; }
        .memo-wrap table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        .memo-wrap th { background:#1e3a5f; color:#fff; padding:8px 10px; text-align:left; font-size:12px; }
        .memo-wrap td { padding:7px 10px; border-bottom:1px solid #e5e7eb; font-size:12px; }
        .memo-wrap td.num { text-align:right; }
        .total-row td { font-weight:700; font-size:13px; border-top:2px solid #1e3a5f !important; }
        .footer { margin-top:20px; display:flex; justify-content:space-between; padding-top:12px; border-top:1px dashed #ccc; font-size:11px; color:#666; }
        .sig-line { margin-top:30px; border-top:1px solid #555; padding-top:4px; text-align:center; width:140px; font-size:11px; }
        .type-badge { display:inline-block; font-size:10px; font-weight:600; color:#374151; }
        .notes { font-size:11px; color:#555; margin-bottom:12px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cash Memo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus size={18} />
          <span>New Manual Memo</span>
        </button>
      </div>

      {/* Manual Memo Form */}
      {showForm && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Manual Cash Memo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text" required placeholder="Customer name"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input
                  type="tel" placeholder="01XXXXXXXXX"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date" value={form.memo_date}
                  onChange={(e) => setForm({ ...form, memo_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Items *</label>
                <button type="button" onClick={addItem}
                  className="text-sm text-primary-600 hover:underline flex items-center space-x-1">
                  <FiPlus size={14} /><span>Add Row</span>
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Description</label>}
                      <input
                        type="text" placeholder="Item description" required
                        value={item.description}
                        onChange={(e) => setItem(idx, 'description', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="w-20">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => setItem(idx, 'quantity', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="w-32">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Unit Price (৳)</label>}
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00" required
                        value={item.unit_price}
                        onChange={(e) => setItem(idx, 'unit_price', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="w-28 pb-0.5">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Total</label>}
                      <div className="input-field text-sm bg-gray-100 text-gray-700 font-medium">
                        ৳{fmt(parseFloat(item.quantity || 1) * parseFloat(item.unit_price || 0))}
                      </div>
                    </div>
                    <div className={idx === 0 ? 'mt-5' : ''}>
                      <button type="button" onClick={() => removeItem(idx)}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
                        disabled={form.items.length === 1}>
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Grand Total */}
              <div className="flex justify-end mt-3 pt-3 border-t border-primary-200">
                <span className="text-base font-bold text-gray-800">Grand Total: <span className="text-primary-700">৳{fmt(totalAmount)}</span></span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input type="text" placeholder="Any note..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex space-x-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Memo'}
              </button>
              <button type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Memos List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : memos.length === 0 ? (
        <div className="card text-center py-16">
          <FiFileText size={52} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No cash memos yet</p>
          <p className="text-gray-400 text-sm mt-1">Memos auto-generate when you sell a phone. Or create manually.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memo No.</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {memos.map((memo) => (
                  <tr key={memo.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-mono font-semibold text-primary-700">
                      {memo.memo_number}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(memo.memo_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">
                        {memo.type === 'sale' ? 'Phone Sell' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">
                      <div>{memo.customer_name}</div>
                      {memo.customer_phone && <div className="text-xs text-gray-500">{memo.customer_phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                      ৳{fmt(memo.total_amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        {/* View */}
                        <button
                          onClick={() => openMemo(memo.id)}
                          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
                          title="View & Print"
                        >
                          <FiEye size={15} />
                          <span>View</span>
                        </button>
                        {/* Delete */}
                        {deleteId === memo.id ? (
                          <div className="flex items-center space-x-1">
                            <FiAlertCircle size={13} className="text-red-500" />
                            <span className="text-xs text-red-600">Sure?</span>
                            <button onClick={() => handleDelete(memo.id)} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs text-gray-500 hover:underline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(memo.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View / Print Modal */}
      {(viewMemo || viewLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center space-x-2">
                <FiFileText size={20} className="text-primary-600" />
                <span className="font-semibold text-gray-900">
                  {viewMemo ? viewMemo.memo_number : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {viewMemo && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      <FiPrinter size={16} />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <FiDownload size={16} />
                      <span>PDF</span>
                    </button>
                  </>
                )}
                <button onClick={() => setViewMemo(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable memo body */}
            <div className="overflow-y-auto flex-1 p-6">
              {viewLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                </div>
              ) : (
                <div ref={printRef} className="border border-gray-200 rounded-lg p-6">
                  <MemoContent memo={viewMemo} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
