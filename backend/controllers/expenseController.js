const { pool } = require('../config/database');

// @desc    Get all expenses with optional date filter
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { type, date, month, year } = req.query;
    let whereClause = '';
    let params = [];

    if (type === 'daily' && date) {
      whereClause = 'WHERE expense_date = ?';
      params = [date];
    } else if (type === 'monthly' && month && year) {
      whereClause = 'WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      params = [month, year];
    } else if (type === 'yearly' && year) {
      whereClause = 'WHERE YEAR(expense_date) = ?';
      params = [year];
    }

    const [expenses] = await pool.query(
      `SELECT * FROM expenses ${whereClause} ORDER BY expense_date DESC, created_at DESC`,
      params
    );

    const [summary] = await pool.query(
      `SELECT SUM(amount) as total_expense FROM expenses ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        expenses,
        totalExpense: parseFloat(summary[0].total_expense || 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, expense_date, notes } = req.body;

    if (!title || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount and date are required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (title, amount, category, expense_date, notes) VALUES (?, ?, ?, ?, ?)`,
      [title, parseFloat(amount), category || 'General', expense_date, notes || null]
    );

    const [newExpense] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: newExpense[0]
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get profit vs expense summary (daily / monthly / yearly)
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = async (req, res) => {
  try {
    const { type, date, month, year } = req.query;

    let salesWhere = '';
    let expenseWhere = '';
    let salesParams = [];
    let expenseParams = [];

    if (type === 'daily' && date) {
      salesWhere = 'WHERE DATE(s.sale_date) = ?';
      expenseWhere = 'WHERE expense_date = ?';
      salesParams = [date];
      expenseParams = [date];
    } else if (type === 'monthly' && month && year) {
      salesWhere = 'WHERE MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?';
      expenseWhere = 'WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      salesParams = [month, year];
      expenseParams = [month, year];
    } else if (type === 'yearly' && year) {
      salesWhere = 'WHERE YEAR(s.sale_date) = ?';
      expenseWhere = 'WHERE YEAR(expense_date) = ?';
      salesParams = [year];
      expenseParams = [year];
    }

    const [profitResult] = await pool.query(
      `SELECT SUM(s.profit) as total_profit FROM sales s ${salesWhere}`,
      salesParams
    );

    const [expenseResult] = await pool.query(
      `SELECT SUM(amount) as total_expense FROM expenses ${expenseWhere}`,
      expenseParams
    );

    const totalProfit = parseFloat(profitResult[0].total_profit || 0);
    const totalExpense = parseFloat(expenseResult[0].total_expense || 0);
    const netProfit = totalProfit - totalExpense;

    res.json({
      success: true,
      data: {
        totalProfit: totalProfit.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        netProfit: netProfit.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Expense summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, expense_date, notes } = req.body;

    if (!title || !amount || !expense_date) {
      return res.status(400).json({ success: false, message: 'Title, amount and date are required' });
    }

    const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await pool.query(
      `UPDATE expenses SET title = ?, amount = ?, category = ?, expense_date = ?, notes = ? WHERE id = ?`,
      [title, parseFloat(amount), category || 'General', expense_date, notes || null, id]
    );

    const [updated] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense updated', data: updated[0] });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
