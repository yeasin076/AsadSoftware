const { pool } = require('../config/database');

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

    const { customer_name, customer_phone, items, notes, memo_date } = req.body;

    if (!customer_name || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Customer name and at least one item are required' });
    }

    const totalAmount = items.reduce(
      (s, i) => s + (parseFloat(i.quantity || 1) * parseFloat(i.unit_price || 0)),
      0
    );

    const memoNumber = await generateMemoNumber(connection);
    const today = memo_date || new Date().toISOString().split('T')[0];

    const [result] = await connection.query(
      `INSERT INTO cash_memos (memo_number, type, customer_name, customer_phone, total_amount, notes, memo_date)
       VALUES (?, 'manual', ?, ?, ?, ?, ?)`,
      [memoNumber, customer_name, customer_phone || '', totalAmount, notes || null, today]
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
  createSaleMemo
};
