-- Create Database
CREATE DATABASE IF NOT EXISTS phone_inventory;
USE phone_inventory;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('admin', 'manager') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Phones Table
CREATE TABLE IF NOT EXISTS phones (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_brand (brand),
  INDEX idx_imei (imei)
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  buying_price DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - buying_price) STORED,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_sale_date (sale_date),
  INDEX idx_phone_id (phone_id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role) 
VALUES (
  'admin', 
  'admin@phoneinventory.com', 
  '$2a$10$XQnBVxVVwMrJ0ZSVA8JXuOGVvKKKvKz9kx5UQJxRJzQNY6zJxGBCK',
  'System Administrator',
  'admin'
) ON DUPLICATE KEY UPDATE username=username;

-- Sample data for testing
INSERT INTO phones (brand, model, storage, color, imei, buying_price, selling_price, supplier_name, status) VALUES
('Apple', 'iPhone 15 Pro', '256GB', 'Natural Titanium', '351234567890123', 950.00, 1199.00, 'Tech Distributors Inc', 'In Stock'),
('Samsung', 'Galaxy S24 Ultra', '512GB', 'Titanium Black', '351234567890124', 1000.00, 1299.00, 'Samsung Direct', 'In Stock'),
('Apple', 'iPhone 14 Pro Max', '512GB', 'Deep Purple', '351234567890125', 850.00, 1099.00, 'Tech Distributors Inc', 'In Stock'),
('Google', 'Pixel 8 Pro', '256GB', 'Obsidian', '351234567890126', 700.00, 899.00, 'Google Store', 'In Stock'),
('Samsung', 'Galaxy Z Fold 5', '512GB', 'Phantom Black', '351234567890127', 1400.00, 1799.00, 'Samsung Direct', 'In Stock'),
('OnePlus', 'OnePlus 12', '256GB', 'Flowy Emerald', '351234567890128', 600.00, 799.00, 'OnePlus Official', 'In Stock'),
('Xiaomi', 'Xiaomi 14 Pro', '512GB', 'Titanium', '351234567890129', 650.00, 849.00, 'Xiaomi Store', 'In Stock'),
('Apple', 'iPhone 13', '128GB', 'Midnight', '351234567890130', 550.00, 699.00, 'Tech Distributors Inc', 'Sold'),
('Samsung', 'Galaxy S23', '256GB', 'Cream', '351234567890131', 600.00, 799.00, 'Samsung Direct', 'Sold'),
('Google', 'Pixel 7', '128GB', 'Snow', '351234567890132', 450.00, 599.00, 'Google Store', 'Sold');

-- Sample sales records for sold phones
INSERT INTO sales (phone_id, customer_name, customer_phone, selling_price, buying_price, notes) VALUES
(8, 'John Smith', '+1-555-0101', 699.00, 550.00, 'First time customer'),
(9, 'Sarah Johnson', '+1-555-0102', 799.00, 600.00, 'Referred by friend'),
(10, 'Michael Brown', '+1-555-0103', 599.00, 450.00, 'Repeat customer');
