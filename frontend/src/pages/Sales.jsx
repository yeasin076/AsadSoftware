import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiCalendar } from 'react-icons/fi';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filterBrand, setFilterBrand] = useState('');
  const [brands, setBrands] = useState([]);

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
  }, [filterBrand]);

  const fetchSales = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBrand) params.append('brand', filterBrand);
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

    try {
      const response = await api.post('/sales', formData);
      toast.success(`Phone sold successfully! Profit: $${response.data.data.profit}`);
      setShowModal(false);
      resetForm();
      fetchSales();
      fetchAvailablePhones();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sell phone');
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
                      ${parseFloat(sale.buying_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(sale.selling_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">
                        ${parseFloat(sale.profit).toFixed(2)}
                      </span>
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
                        <p className="font-semibold text-gray-900">${parseFloat(selectedPhone.buying_price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Selling Price:</p>
                        <p className="font-semibold text-gray-900">${parseFloat(selectedPhone.selling_price).toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Expected Profit:</p>
                        <p className="font-semibold text-green-600 text-lg">
                          ${(parseFloat(selectedPhone.selling_price) - parseFloat(selectedPhone.buying_price)).toFixed(2)}
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
                <button type="submit" className="btn-primary">
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
