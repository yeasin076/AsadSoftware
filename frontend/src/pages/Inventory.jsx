import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';

const MODEL_COLORS = {
  'iPhone 13':          ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'],
  'iPhone 13 Pro':      ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
  'iPhone 13 Pro Max':  ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
  'iPhone 14':          ['Midnight', 'Starlight', 'Blue', 'Purple', 'Yellow', 'Red'],
  'iPhone 14 Pro':      ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
  'iPhone 14 Pro Max':  ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
  'iPhone 15':          ['Black', 'Blue', 'Green', 'Yellow', 'Pink'],
  'iPhone 15 Pro':      ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'],
  'iPhone 15 Pro Max':  ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'],
  'iPhone 16':          ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'],
  'iPhone 16 Pro':      ['Black Titanium', 'White Titanium', 'Desert Titanium', 'Natural Titanium'],
  'iPhone 16 Pro Max':  ['Black Titanium', 'White Titanium', 'Desert Titanium', 'Natural Titanium'],
  'iPhone 17':          ['Black', 'White', 'Silver', 'Blue', 'Pink'],
  'iPhone 17 Pro':      ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'],
  'iPhone 17 Pro Max':  ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'],
};

const BRAND_MODELS = {
  Apple: [
    'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
    'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
  ],
  Samsung: [],
  Realme: [],
  Xiaomi: [],
  Vivo: [],
  Oppo: [],
};

const Inventory = () => {
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({});

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '',
    color: '',
    imei: '',
    buying_price: '',
    selling_price: '',
    supplier_name: '',
    status: 'In Stock'
  });

  useEffect(() => {
    fetchPhones();
    fetchBrands();
  }, [searchTerm, filterBrand, filterStatus]);

  const fetchPhones = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterBrand) params.append('brand', filterBrand);
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', page);
      params.append('limit', 10);

      const response = await api.get(`/phones?${params}`);
      setPhones(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch phones');
    } finally {
      setLoading(false);
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

    try {
      if (editMode) {
        await api.put(`/phones/${formData.id}`, formData);
        toast.success('Phone updated successfully');
      } else {
        await api.post('/phones', formData);
        toast.success('Phone added successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchPhones();
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (phone) => {
    setFormData(phone);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this phone?')) return;

    try {
      await api.delete(`/phones/${id}`);
      toast.success('Phone deleted successfully');
      fetchPhones();
      fetchBrands();
    } catch (error) {
      toast.error('Failed to delete phone');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      storage: '',
      color: '',
      imei: '',
      buying_price: '',
      selling_price: '',
      supplier_name: '',
      status: 'In Stock'
    });
    setEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleExportExcel = async () => {
    try {
      // Fetch all phones (no pagination) for export
      const params = new URLSearchParams();
      params.append('limit', '10000');
      if (searchTerm) params.append('search', searchTerm);
      if (filterBrand) params.append('brand', filterBrand);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/phones?${params.toString()}`);
      const data = res.data.data.map((p, i) => ({
        '#': i + 1,
        'Brand': p.brand,
        'Model': p.model,
        'Storage': p.storage || '',
        'Color': p.color || '',
        'IMEI': p.imei || '',
        'Buying Price': parseFloat(p.buying_price),
        'Selling Price': parseFloat(p.selling_price),
        'Supplier': p.supplier_name || '',
        'Status': p.status,
        'Date Added': p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `inventory_${today}.xlsx`);
      toast.success('Excel file downloaded!');
    } catch {
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            <FiDownload className="mr-2" />
            Export Excel
          </button>
          <button onClick={openAddModal} className="btn-primary flex items-center">
            <FiPlus className="mr-2" />
            Add New Phone
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by brand, model, or IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="input-field"
          >
            <option value="">All Brands</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
            <option value="Realme">Realme</option>
            <option value="Xiaomi">Xiaomi</option>
            <option value="Vivo">Vivo</option>
            <option value="Oppo">Oppo</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : phones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No phones found</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand & Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {phones.map((phone) => (
                  <tr key={phone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{phone.brand}</div>
                      <div className="text-sm text-gray-500">{phone.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{phone.storage}</div>
                      <div className="text-sm text-gray-500">{phone.color}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{phone.imei}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Buy: ৳{parseFloat(phone.buying_price).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Sell: ৳{parseFloat(phone.selling_price).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{phone.supplier_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {phone.created_at ? new Date(phone.created_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={phone.status === 'In Stock' ? 'badge-success' : 'badge-danger'}>
                        {phone.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(phone)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(phone.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
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
                    onClick={() => fetchPhones(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchPhones(pagination.currentPage + 1)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editMode ? 'Edit Phone' : 'Add New Phone'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value, model: '' })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Brand</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Realme">Realme</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Oppo">Oppo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  {formData.brand && BRAND_MODELS[formData.brand]?.length > 0 ? (
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Model</option>
                      {BRAND_MODELS[formData.brand].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="input-field"
                      placeholder="Enter model"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage *</label>
                  <select
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Storage</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                  {formData.model && MODEL_COLORS[formData.model] ? (
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Color</option>
                      {MODEL_COLORS[formData.model].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-field"
                      placeholder="Enter color"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMEI *</label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update Phone' : 'Add Phone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
