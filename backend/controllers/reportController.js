const { pool } = require('../config/database');

// @desc    Get daily sales report
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [sales] = await pool.query(
      `SELECT s.*, p.brand, p.model, p.imei
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       WHERE DATE(s.sale_date) = ?
       ORDER BY s.sale_date DESC`,
      [targetDate]
    );

    const [summary] = await pool.query(
      `SELECT 
         COUNT(*) as total_sales,
         SUM(s.selling_price) as total_revenue,
         SUM(s.profit) as total_profit
       FROM sales s
       WHERE DATE(s.sale_date) = ?`,
      [targetDate]
    );

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalSales: summary[0].total_sales,
          totalRevenue: parseFloat(summary[0].total_revenue || 0).toFixed(2),
          totalProfit: parseFloat(summary[0].total_profit || 0).toFixed(2)
        },
        sales
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get monthly sales report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || (new Date().getMonth() + 1);
    const targetYear = year || new Date().getFullYear();

    // Get daily breakdown
    const [dailyBreakdown] = await pool.query(
      `SELECT 
         DATE(s.sale_date) as date,
         COUNT(*) as sales_count,
         SUM(s.selling_price) as revenue,
         SUM(s.profit) as profit
       FROM sales s
       WHERE MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?
       GROUP BY DATE(s.sale_date)
       ORDER BY date ASC`,
      [targetMonth, targetYear]
    );

    // Get brand breakdown
    const [brandBreakdown] = await pool.query(
      `SELECT 
         p.brand,
         COUNT(*) as sales_count,
         SUM(s.selling_price) as revenue,
         SUM(s.profit) as profit
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       WHERE MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?
       GROUP BY p.brand
       ORDER BY sales_count DESC`,
      [targetMonth, targetYear]
    );

    // Get monthly summary
    const [summary] = await pool.query(
      `SELECT 
         COUNT(*) as total_sales,
         SUM(s.selling_price) as total_revenue,
         SUM(s.profit) as total_profit
       FROM sales s
       WHERE MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?`,
      [targetMonth, targetYear]
    );

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        summary: {
          totalSales: summary[0].total_sales,
          totalRevenue: parseFloat(summary[0].total_revenue || 0).toFixed(2),
          totalProfit: parseFloat(summary[0].total_profit || 0).toFixed(2)
        },
        dailyBreakdown,
        brandBreakdown
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get sales by brand
// @route   GET /api/reports/brand
// @access  Private
const getBrandReport = async (req, res) => {
  try {
    const { brand } = req.query;

    if (!brand) {
      return res.status(400).json({
        success: false,
        message: 'Please provide brand name'
      });
    }

    const [sales] = await pool.query(
      `SELECT s.*, p.brand, p.model, p.imei
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       WHERE p.brand = ?
       ORDER BY s.sale_date DESC`,
      [brand]
    );

    const [summary] = await pool.query(
      `SELECT 
         COUNT(*) as total_sales,
         SUM(s.selling_price) as total_revenue,
         SUM(s.profit) as total_profit
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       WHERE p.brand = ?`,
      [brand]
    );

    res.json({
      success: true,
      data: {
        brand,
        summary: {
          totalSales: summary[0].total_sales,
          totalRevenue: parseFloat(summary[0].total_revenue || 0).toFixed(2),
          totalProfit: parseFloat(summary[0].total_profit || 0).toFixed(2)
        },
        sales
      }
    });
  } catch (error) {
    console.error('Brand report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getBrandReport
};
