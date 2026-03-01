import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { 
  FiPackage, 
  FiDollarSign, 
  FiShoppingCart, 
  FiAlertTriangle,
  FiTrendingUp
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total In Stock',
      value: stats?.totalInStock || 0,
      icon: FiPackage,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Sold',
      value: stats?.totalSold || 0,
      icon: FiShoppingCart,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Profit',
      value: `$${stats?.totalProfit || 0}`,
      icon: FiDollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockAlerts?.length || 0,
      icon: FiAlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className={`text-2xl ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2" />
            Top Selling Brands
          </h3>
          {stats?.topBrands && stats.topBrands.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topBrands}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales_count" fill="#0ea5e9" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-10">No sales data available</p>
          )}
        </div>

        {/* Brand Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Profit Distribution</h3>
          {stats?.topBrands && stats.topBrands.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.topBrands}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.brand}: $${parseFloat(entry.total_profit).toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_profit"
                >
                  {stats.topBrands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-10">No profit data available</p>
          )}
        </div>
      </div>

      {/* Recent Sales and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.brand} {sale.model}</p>
                    <p className="text-sm text-gray-600">{sale.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${parseFloat(sale.selling_price).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Profit: ${parseFloat(sale.profit).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent sales</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAlertTriangle className="text-orange-500 mr-2" />
            Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              stats.lowStockAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{item.brand}</p>
                    <p className="text-sm text-gray-600">Low inventory</p>
                  </div>
                  <span className="badge-warning">{item.count} in stock</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No low stock alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
