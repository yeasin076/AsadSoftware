const { pool } = require('../config/database');

// @desc    Get all phones with filters
// @route   GET /api/phones
// @access  Private
const getPhones = async (req, res) => {
  try {
    const { search, brand, status, page = 1, limit = 10 } = req.query;
    
    let query = 'SELECT * FROM phones WHERE 1=1';
    const params = [];

    // Search filter
    if (search) {
      query += ' AND (brand LIKE ? OR model LIKE ? OR imei LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Brand filter
    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    // Status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Order by latest first
    query += ' ORDER BY created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [phones] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM phones WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (brand LIKE ? OR model LIKE ? OR imei LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (brand) {
      countQuery += ' AND brand = ?';
      countParams.push(brand);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: phones,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get phones error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single phone by ID
// @route   GET /api/phones/:id
// @access  Private
const getPhoneById = async (req, res) => {
  try {
    const [phones] = await pool.query(
      'SELECT * FROM phones WHERE id = ?',
      [req.params.id]
    );

    if (phones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    res.json({
      success: true,
      data: phones[0]
    });
  } catch (error) {
    console.error('Get phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add new phone
// @route   POST /api/phones
// @access  Private
const addPhone = async (req, res) => {
  try {
    const {
      brand,
      model,
      storage,
      color,
      imei,
      buying_price,
      selling_price,
      supplier_name,
      status
    } = req.body;

    // Validate required fields
    if (!brand || !model || !storage || !color || !imei || !buying_price || !selling_price || !supplier_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Insert phone
    const [result] = await pool.query(
      `INSERT INTO phones (brand, model, storage, color, imei, buying_price, selling_price, supplier_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [brand, model, storage, color, imei, buying_price, selling_price, supplier_name, status || 'In Stock']
    );

    res.status(201).json({
      success: true,
      message: 'Phone added successfully',
      data: {
        id: result.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Add phone error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'IMEI already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update phone
// @route   PUT /api/phones/:id
// @access  Private
const updatePhone = async (req, res) => {
  try {
    const {
      brand,
      model,
      storage,
      color,
      imei,
      buying_price,
      selling_price,
      supplier_name,
      status
    } = req.body;

    // Check if phone exists
    const [phones] = await pool.query(
      'SELECT * FROM phones WHERE id = ?',
      [req.params.id]
    );

    if (phones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    // Update phone
    await pool.query(
      `UPDATE phones 
       SET brand = ?, model = ?, storage = ?, color = ?, imei = ?, 
           buying_price = ?, selling_price = ?, supplier_name = ?, status = ?
       WHERE id = ?`,
      [brand, model, storage, color, imei, buying_price, selling_price, supplier_name, status, req.params.id]
    );

    res.json({
      success: true,
      message: 'Phone updated successfully'
    });
  } catch (error) {
    console.error('Update phone error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'IMEI already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete phone
// @route   DELETE /api/phones/:id
// @access  Private
const deletePhone = async (req, res) => {
  try {
    // Check if phone exists
    const [phones] = await pool.query(
      'SELECT * FROM phones WHERE id = ?',
      [req.params.id]
    );

    if (phones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    // Delete phone
    await pool.query('DELETE FROM phones WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Phone deleted successfully'
    });
  } catch (error) {
    console.error('Delete phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all unique brands
// @route   GET /api/phones/brands/list
// @access  Private
const getBrands = async (req, res) => {
  try {
    const [brands] = await pool.query(
      'SELECT DISTINCT brand FROM phones ORDER BY brand ASC'
    );

    res.json({
      success: true,
      data: brands.map(b => b.brand)
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getPhones,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone,
  getBrands
};
