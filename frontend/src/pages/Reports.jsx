import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiCalendar, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DayMonthYearPicker = ({ value, onChange, className }) => {
  const year  = value ? parseInt(value.substring(0, 4)) : new Date().getFullYear();
  const month = value ? parseInt(value.substring(5, 7)) : new Date().getMonth() + 1;
  const day   = value ? parseInt(value.substring(8, 10)) : new Date().getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  const emit = (d, m, y) => {
    const str = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onChange({ target: { value: str } });
  };
  const years  = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <select value={safeDay} onChange={(e) => emit(Number(e.target.value), month, year)} className="input-field w-20">
        {days.map(d => <option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
      </select>
      <select value={month} onChange={(e) => emit(safeDay, Number(e.target.value), year)} className="input-field w-20">
        {months.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
      </select>
      <select value={year} onChange={(e) => emit(safeDay, month, Number(e.target.value))} className="input-field w-28">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [brandReport, setBrandReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    brand: ''
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    } else if (activeTab === 'monthly') {
      fetchMonthlyReport();
    } else if (activeTab === 'brand' && filters.brand) {
      fetchBrandReport();
    }
  }, [activeTab, filters]);

  const fetchBrands = async () => {
    try {
      const response = await api.get('/phones/brands/list');
      setBrands(response.data.data);
      if (response.data.data.length > 0) {
        setFilters(prev => ({ ...prev, brand: response.data.data[0] }));
      }
    } catch (error) {
      console.error('Failed to fetch brands');
    }
  };

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/daily?date=${filters.date}`);
      setDailyReport(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch daily report');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/monthly?month=${filters.month}&year=${filters.year}`);
      setMonthlyReport(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch monthly report');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/brand?brand=${filters.brand}`);
      setBrandReport(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch brand report');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'daily', label: 'Daily Report', icon: FiCalendar },
    { id: 'monthly', label: 'Monthly Report', icon: FiTrendingUp },
    { id: 'brand', label: 'Brand Report', icon: FiDollarSign }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
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

      {/* Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <DayMonthYearPicker
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : dailyReport && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-blue-50 border border-blue-200">
                  <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{dailyReport.summary.totalSales}</p>
                </div>
                <div className="card bg-green-50 border border-green-200">
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">৳{dailyReport.summary.totalRevenue}</p>
                </div>
                <div className="card bg-purple-50 border border-purple-200">
                  <p className="text-sm text-gray-600 font-medium">Total Profit</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">৳{dailyReport.summary.totalProfit}</p>
                </div>
              </div>

              {/* Sales List */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Details</h3>
                {dailyReport.sales.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales on this date</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dailyReport.sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.brand} {sale.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.imei}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ৳{parseFloat(sale.selling_price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ৳{parseFloat(sale.profit).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="input-field"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : monthlyReport && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-blue-50 border border-blue-200">
                  <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{monthlyReport.summary.totalSales}</p>
                </div>
                <div className="card bg-green-50 border border-green-200">
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">৳{monthlyReport.summary.totalRevenue}</p>
                </div>
                <div className="card bg-purple-50 border border-purple-200">
                  <p className="text-sm text-gray-600 font-medium">Total Profit</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">৳{monthlyReport.summary.totalProfit}</p>
                </div>
              </div>

              {/* Daily Breakdown Chart */}
              {monthlyReport.dailyBreakdown.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyReport.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).getDate()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB')}
                        formatter={(value) => [`৳${parseFloat(value).toFixed(2)}`, '']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" name="Revenue" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#8b5cf6" name="Profit" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Brand Breakdown */}
              {monthlyReport.brandBreakdown.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyReport.brandBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="brand" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales_count" fill="#0ea5e9" name="Sales Count" />
                      <Bar dataKey="profit" fill="#8b5cf6" name="Profit ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Brand Report */}
      {activeTab === 'brand' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand</label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              className="input-field max-w-xs"
            >
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : brandReport && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-blue-50 border border-blue-200">
                  <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{brandReport.summary.totalSales}</p>
                </div>
                <div className="card bg-green-50 border border-green-200">
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">${brandReport.summary.totalRevenue}</p>
                </div>
                <div className="card bg-purple-50 border border-purple-200">
                  <p className="text-sm text-gray-600 font-medium">Total Profit</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">${brandReport.summary.totalProfit}</p>
                </div>
              </div>

              {/* Sales List */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All {brandReport.brand} Sales</h3>
                {brandReport.sales.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales for this brand</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {brandReport.sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.sale_date).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.imei}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ৳{parseFloat(sale.selling_price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ৳{parseFloat(sale.profit).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
