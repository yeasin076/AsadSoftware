const { pool } = require('../config/database');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Get total phones in stock
    const [stockCount] = await pool.query(
      "SELECT COUNT(*) as total FROM phones WHERE status = 'In Stock'"
    );

    // Get total sold phones
    const [soldCount] = await pool.query(
      "SELECT COUNT(*) as total FROM phones WHERE status = 'Sold'"
    );

    // Get total profit
    const [profitSum] = await pool.query(
      'SELECT COALESCE(SUM(profit), 0) as total FROM sales'
    );

    // Get low stock alerts (brands with less than 5 phones)
    const [lowStock] = await pool.query(
      `SELECT brand, COUNT(*) as count 
       FROM phones 
       WHERE status = 'In Stock' 
       GROUP BY brand 
       HAVING count < 5
       ORDER BY count ASC`
    );

    // Get recent sales (last 5)
    const [recentSales] = await pool.query(
      `SELECT s.*, p.brand, p.model, p.imei
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       ORDER BY s.sale_date DESC
       LIMIT 5`
    );

    // Get top selling brands
    const [topBrands] = await pool.query(
      `SELECT p.brand, COUNT(*) as sales_count, SUM(s.profit) as total_profit
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       GROUP BY p.brand
       ORDER BY sales_count DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        totalInStock: stockCount[0].total,
        totalSold: soldCount[0].total,
        totalProfit: parseFloat(profitSum[0].total).toFixed(2),
        lowStockAlerts: lowStock,
        recentSales,
        topBrands
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { getDashboardStats };
