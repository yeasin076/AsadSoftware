const { pool } = require('../config/database');

// @desc    Get all investments with aggregated revenue & profit
// @route   GET /api/investments
// @access  Private
const getInvestments = async (req, res) => {
  try {
    const [investments] = await pool.query(
      `SELECT 
         i.*,
         COALESCE(SUM(r.revenue_amount), 0) AS total_revenue,
         COALESCE(SUM(r.revenue_amount), 0) - i.invested_amount AS total_profit
       FROM investments i
       LEFT JOIN investment_returns r ON r.investment_id = i.id
       GROUP BY i.id
       ORDER BY i.investment_date DESC, i.created_at DESC`
    );

    res.json({ success: true, data: investments });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new investment
// @route   POST /api/investments
// @access  Private
const addInvestment = async (req, res) => {
  try {
    const { title, invested_amount, category, investment_date, description } = req.body;

    if (!title || !invested_amount || !investment_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, invested amount and date are required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO investments (title, invested_amount, category, investment_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [title, parseFloat(invested_amount), category || 'General', investment_date, description || null]
    );

    const [newInv] = await pool.query(
      `SELECT i.*, 0 AS total_revenue, -i.invested_amount AS total_profit
       FROM investments i WHERE i.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Investment added successfully', data: newInv[0] });
  } catch (error) {
    console.error('Add investment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update investment status (Active / Closed)
// @route   PATCH /api/investments/:id/status
// @access  Private
const updateInvestmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.query('UPDATE investments SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an investment (cascades returns)
// @route   DELETE /api/investments/:id
// @access  Private
const deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM investments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    await pool.query('DELETE FROM investments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Investment deleted' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all revenue entries for a specific investment
// @route   GET /api/investments/:id/returns
// @access  Private
const getReturns = async (req, res) => {
  try {
    const { id } = req.params;
    const [returns] = await pool.query(
      `SELECT * FROM investment_returns WHERE investment_id = ? ORDER BY return_date DESC`,
      [id]
    );
    res.json({ success: true, data: returns });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a revenue entry to an investment
// @route   POST /api/investments/:id/returns
// @access  Private
const addReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { revenue_amount, return_date, notes } = req.body;

    if (!revenue_amount || !return_date) {
      return res.status(400).json({ success: false, message: 'Revenue amount and date are required' });
    }

    const [inv] = await pool.query('SELECT id FROM investments WHERE id = ?', [id]);
    if (inv.length === 0) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO investment_returns (investment_id, revenue_amount, return_date, notes)
       VALUES (?, ?, ?, ?)`,
      [id, parseFloat(revenue_amount), return_date, notes || null]
    );

    const [newReturn] = await pool.query('SELECT * FROM investment_returns WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Revenue entry added', data: newReturn[0] });
  } catch (error) {
    console.error('Add return error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a revenue entry
// @route   DELETE /api/investments/returns/:returnId
// @access  Private
const deleteReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    await pool.query('DELETE FROM investment_returns WHERE id = ?', [returnId]);
    res.json({ success: true, message: 'Revenue entry deleted' });
  } catch (error) {
    console.error('Delete return error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getInvestments,
  addInvestment,
  updateInvestmentStatus,
  deleteInvestment,
  getReturns,
  addReturn,
  deleteReturn
};
