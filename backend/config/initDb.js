const { pool } = require('./database');

const initDb = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      role ENUM('admin', 'manager') DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS phones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brand VARCHAR(50) NOT NULL,
      model VARCHAR(100) NOT NULL,
      storage VARCHAR(20) NOT NULL,
      color VARCHAR(30) NOT NULL,
      imei VARCHAR(20) UNIQUE NOT NULL,
      buying_price DECIMAL(10, 2) NOT NULL,
      selling_price DECIMAL(10, 2) NOT NULL,
      supplier_name VARCHAR(100) NOT NULL,
      status ENUM('In Stock', 'Sold') DEFAULT 'In Stock',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone_id INT NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      selling_price DECIMAL(10, 2) NOT NULL,
      buying_price DECIMAL(10, 2) NOT NULL,
      profit DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - buying_price) STORED,
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(50) DEFAULT 'General',
      expense_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS investments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      investor_name VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      investment_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS cash_memos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      memo_number VARCHAR(50) UNIQUE NOT NULL,
      type VARCHAR(20) DEFAULT 'sale',
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(20),
      sale_id INT,
      items JSON,
      subtotal DECIMAL(10,2) DEFAULT 0,
      discount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) DEFAULT 0,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      due_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      memo_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS cash_memo_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      memo_id INT NOT NULL,
      description TEXT,
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
      FOREIGN KEY (memo_id) REFERENCES cash_memos(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS exchanges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      memo_number VARCHAR(30),
      stock_phone_id INT,
      stock_phone_brand VARCHAR(50) DEFAULT '',
      stock_phone_model VARCHAR(100) DEFAULT '',
      stock_phone_storage VARCHAR(20) DEFAULT '',
      stock_phone_color VARCHAR(30) DEFAULT '',
      stock_phone_imei VARCHAR(20) DEFAULT '',
      stock_phone_price DECIMAL(10,2) DEFAULT 0,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone_contact VARCHAR(20) DEFAULT '',
      customer_phone_brand VARCHAR(50) DEFAULT '',
      customer_phone_model VARCHAR(100) DEFAULT '',
      customer_phone_storage VARCHAR(20) DEFAULT '',
      customer_phone_color VARCHAR(30) DEFAULT '',
      customer_phone_imei VARCHAR(20) DEFAULT '',
      customer_phone_value DECIMAL(10,2) DEFAULT 0,
      money_direction ENUM('customer_pays','store_pays','equal') DEFAULT 'equal',
      money_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      new_stock_phone_id INT,
      notes TEXT,
      exchange_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_exchange_date (exchange_date)
    )`,

    `INSERT INTO users (username, email, password, full_name, role)
     VALUES (
       'admin',
       'admin@phoneinventory.com',
       '$2a$10$oCBHoMjkB3u6dnZpAi9x3u.vwW6UOUCZBHC31hCjYhq8NsdEFri4C',
       'System Administrator',
       'admin'
     ) ON DUPLICATE KEY UPDATE
       password = '$2a$10$oCBHoMjkB3u6dnZpAi9x3u.vwW6UOUCZBHC31hCjYhq8NsdEFri4C'`
  ];

  for (const query of queries) {
    await pool.query(query);
  }

  // Migrations: add columns to existing tables that may have old schema
  // Note: no IF NOT EXISTS — MySQL doesn't support it; duplicate column errors are caught and ignored
  const migrations = [
    // cash_memos missing columns
    `ALTER TABLE cash_memos ADD COLUMN type VARCHAR(20) DEFAULT 'sale'`,
    `ALTER TABLE cash_memos ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE cash_memos ADD COLUMN paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE cash_memos ADD COLUMN due_amount DECIMAL(10,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE cash_memos ADD COLUMN memo_date DATE`,
    // exchanges — old schema used different column names; add all new columns
    `ALTER TABLE exchanges ADD COLUMN memo_number VARCHAR(30)`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_id INT`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_brand VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_model VARCHAR(100) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_storage VARCHAR(20) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_color VARCHAR(30) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_imei VARCHAR(20) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN stock_phone_price DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_contact VARCHAR(20) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_brand VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_model VARCHAR(100) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_storage VARCHAR(20) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_color VARCHAR(30) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_imei VARCHAR(20) DEFAULT ''`,
    `ALTER TABLE exchanges ADD COLUMN customer_phone_value DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE exchanges ADD COLUMN money_direction ENUM('customer_pays','store_pays','equal') DEFAULT 'equal'`,
    `ALTER TABLE exchanges ADD COLUMN money_amount DECIMAL(10,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE exchanges ADD COLUMN new_stock_phone_id INT`,
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
    } catch (e) {
      // Duplicate column (1060) = already exists, safe to ignore
      if (e.errno !== 1060) console.warn('Migration warning:', e.message);
    }
  }

  console.log('✓ Database tables initialized');
};

module.exports = { initDb };
