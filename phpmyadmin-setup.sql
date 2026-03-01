-- Copy this entire file content
-- Go to http://localhost/phpmyadmin
-- Click "SQL" tab
-- Paste this content
-- Click "Go"

CREATE DATABASE IF NOT EXISTS phone_inventory;
USE phone_inventory;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE phones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  imei VARCHAR(50) UNIQUE NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  status ENUM('In Stock', 'Sold', 'Reserved') DEFAULT 'In Stock',
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_brand (brand)
);

CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_contact VARCHAR(50),
  sale_price DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (sale_price - (SELECT purchase_price FROM phones WHERE id = phone_id)) STORED,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_sale_date (sale_date)
);

-- Insert admin user (password: admin123)
INSERT INTO users (username, password, full_name, role) 
VALUES ('admin', '$2a$10$xQZ8vPYvJ5qK5y8X5y8X5OXxYvJ5qK5y8X5y8X5OXxYvJ5qK5y8X5O', 'Administrator', 'admin');

-- Insert sample phones
INSERT INTO phones (brand, model, imei, purchase_price, selling_price, status, purchase_date) VALUES
('Apple', 'iPhone 14 Pro', '352099876543210', 45000, 55000, 'In Stock', '2024-01-15'),
('Samsung', 'Galaxy S23 Ultra', '359876543210987', 42000, 52000, 'In Stock', '2024-01-16'),
('Apple', 'iPhone 13', '351234567890123', 35000, 42000, 'Sold', '2024-01-10'),
('Samsung', 'Galaxy A54', '358765432109876', 18000, 22000, 'In Stock', '2024-01-17'),
('Xiaomi', 'Redmi Note 12 Pro', '357654321098765', 12000, 15000, 'In Stock', '2024-01-18'),
('OnePlus', '11 Pro', '356543210987654', 28000, 34000, 'In Stock', '2024-01-19'),
('Oppo', 'Reno 8', '355432109876543', 16000, 20000, 'In Stock', '2024-01-20'),
('Vivo', 'V27 Pro', '354321098765432', 17000, 21000, 'In Stock', '2024-01-21'),
('Realme', 'GT 2 Pro', '353210987654321', 22000, 27000, 'Reserved', '2024-01-22'),
('Google', 'Pixel 7 Pro', '352109876543210', 32000, 38000, 'In Stock', '2024-01-23');

-- Insert sample sales
INSERT INTO sales (phone_id, customer_name, customer_contact, sale_price, sale_date) 
VALUES (3, 'John Doe', '01712345678', 42000, '2024-02-01');
