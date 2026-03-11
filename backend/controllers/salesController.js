const { pool } = require('../config/database');
const { createSaleMemo } = require('./cashMemoController');

// @desc    Sell a phone
// @route   POST /api/sales
// @access  Private
const sellPhone = async (req, res) => {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const { phone_id, customer_name, customer_phone, notes } = req.body;

    // Validate input
    if (!phone_id || !customer_name || !customer_phone) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if phone exists and is in stock
    const [phones] = await connection.query(
      "SELECT * FROM phones WHERE id = ? AND status = 'In Stock'",
      [phone_id]
    );

    if (phones.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phone not found or already sold'
      });
    }

    const phone = phones[0];

    // Create sale record
    const [saleResult] = await connection.query(
      `INSERT INTO sales (phone_id, customer_name, customer_phone, selling_price, buying_price, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [phone_id, customer_name, customer_phone, phone.selling_price, phone.buying_price, notes || null]
    );

    // Update phone status to Sold
    await connection.query(
      "UPDATE phones SET status = 'Sold' WHERE id = ?",
      [phone_id]
    );

    // Commit the sale first so the FK reference is visible for memo creation
    await connection.commit();
    committed = true;
    connection.release();

    // Auto-generate cash memo AFTER committing (uses pool, not transaction)
    let memoInfo = { memoId: null, memoNumber: null };
    try {
      memoInfo = await createSaleMemo(
        saleResult.insertId, phone, customer_name, customer_phone, null
      );
    } catch (memoError) {
      console.error('Memo creation failed (sale was recorded):', memoError);
    }

    res.status(201).json({
      success: true,
      message: 'Phone sold successfully',
      data: {
        sale_id: saleResult.insertId,
        profit: parseFloat(phone.selling_price - phone.buying_price).toFixed(2),
        memo_id: memoInfo.memoId,
        memo_number: memoInfo.memoNumber
      }
    });
  } catch (error) {
    if (!committed) {
      try { await connection.rollback(); } catch {}
      connection.release();
    }
    console.error('Sell phone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all sales with filters
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, brand, startDate, endDate, search } = req.query;
    
    let query = `
      SELECT s.*, p.brand, p.model, p.storage, p.color, p.imei,
             cm.id as memo_id, cm.memo_number
      FROM sales s
      JOIN phones p ON s.phone_id = p.id
      LEFT JOIN cash_memos cm ON cm.sale_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Brand filter
    if (brand) {
      query += ' AND p.brand = ?';
      params.push(brand);
    }

    // Search filter
    if (search) {
      query += ' AND (s.customer_name LIKE ? OR s.customer_phone LIKE ? OR p.imei LIKE ? OR p.model LIKE ? OR p.brand LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    // Date range filter
    if (startDate) {
      query += ' AND DATE(s.sale_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(s.sale_date) <= ?';
      params.push(endDate);
    }

    // Order by latest first
    query += ' ORDER BY s.sale_date DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [sales] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM sales s
      JOIN phones p ON s.phone_id = p.id
      WHERE 1=1
    `;
    const countParams = [];

    if (brand) {
      countQuery += ' AND p.brand = ?';
      countParams.push(brand);
    }

    if (search) {
      countQuery += ' AND (s.customer_name LIKE ? OR s.customer_phone LIKE ? OR p.imei LIKE ? OR p.model LIKE ? OR p.brand LIKE ?)';
      const like = `%${search}%`;
      countParams.push(like, like, like, like, like);
    }

    if (startDate) {
      countQuery += ' AND DATE(s.sale_date) >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND DATE(s.sale_date) <= ?';
      countParams.push(endDate);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
  try {
    const [sales] = await pool.query(
      `SELECT s.*, p.brand, p.model, p.storage, p.color, p.imei
       FROM sales s
       JOIN phones p ON s.phone_id = p.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: sales[0]
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  sellPhone,
  getSales,
  getSaleById
};
