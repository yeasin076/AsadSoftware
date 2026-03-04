const { pool } = require('../config/database');

// ── Ensure paid_amount / due_amount columns exist (runs at startup) ──────────
const runMigration = async () => {
  try {
    const [[{ db }]] = await pool.query(`SELECT DATABASE() AS db`);
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_memos'
       AND COLUMN_NAME IN ('paid_amount','due_amount')`,
      [db]
    );
    const existing = cols.map(c => c.COLUMN_NAME);
    if (!existing.includes('paid_amount')) {
      await pool.query(`ALTER TABLE cash_memos ADD COLUMN paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0`);
    }
    if (!existing.includes('due_amount')) {
      await pool.query(`ALTER TABLE cash_memos ADD COLUMN due_amount  DECIMAL(10,2) NOT NULL DEFAULT 0`);
    }
  } catch (e) {
    console.error('CashMemo migration error:', e.message);
  }
};

// ── Internal helper: generate memo number like CM-2026-0001 ──────────────────
const generateMemoNumber = async (conn) => {
  const year = new Date().getFullYear();
  const [rows] = await (conn || pool).query(
    `SELECT COUNT(*) as cnt FROM cash_memos WHERE YEAR(created_at) = ?`,
    [year]
  );
  const num = (rows[0].cnt + 1).toString().padStart(4, '0');
  return `CM-${year}-${num}`;
};

// ── Called from salesController within its transaction ──────────────────────
const createSaleMemo = async (saleId, phone, customerName, customerPhone, conn) => {
  const memoNumber = await generateMemoNumber(conn);
  const today = new Date().toISOString().split('T')[0];

  const [memoResult] = await (conn || pool).query(
    `INSERT INTO cash_memos (memo_number, type, sale_id, customer_name, customer_phone, total_amount, memo_date)
     VALUES (?, 'sale', ?, ?, ?, ?, ?)`,
    [memoNumber, saleId, customerName, customerPhone || '', phone.selling_price, today]
  );

  const memoId = memoResult.insertId;
  const itemDesc = `${phone.brand} ${phone.model} (${phone.storage} / ${phone.color}) — IMEI: ${phone.imei}`;

  await (conn || pool).query(
    `INSERT INTO cash_memo_items (memo_id, description, quantity, unit_price) VALUES (?, ?, 1, ?)`,
    [memoId, itemDesc, phone.selling_price]
  );

  return { memoId, memoNumber };
};

// ── GET /api/cashmemo ────────────────────────────────────────────────────────
const getMemos = async (req, res) => {
  try {
    const [memos] = await pool.query(
      `SELECT * FROM cash_memos ORDER BY created_at DESC`
    );
    res.json({ success: true, data: memos });
  } catch (error) {
    console.error('Get memos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/cashmemo/:id ────────────────────────────────────────────────────
const getMemoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [memos] = await pool.query(
      `SELECT cm.*,
              s.profit, s.buying_price as sale_buying_price,
              p.brand, p.model, p.imei, p.storage, p.color
       FROM cash_memos cm
       LEFT JOIN sales s   ON cm.sale_id  = s.id
       LEFT JOIN phones p  ON s.phone_id  = p.id
       WHERE cm.id = ?`,
      [id]
    );

    if (memos.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    const [items] = await pool.query(
      `SELECT * FROM cash_memo_items WHERE memo_id = ? ORDER BY id ASC`,
      [id]
    );

    res.json({ success: true, data: { ...memos[0], items } });
  } catch (error) {
    console.error('Get memo by id error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/cashmemo — Create manual memo ──────────────────────────────────
const createMemo = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_name, customer_phone, items, notes, memo_date, paid_amount } = req.body;

    if (!customer_name || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Customer name and at least one item are required' });
    }

    const totalAmount = items.reduce(
      (s, i) => s + (parseFloat(i.quantity || 1) * parseFloat(i.unit_price || 0)),
      0
    );

    const paidAmt  = Math.min(parseFloat(paid_amount ?? totalAmount), totalAmount);
    const dueAmt   = Math.max(totalAmount - paidAmt, 0);

    const memoNumber = await generateMemoNumber(connection);
    const today = memo_date || new Date().toISOString().split('T')[0];

    const [result] = await connection.query(
      `INSERT INTO cash_memos (memo_number, type, customer_name, customer_phone, total_amount, paid_amount, due_amount, notes, memo_date)
       VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?)`,
      [memoNumber, customer_name, customer_phone || '', totalAmount, paidAmt, dueAmt, notes || null, today]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO cash_memo_items (memo_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [result.insertId, item.description, parseInt(item.quantity) || 1, parseFloat(item.unit_price) || 0]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Cash memo created',
      data: { id: result.insertId, memo_number: memoNumber }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create memo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

// ── PATCH /api/cashmemo/:id/payment — Update paid amount ────────────────────
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_payment } = req.body;

    const [[memo]] = await pool.query(`SELECT * FROM cash_memos WHERE id = ?`, [id]);
    if (!memo) return res.status(404).json({ success: false, message: 'Memo not found' });

    const newPaid = Math.min(parseFloat(memo.paid_amount) + parseFloat(additional_payment || 0), parseFloat(memo.total_amount));
    const newDue  = Math.max(parseFloat(memo.total_amount) - newPaid, 0);

    await pool.query(
      `UPDATE cash_memos SET paid_amount = ?, due_amount = ? WHERE id = ?`,
      [newPaid, newDue, id]
    );

    res.json({ success: true, message: 'Payment updated', data: { paid_amount: newPaid, due_amount: newDue } });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/cashmemo/:id ─────────────────────────────────────────────────
const deleteMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM cash_memos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    await pool.query('DELETE FROM cash_memos WHERE id = ?', [id]);
    res.json({ success: true, message: 'Memo deleted' });
  } catch (error) {
    console.error('Delete memo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMemos,
  getMemoById,
  createMemo,
  deleteMemo,
  updatePayment,
  createSaleMemo,
  runMigration
};
