import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiCalendar, FiFileText, FiPrinter, FiX, FiDownload, FiSearch } from 'react-icons/fi';

const SHOP_NAME    = "Apple HQ";
const SHOP_ADDRESS = 'Dhaka, Bangladesh';
const SHOP_PHONE   = '01XXXXXXXXX';
const fmt = (v) => parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filterBrand, setFilterBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [brands, setBrands] = useState([]);
  const [viewMemo, setViewMemo] = useState(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const printRef = useRef();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone_id: '',
    customer_name: '',
    customer_phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchSales();
    fetchAvailablePhones();
    fetchBrands();
  }, [filterBrand, searchQuery]);

  const fetchSales = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBrand) params.append('brand', filterBrand);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page);
      params.append('limit', 10);

      const response = await api.get(`/sales?${params}`);
      setSales(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePhones = async () => {
    try {
      const response = await api.get('/phones?status=In Stock&limit=100');
      setPhones(response.data.data);
    } catch (error) {
      console.error('Failed to fetch phones');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/phones/brands/list');
      setBrands(response.data.data);
    } catch (error) {
      console.error('Failed to fetch brands');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const response = await api.post('/sales', formData);
      toast.success(`Phone sold! Profit: ৳${response.data.data.profit} — Memo: ${response.data.data.memo_number}`);
      setShowModal(false);
      resetForm();
      fetchSales();
      fetchAvailablePhones();
      // Auto open the generated cash memo
      if (response.data.data.memo_id) {
        openMemo(response.data.data.memo_id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sell phone');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      phone_id: '',
      customer_name: '',
      customer_phone: '',
      notes: ''
    });
  };

  const openMemo = async (memoId) => {
    try {
      setMemoLoading(true);
      const res = await api.get(`/cashmemo/${memoId}`);
      setViewMemo(res.data.data);
    } catch { toast.error('Failed to load memo'); }
    finally { setMemoLoading(false); }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('','_blank','width=700,height=900');
    win.document.write(`<html><head><title>Cash Memo</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;padding:20px;}.memo-wrap{max-width:620px;margin:0 auto;border:1px solid #ddd;padding:24px;}.shop-header{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px;}.shop-name{font-size:22px;font-weight:700;color:#1e3a5f;}.shop-sub{font-size:12px;color:#555;margin-top:2px;}.memo-meta{display:flex;justify-content:space-between;margin-bottom:14px;font-size:12px;}.memo-meta div{line-height:1.7;}.label{font-weight:600;color:#444;}table{width:100%;border-collapse:collapse;margin-bottom:14px;}th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-size:12px;}td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;}td.num{text-align:right;}.total-row td{font-weight:700;font-size:13px;border-top:2px solid #1e3a5f;}.footer{margin-top:24px;display:flex;justify-content:space-between;padding-top:12px;border-top:1px dashed #ccc;font-size:11px;color:#666;}.sig-line{margin-top:30px;border-top:1px solid #555;padding-top:4px;text-align:center;width:140px;}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(()=>{win.print();win.close();},400);
  };

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

  const selectedPhone = phones.find(p => p.id === parseInt(formData.phone_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
          disabled={phones.length === 0}
        >
          <FiShoppingCart className="mr-2" />
          Sell Phone
        </button>
      </div>

      {phones.length === 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-800">No phones available in stock. Please add inventory first.</p>
        </div>
      )}

      {/* Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="input-field"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <form
            className="flex gap-2 md:col-span-2"
            onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput); }}
          >
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by customer, IMEI, model, brand..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pl-9 w-full"
              />
            </div>
            <button type="submit" className="btn-primary px-4">Search</button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 text-sm"
              >
                <FiX size={16} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No sales records found</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{sale.brand} {sale.model}</div>
                      <div className="text-sm text-gray-500">{sale.storage} - {sale.color}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.imei}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.customer_name}</div>
                      <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ৳{parseFloat(sale.buying_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ৳{parseFloat(sale.selling_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">
                        ৳{parseFloat(sale.profit).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.memo_id ? (
                        <button
                          onClick={() => openMemo(sale.memo_id)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm font-medium"
                          title={sale.memo_number}
                        >
                          <FiFileText size={15} />
                          <span className="font-mono text-xs">{sale.memo_number}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total items)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchSales(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchSales(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sell Phone Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Sell Phone</h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Phone *</label>
                  <select
                    value={formData.phone_id}
                    onChange={(e) => setFormData({ ...formData, phone_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Choose a phone...</option>
                    {phones.map((phone) => (
                      <option key={phone.id} value={phone.id}>
                        {phone.brand} {phone.model} - {phone.storage} - {phone.color} (IMEI: {phone.imei})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPhone && (
                  <div className="card bg-primary-50 border border-primary-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Buying Price:</p>
                        <p className="font-semibold text-gray-900">৳{parseFloat(selectedPhone.buying_price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Selling Price:</p>
                        <p className="font-semibold text-gray-900">৳{parseFloat(selectedPhone.selling_price).toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Expected Profit:</p>
                        <p className="font-semibold text-green-600 text-lg">
                          ৳{(parseFloat(selectedPhone.selling_price) - parseFloat(selectedPhone.buying_price)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="input-field"
                    placeholder="+1-555-0100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Memo View / Print Modal */}
      {(viewMemo || memoLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl">
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
                    <button onClick={handlePrint}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      <FiPrinter size={16} /><span>Print</span>
                    </button>
                    <button onClick={handleDownloadPDF}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                      <FiDownload size={16} /><span>PDF</span>
                    </button>
                  </>
                )}
                <button onClick={() => setViewMemo(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <FiX size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {memoLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                </div>
              ) : viewMemo && (
                <div ref={printRef} className="border border-gray-200 rounded-lg p-6">
                  {/* Memo content */}
                  <style>{`.memo-wrap{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;}.shop-header{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px;}.shop-name{font-size:22px;font-weight:700;color:#1e3a5f;}.shop-sub{font-size:12px;color:#555;}.memo-meta{display:flex;justify-content:space-between;margin-bottom:14px;font-size:12px;}.memo-meta div{line-height:1.8;}.label{font-weight:600;color:#444;margin-right:4px;}.memo-wrap table{width:100%;border-collapse:collapse;margin-bottom:14px;}.memo-wrap th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-size:12px;}.memo-wrap td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;}.memo-wrap td.num{text-align:right;}.total-row td{font-weight:700;border-top:2px solid #1e3a5f!important;}.footer{margin-top:20px;display:flex;justify-content:space-between;padding-top:12px;border-top:1px dashed #ccc;font-size:11px;color:#666;}.sig-line{margin-top:28px;border-top:1px solid #555;padding-top:4px;text-align:center;width:140px;font-size:11px;}.notes{font-size:11px;color:#555;margin-bottom:12px;}`}</style>
                  <div className="memo-wrap">
                    <div className="shop-header">
                      <div className="shop-name">{SHOP_NAME}</div>
                      <div className="shop-sub">{SHOP_ADDRESS} &nbsp;|&nbsp; {SHOP_PHONE}</div>
                    </div>
                    <div className="memo-meta">
                      <div>
                        <div><span className="label">Memo No:</span> {viewMemo.memo_number}</div>
                        <div><span className="label">Date:</span> {new Date(viewMemo.memo_date).toLocaleDateString('en-GB')}</div>
                        <div><span className="label">Type:</span> {viewMemo.type === 'sale' ? 'Phone Sale' : 'Manual'}</div>
                      </div>
                      <div>
                        <div><span className="label">Customer:</span> {viewMemo.customer_name}</div>
                        {viewMemo.customer_phone && <div><span className="label">Phone:</span> {viewMemo.customer_phone}</div>}
                      </div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th style={{width:30}}>#</th>
                          <th>Description</th>
                          <th style={{width:50,textAlign:'right'}}>Qty</th>
                          <th style={{width:100,textAlign:'right'}}>Unit Price</th>
                          <th style={{width:110,textAlign:'right'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewMemo.items||[]).map((item,idx) => (
                          <tr key={item.id||idx}>
                            <td>{idx+1}</td>
                            <td>{item.description}</td>
                            <td className="num">{item.quantity}</td>
                            <td className="num">৳{fmt(item.unit_price)}</td>
                            <td className="num">৳{fmt(parseInt(item.quantity)*parseFloat(item.unit_price))}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan={4} style={{textAlign:'right'}}>Grand Total</td>
                          <td className="num">৳{fmt((viewMemo.items||[]).reduce((s,i)=>s+(parseInt(i.quantity)*parseFloat(i.unit_price)),0))}</td>
                        </tr>
                      </tbody>
                    </table>
                    {viewMemo.notes && <div className="notes">Note: {viewMemo.notes}</div>}
                    <div className="footer">
                      <div>Thank you for your purchase!</div>
                      <div className="sig-line">Authorized Signature</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
