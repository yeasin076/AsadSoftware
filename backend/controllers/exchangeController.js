const { pool } = require('../config/database');

// Ensure exchanges table exists
const initExchangeTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS exchanges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      memo_number VARCHAR(30),
      stock_phone_id INT NOT NULL,
      stock_phone_brand VARCHAR(50) NOT NULL,
      stock_phone_model VARCHAR(100) NOT NULL,
      stock_phone_storage VARCHAR(20) NOT NULL,
      stock_phone_color VARCHAR(30) NOT NULL,
      stock_phone_imei VARCHAR(20) NOT NULL,
      stock_phone_price DECIMAL(10,2) NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone_contact VARCHAR(20) NOT NULL,
      customer_phone_brand VARCHAR(50) NOT NULL,
      customer_phone_model VARCHAR(100) NOT NULL,
      customer_phone_storage VARCHAR(20) NOT NULL,
      customer_phone_color VARCHAR(30) NOT NULL,
      customer_phone_imei VARCHAR(20) NOT NULL,
      customer_phone_value DECIMAL(10,2) NOT NULL,
      money_direction ENUM('customer_pays','store_pays','equal') NOT NULL,
      money_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      new_stock_phone_id INT,
      notes TEXT,
      exchange_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stock_phone_id) REFERENCES phones(id) ON DELETE CASCADE,
      INDEX idx_exchange_date (exchange_date)
    )
  `);

  // Migration: add memo_number column if it doesn't exist
  const [[existing]] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exchanges' AND COLUMN_NAME = 'memo_number'`
  );
  if (!existing) {
    await pool.query(`ALTER TABLE exchanges ADD COLUMN memo_number VARCHAR(30) AFTER id`);
  }
};

initExchangeTable().catch(console.error);

// @desc    Get all exchanges
// @route   GET /api/exchanges
// @access  Private
const getExchanges = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [exchanges] = await pool.query(
      `SELECT * FROM exchanges ORDER BY exchange_date DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM exchanges`);

    res.json({
      success: true,
      data: exchanges,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('Get exchanges error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Process an exchange
// @route   POST /api/exchanges
// @access  Private
const processExchange = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      stock_phone_id,
      customer_name,
      customer_phone_contact,
      customer_phone_brand,
      customer_phone_model,
      customer_phone_storage,
      customer_phone_color,
      customer_phone_imei,
      customer_phone_value,
      notes,
    } = req.body;

    // Fetch the stock phone
    const [[stockPhone]] = await conn.query(
      `SELECT * FROM phones WHERE id = ? AND status = 'In Stock'`,
      [stock_phone_id]
    );

    if (!stockPhone) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Stock phone not found or already sold' });
    }

    const stockPrice = parseFloat(stockPhone.selling_price);
    const custValue = parseFloat(customer_phone_value);
    const diff = stockPrice - custValue;

    let money_direction = 'equal';
    let money_amount = 0;

    if (diff > 0) {
      money_direction = 'customer_pays';
      money_amount = diff;
    } else if (diff < 0) {
      money_direction = 'store_pays';
      money_amount = Math.abs(diff);
    }

    // Mark stock phone as Sold
    await conn.query(
      `UPDATE phones SET status = 'Sold' WHERE id = ?`,
      [stock_phone_id]
    );

    // Add customer's phone to stock
    const [insertResult] = await conn.query(
      `INSERT INTO phones (brand, model, storage, color, imei, buying_price, selling_price, supplier_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'In Stock')`,
      [
        customer_phone_brand,
        customer_phone_model,
        customer_phone_storage,
        customer_phone_color,
        customer_phone_imei,
        custValue,      // buying price = value given to customer
        custValue,      // selling price initially same (can be edited later)
        customer_name,
      ]
    );

    const newStockPhoneId = insertResult.insertId;

    // Generate memo number before insert
    const year = new Date().getFullYear();
    const [[{ cnt }]] = await conn.query(
      `SELECT COUNT(*) as cnt FROM exchanges WHERE YEAR(exchange_date) = ?`, [year]
    );
    const memoNumber = `EX-${year}-${String(cnt + 1).padStart(4, '0')}`;

    // Record the exchange
    const [exchangeResult] = await conn.query(
      `INSERT INTO exchanges (
        memo_number,
        stock_phone_id, stock_phone_brand, stock_phone_model, stock_phone_storage,
        stock_phone_color, stock_phone_imei, stock_phone_price,
        customer_name, customer_phone_contact,
        customer_phone_brand, customer_phone_model, customer_phone_storage,
        customer_phone_color, customer_phone_imei, customer_phone_value,
        money_direction, money_amount, new_stock_phone_id, notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        memoNumber,
        stock_phone_id,
        stockPhone.brand, stockPhone.model, stockPhone.storage,
        stockPhone.color, stockPhone.imei, stockPhone.selling_price,
        customer_name, customer_phone_contact,
        customer_phone_brand, customer_phone_model, customer_phone_storage,
        customer_phone_color, customer_phone_imei, customer_phone_value,
        money_direction, money_amount, newStockPhoneId,
        notes || null,
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Exchange processed successfully',
      data: {
        exchange_id: exchangeResult.insertId,
        memo_number: memoNumber,
        exchange_date: new Date().toISOString(),
        // stock phone
        stock_phone: stockPhone,
        // customer info
        customer_name,
        customer_phone_contact,
        // customer's phone
        customer_phone: {
          brand: customer_phone_brand,
          model: customer_phone_model,
          storage: customer_phone_storage,
          color: customer_phone_color,
          imei: customer_phone_imei,
          value: customer_phone_value,
        },
        money_direction,
        money_amount,
        notes: notes || '',
        new_stock_phone_id: newStockPhoneId,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Process exchange error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    conn.release();
  }
};

// @desc    Delete an exchange record
// @route   DELETE /api/exchanges/:id
// @access  Private
const deleteExchange = async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM exchanges WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exchange not found' });
    }
    res.json({ success: true, message: 'Exchange record deleted' });
  } catch (error) {
    console.error('Delete exchange error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getExchanges, processExchange, deleteExchange };
