import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiRepeat, FiSearch, FiArrowRight, FiArrowLeft, FiDollarSign,
  FiCheckCircle, FiTrash2, FiChevronLeft, FiChevronRight,
  FiMinus, FiPlus, FiPrinter, FiFileText, FiX, FiDownload,
} from 'react-icons/fi';

const SHOP_NAME    = 'APPLE HQ';
const SHOP_SLOGAN  = 'Where Luxury Meets Technology';
const SHOP_ADDRESS = 'Head office: 20, Sobujbag, Sobujbag Thana, Basabo, Dhaka -1214';
const SHOP_PHONE   = '01410959634';
const fmt = (v) => parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

// ─── Exchange Memo printable content ─────────────────────────────────────────
const ExchangeMemoContent = ({ data }) => {
  if (!data) return null;
  const { memo_number, exchange_date, customer_name, customer_phone_contact,
          stock_phone, customer_phone, money_direction, money_amount, notes } = data;
  const stockPrice = parseFloat(stock_phone?.selling_price || 0);
  const custValue  = parseFloat(customer_phone?.value || 0);
  const dirLabel = money_direction==='customer_pays' ? 'Customer দিয়েছেন'
                 : money_direction==='store_pays'    ? 'Store দিয়েছে'
                 : 'কোনো নগদ লেনদেন নেই';
  return (
    <div className="memo-wrap">
      <div className="shop-header">
        <div className="shop-name">{SHOP_NAME}</div>
        <div className="shop-slogan">{SHOP_SLOGAN}</div>
        <div className="shop-sub">{SHOP_ADDRESS} &nbsp;|&nbsp; {SHOP_PHONE}</div>
      </div>
      <div className="memo-meta">
        <div>
          <div><span className="label">Memo No:</span> {memo_number}</div>
          <div><span className="label">Date:</span> {new Date(exchange_date).toLocaleDateString('en-GB')}</div>
          <div><span className="label">Type:</span> <span className="type-badge">Phone Exchange</span></div>
        </div>
        <div>
          <div><span className="label">Customer:</span> {customer_name}</div>
          {customer_phone_contact && <div><span className="label">Phone:</span> {customer_phone_contact}</div>}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{width:30}}>#</th>
            <th>Description</th>
            <th style={{width:130,textAlign:'right'}}>মূল্য</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>Stock Phone — দেওয়া হয়েছে</strong><br/>
              <span style={{fontSize:11,color:'#555'}}>{stock_phone?.brand} {stock_phone?.model}{stock_phone?.storage?` — ${stock_phone.storage}`:''}{stock_phone?.color?` / ${stock_phone.color}`:''}</span><br/>
              {stock_phone?.imei&&<span style={{fontSize:10,color:'#999'}}>IMEI: {stock_phone.imei}</span>}
            </td>
            <td className="num">৳{fmt(stockPrice)}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>
              <strong>Trade-in Phone — নেওয়া হয়েছে</strong><br/>
              <span style={{fontSize:11,color:'#555'}}>{customer_phone?.brand} {customer_phone?.model}{customer_phone?.storage?` — ${customer_phone.storage}`:''}{customer_phone?.color?` / ${customer_phone.color}`:''}</span><br/>
              {customer_phone?.imei&&<span style={{fontSize:10,color:'#999'}}>IMEI: {customer_phone.imei}</span>}
            </td>
            <td className="num" style={{color:'#16a34a'}}>৳{fmt(custValue)}</td>
          </tr>
        </tbody>
      </table>
      <table style={{marginBottom:0}}>
        <tbody>
          <tr>
            <td style={{textAlign:'right',borderBottom:'none',color:'#555'}}>Stock Phone মূল্য</td>
            <td className="num" style={{borderBottom:'none',width:130}}>৳{fmt(stockPrice)}</td>
          </tr>
          <tr>
            <td style={{textAlign:'right',borderBottom:'none',color:'#555'}}>Trade-in মূল্য (বাদ)</td>
            <td className="num" style={{borderBottom:'none',color:'#16a34a'}}>‒ ৳{fmt(custValue)}</td>
          </tr>
          <tr>
            <td style={{textAlign:'right',fontWeight:700,borderTop:'2px solid #1e3a5f',color:'#111'}}>{dirLabel}</td>
            <td className="num" style={{fontWeight:700,fontSize:14,borderTop:'2px solid #1e3a5f',
              color:money_direction==='customer_pays'?'#15803d':money_direction==='store_pays'?'#dc2626':'#374151'}}>
              {money_direction==='equal'?'—':`৳${fmt(money_amount)}`}
            </td>
          </tr>
        </tbody>
      </table>
      {notes&&<div className="notes" style={{marginTop:12}}>Note: {notes}</div>}
      <div className="footer">
        <div>Exchange সম্পন্ন হয়েছে। ধন্যবাদ!</div>
        <div className="sig-line">Authorized Signature</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const emptyCustomerPhone = {
  brand: '',
  model: '',
  storage: '',
  color: '',
  imei: '',
  value: '',
};

const emptyForm = {
  customerName: '',
  customerContact: '',
  notes: '',
};

export default function Exchange() {
  // Tabs: 'new' | 'history'
  const [tab, setTab] = useState('new');

  // Stock phone selection
  const [stockPhones, setStockPhones] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);

  // Customer phone
  const [custPhone, setCustPhone] = useState(emptyCustomerPhone);

  // Form
  const [form, setForm] = useState(emptyForm);

  // Computed
  const stockPrice = parseFloat(selectedStock?.selling_price || 0);
  const custValue = parseFloat(custPhone.value || 0);
  const diff = stockPrice - custValue;
  const moneyDirection =
    diff > 0 ? 'customer_pays' : diff < 0 ? 'store_pays' : 'equal';
  const moneyAmount = Math.abs(diff);

  // UI state
  const [submitting, setSubmitting]     = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [generateMemo, setGenerateMemo] = useState(true);
  const [exchangeMemoData, setExchangeMemoData] = useState(null);
  const printRef = useRef();

  // History
  const [history, setHistory] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const HIST_LIMIT = 15;

  // ── Fetch in-stock phones ──────────────────
  const fetchStockPhones = useCallback(async () => {
    try {
      const res = await api.get('/phones', {
        params: { status: 'In Stock', limit: 200 },
      });
      setStockPhones(res.data.data || []);
    } catch {
      toast.error('Could not load stock phones');
    }
  }, []);

  useEffect(() => {
    fetchStockPhones();
  }, [fetchStockPhones]);

  // ── Fetch exchange history ─────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/exchanges', {
        params: { page: histPage, limit: HIST_LIMIT },
      });
      setHistory(res.data.data || []);
      setHistTotal(res.data.pagination?.totalItems || 0);
    } catch {
      toast.error('Could not load exchange history');
    }
  }, [histPage]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // ── Filtered stock list ────────────────────
  const filteredStock = stockPhones.filter((p) => {
    const q = stockSearch.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.imei.toLowerCase().includes(q)
    );
  });

  // ── Reset form ─────────────────────────────
  const resetForm = () => {
    setSelectedStock(null);
    setCustPhone(emptyCustomerPhone);
    setForm(emptyForm);
    setShowConfirm(false);
    setStockSearch('');
    setExchangeMemoData(null);
  };

  // ── Submit exchange ────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!selectedStock) return toast.error('Stock phone seloct korun');
    if (!form.customerName.trim()) return toast.error('Customer name likhun');
    if (!form.customerContact.trim()) return toast.error('Customer contact likhun');
    if (!custPhone.brand.trim()) return toast.error('Customer phone brand likhun');
    if (!custPhone.model.trim()) return toast.error('Customer phone model likhun');
    if (!custPhone.imei.trim()) return toast.error('Customer phone IMEI likhun');
    if (!custPhone.value || isNaN(custValue) || custValue <= 0)
      return toast.error('Customer phone value likhun');

    setShowConfirm(true);
  };

  const confirmExchange = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/exchanges', {
        stock_phone_id: selectedStock.id,
        customer_name: form.customerName,
        customer_phone_contact: form.customerContact,
        customer_phone_brand: custPhone.brand,
        customer_phone_model: custPhone.model,
        customer_phone_storage: custPhone.storage || 'N/A',
        customer_phone_color: custPhone.color || 'N/A',
        customer_phone_imei: custPhone.imei,
        customer_phone_value: custValue,
        notes: form.notes,
      });
      toast.success('Exchange সফলভাবে সম্পন্ন হয়েছে!');
      setShowConfirm(false);
      fetchStockPhones();
      // Reset inputs but keep memo open
      setSelectedStock(null); setCustPhone(emptyCustomerPhone);
      setForm(emptyForm); setStockSearch('');
      if (generateMemo) setExchangeMemoData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Exchange ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('এই exchange record মুছে ফেলবেন?')) return;
    try {
      await api.delete(`/exchanges/${id}`);
      toast.success('Record মুছে ফেলা হয়েছে');
      fetchHistory();
    } catch {
      toast.error('Delete ব্যর্থ হয়েছে');
    }
  };

  const handleViewMemo = (ex) => {
    setExchangeMemoData({
      memo_number: ex.memo_number || `EX-${ex.id}`,
      exchange_date: ex.exchange_date,
      customer_name: ex.customer_name,
      customer_phone_contact: ex.customer_phone_contact,
      stock_phone: {
        brand: ex.stock_phone_brand,
        model: ex.stock_phone_model,
        storage: ex.stock_phone_storage,
        color: ex.stock_phone_color,
        imei: ex.stock_phone_imei,
        selling_price: ex.stock_phone_price,
      },
      customer_phone: {
        brand: ex.customer_phone_brand,
        model: ex.customer_phone_model,
        storage: ex.customer_phone_storage,
        color: ex.customer_phone_color,
        imei: ex.customer_phone_imei,
        value: ex.customer_phone_value,
      },
      money_direction: ex.money_direction,
      money_amount: ex.money_amount,
      notes: ex.notes || '',
    });
  };

  // ── Print exchange memo ──────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=700,height=900');
    win.document.write(`
      <html><head><title>Exchange Memo − ${exchangeMemoData?.memo_number}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#111; padding:20px; }
        .memo-wrap { max-width:620px; margin:0 auto; border:1px solid #ddd; padding:24px; }
        .shop-header { text-align:center; border-bottom:2px solid #1e3a5f; padding-bottom:12px; margin-bottom:16px; }
        .shop-name { font-size:22px; font-weight:700; color:#1e3a5f; }
        .shop-slogan { font-size:11px; font-style:italic; color:#6b7280; margin-top:2px; }
        .shop-sub { font-size:12px; color:#555; margin-top:2px; }
        .memo-meta { display:flex; justify-content:space-between; margin-bottom:14px; font-size:12px; }
        .memo-meta div { line-height:1.7; }
        .label { font-weight:600; color:#444; }
        table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        th { background:#1e3a5f; color:#fff; padding:8px 10px; text-align:left; font-size:12px; }
        td { padding:7px 10px; border-bottom:1px solid #e5e7eb; font-size:12px; }
        td.num { text-align:right; }
        .footer { margin-top:24px; display:flex; justify-content:space-between; padding-top:12px; border-top:1px dashed #ccc; font-size:11px; color:#666; }
        .sig-line { margin-top:30px; border-top:1px solid #555; padding-top:4px; text-align:center; width:140px; }
        .type-badge { font-size:10px; font-weight:600; color:#374151; }
        .notes { font-size:11px; color:#555; }
        @media print { body{padding:0;} .memo-wrap{border:none;} }
      </style></head><body>${content}</body></html>
    `);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin:[8,8,8,8], filename:`${exchangeMemoData?.memo_number}.pdf`,
        image:{type:'jpeg',quality:0.98},
        html2canvas:{scale:2,useCORS:true},
        jsPDF:{unit:'mm',format:'a5',orientation:'portrait'}
      }).from(printRef.current).save();
    } catch { toast.error('PDF generate ব্যর্থ হয়েছে'); }
  };

  // ── Money badge ────────────────────────────
  const MoneyBadge = ({ direction, amount }) => {
    if (direction === 'equal')
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
          <FiMinus size={14} /> কোনো টাকার লেনদেন নেই
        </span>
      );
    if (direction === 'customer_pays')
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
          <FiPlus size={14} /> Customer দেবে ৳{parseFloat(amount).toLocaleString()}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
        <FiMinus size={14} /> Store দেবে ৳{parseFloat(amount).toLocaleString()}
      </span>
    );
  };

  // ─────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Memo print styles */}
      <style>{`
        .memo-wrap { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; }
        .shop-header { text-align:center; border-bottom:2px solid #1e3a5f; padding-bottom:12px; margin-bottom:16px; }
        .shop-name { font-size:22px; font-weight:700; color:#1e3a5f; }
        .shop-slogan { font-size:11px; font-style:italic; color:#6b7280; margin-top:2px; }
        .shop-sub { font-size:12px; color:#555; margin-top:2px; }
        .memo-meta { display:flex; justify-content:space-between; margin-bottom:14px; font-size:12px; }
        .memo-meta div { line-height:1.8; }
        .label { font-weight:600; color:#444; margin-right:4px; }
        .memo-wrap table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        .memo-wrap th { background:#1e3a5f; color:#fff; padding:8px 10px; text-align:left; font-size:12px; }
        .memo-wrap td { padding:7px 10px; border-bottom:1px solid #e5e7eb; font-size:12px; }
        .memo-wrap td.num { text-align:right; }
        .footer { margin-top:20px; display:flex; justify-content:space-between; padding-top:12px; border-top:1px dashed #ccc; font-size:11px; color:#666; }
        .sig-line { margin-top:30px; border-top:1px solid #555; padding-top:4px; text-align:center; width:140px; font-size:11px; }
        .type-badge { display:inline-block; font-size:10px; font-weight:600; color:#374151; }
        .notes { font-size:11px; color:#555; }
      `}</style>

      {/* Header */}}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiRepeat className="text-primary-600" /> Exchange
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Customer-এর phone নিয়ে stock-এর phone দেওয়া
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('new')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'new'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            নতুন Exchange
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ইতিহাস
          </button>
        </div>
      </div>

      {/* ═══ NEW EXCHANGE TAB ═══ */}
      {tab === 'new' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Stock phone selector ── */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FiArrowRight className="text-blue-500" /> Stock থেকে Phone নির্বাচন
            </h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Brand / Model / IMEI খুঁজুন..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStock.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">কোনো phone পাওয়া যায়নি</p>
              )}
              {filteredStock.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedStock(p)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    selectedStock?.id === p.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-800">
                    {p.brand} {p.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.storage} · {p.color}
                  </p>
                  <p className="text-xs text-gray-400">IMEI: {p.imei}</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">
                    ৳{parseFloat(p.selling_price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Middle: Customer & their phone ── */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FiArrowLeft className="text-orange-500" /> Customer তথ্য ও তার Phone
            </h2>

            {/* Customer info */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer নাম *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Customer-এর নাম"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact নম্বর *</label>
                <input
                  type="text"
                  value={form.customerContact}
                  onChange={(e) => setForm({ ...form, customerContact: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <hr />

            {/* Customer phone details */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer-এর Phone</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand *</label>
                  <input
                    type="text"
                    value={custPhone.brand}
                    onChange={(e) => setCustPhone({ ...custPhone, brand: e.target.value })}
                    placeholder="Apple / Samsung..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model *</label>
                  <input
                    type="text"
                    value={custPhone.model}
                    onChange={(e) => setCustPhone({ ...custPhone, model: e.target.value })}
                    placeholder="iPhone 13..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Storage</label>
                  <input
                    type="text"
                    value={custPhone.storage}
                    onChange={(e) => setCustPhone({ ...custPhone, storage: e.target.value })}
                    placeholder="128GB"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input
                    type="text"
                    value={custPhone.color}
                    onChange={(e) => setCustPhone({ ...custPhone, color: e.target.value })}
                    placeholder="Black"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMEI *</label>
                <input
                  type="text"
                  value={custPhone.imei}
                  onChange={(e) => setCustPhone({ ...custPhone, imei: e.target.value })}
                  placeholder="15-digit IMEI"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone-এর মূল্য (৳) *</label>
                <input
                  type="number"
                  value={custPhone.value}
                  onChange={(e) => setCustPhone({ ...custPhone, value: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="অতিরিক্ত তথ্য..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* ── Right: Summary & Calculation ── */}
          <div className="xl:col-span-1 space-y-4">
            {/* Calculation card */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiDollarSign className="text-green-500" /> হিসাব
              </h2>

              {/* Stock phone summary */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">Stock Phone (দেওয়া হচ্ছে)</p>
                {selectedStock ? (
                  <>
                    <p className="font-semibold text-blue-800">
                      {selectedStock.brand} {selectedStock.model}
                    </p>
                    <p className="text-xs text-blue-600">
                      {selectedStock.storage} · {selectedStock.color}
                    </p>
                    <p className="text-sm font-bold text-blue-700 mt-1">
                      ৳{parseFloat(selectedStock.selling_price).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-blue-400 italic">এখনো নির্বাচিত হয়নি</p>
                )}
              </div>

              {/* Customer phone summary */}
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <p className="text-xs text-orange-400 font-medium mb-1">Customer Phone (নেওয়া হচ্ছে)</p>
                {custPhone.brand ? (
                  <>
                    <p className="font-semibold text-orange-800">
                      {custPhone.brand} {custPhone.model}
                    </p>
                    {custPhone.storage && (
                      <p className="text-xs text-orange-600">
                        {custPhone.storage} {custPhone.color && `· ${custPhone.color}`}
                      </p>
                    )}
                    <p className="text-sm font-bold text-orange-700 mt-1">
                      ৳{custValue > 0 ? custValue.toLocaleString() : '---'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-orange-400 italic">এখনো পূরণ হয়নি</p>
                )}
              </div>

              {/* Diff */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stock Phone মূল্য</span>
                  <span className="font-medium">৳{stockPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer Phone মূল্য</span>
                  <span className="font-medium">৳{custValue.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">পার্থক্য</span>
                  <MoneyBadge direction={moneyDirection} amount={moneyAmount} />
                </div>
              </div>

              {/* Cash Memo toggle */}
              <div className="border-t pt-3 flex items-center gap-2">
                <input type="checkbox" id="genMemo" checked={generateMemo}
                  onChange={(e) => setGenerateMemo(e.target.checked)}
                  className="w-4 h-4 accent-primary-600 cursor-pointer"
                />
                <label htmlFor="genMemo" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1">
                  <FiFileText size={14} className="text-primary-500" /> Exchange Cash Memo তৈরি করুন
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                disabled={!selectedStock || !custPhone.brand}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <FiCheckCircle size={18} /> Exchange নিশ্চিত করুন
              </button>
              <button
                onClick={resetForm}
                className="w-full text-gray-600 hover:text-gray-800 text-sm py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Reset করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Exchange ইতিহাস ({histTotal} টি)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">তারিখ</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Stock Phone (দেওয়া)</th>
                  <th className="px-4 py-3 text-left">Customer Phone (নেওয়া)</th>
                  <th className="px-4 py-3 text-left">হিসাব</th>
                  <th className="px-4 py-3 text-left">Memo</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-12">কোনো exchange ইতিহাস নেই</td>
                  </tr>
                )}
                {history.map((ex, idx) => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{(histPage - 1) * HIST_LIMIT + idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(ex.exchange_date).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{ex.customer_name}</p>
                      <p className="text-xs text-gray-500">{ex.customer_phone_contact}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {ex.stock_phone_brand} {ex.stock_phone_model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ex.stock_phone_storage} · ৳{parseFloat(ex.stock_phone_price).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {ex.customer_phone_brand} {ex.customer_phone_model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ex.customer_phone_storage} · ৳{parseFloat(ex.customer_phone_value).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <MoneyBadge direction={ex.money_direction} amount={ex.money_amount} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewMemo(ex)}
                        className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs font-medium transition-colors"
                        title="Memo দেখুন"
                      >
                        <FiFileText size={15} />
                        <span className="hidden sm:inline">{ex.memo_number || `EX-${ex.id}`}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteHistory(ex.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {histTotal > HIST_LIMIT && (
            <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {histPage} / {Math.ceil(histTotal / HIST_LIMIT)}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={histPage === 1}
                  onClick={() => setHistPage((p) => p - 1)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>
                <button
                  disabled={histPage >= Math.ceil(histTotal / HIST_LIMIT)}
                  onClick={() => setHistPage((p) => p + 1)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONFIRM MODAL ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">Exchange নিশ্চিত করুন</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{form.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock Phone দেওয়া হচ্ছে</span>
                <span className="font-medium">
                  {selectedStock?.brand} {selectedStock?.model} (৳{parseFloat(selectedStock?.selling_price || 0).toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Phone নেওয়া হচ্ছে</span>
                <span className="font-medium">
                  {custPhone.brand} {custPhone.model} (৳{custValue.toLocaleString()})
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-gray-600 font-semibold">টাকার হিসাব</span>
                <MoneyBadge direction={moneyDirection} amount={moneyAmount} />
              </div>
              {generateMemo && (
                <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
                  <FiFileText size={14} className="text-primary-500" />
                  <span className="text-xs text-primary-700 font-medium">Exchange Cash Memo তৈরি হবে</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl border text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                বাতিল
              </button>
              <button
                onClick={confirmExchange}
                disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? 'Processing...' : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXCHANGE CASH MEMO MODAL ═══ */}
      {exchangeMemoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FiRepeat size={20} className="text-primary-600" />
                <span className="font-semibold text-gray-900">Exchange Memo — {exchangeMemoData.memo_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
                  <FiPrinter size={16} /> Print
                </button>
                <button onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors">
                  <FiDownload size={16} /> PDF
                </button>
                <button onClick={() => setExchangeMemoData(null)}
                  className="p-2 text-gray-400 hover:text-gray-600">
                  <FiX size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div ref={printRef} className="border border-gray-200 rounded-lg p-6">
                <ExchangeMemoContent data={exchangeMemoData} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
