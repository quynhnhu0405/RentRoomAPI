-- Drop database if exists
DROP DATABASE IF EXISTS rentroom;

-- Create database
CREATE DATABASE rentroom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE rentroom;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create utilities table
CREATE TABLE utilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create packages table
CREATE TABLE packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in days',
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  categoryId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  area DECIMAL(10,2) NOT NULL,
  address VARCHAR(255) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  images TEXT,
  status ENUM('pending', 'active', 'rented', 'expired', 'rejected') DEFAULT 'pending',
  expiryDate DATETIME,
  featured BOOLEAN DEFAULT FALSE,
  viewCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create payments table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  packageId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(100),
  startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  endDate DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE
);

-- Create PostUtilities junction table for many-to-many relationship
CREATE TABLE PostUtilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  postId INT NOT NULL,
  utilityId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (utilityId) REFERENCES utilities(id) ON DELETE CASCADE,
  UNIQUE KEY post_utility_idx (postId, utilityId)
);

-- Create admin user
INSERT INTO users (name, phone, password, role, status)
VALUES ('Admin', '0123456789', '$2a$10$yfzoXAEJSRsJGYxDcXnp8e0ePvjlEEJuHBKv5QQfynzxM2Ux4qWuS', 'admin', 'active');
-- Password: admin123 (hashed with bcrypt)

-- Create initial categories
INSERT INTO categories (name) VALUES 
('Phòng trọ'), 
('Nhà nguyên căn'), 
('Căn hộ chung cư'),
('Nhà ở ghép');

-- Create initial utilities
INSERT INTO utilities (name) VALUES 
('Điều hòa'), 
('Tủ lạnh'), 
('Máy giặt'), 
('Bếp'), 
('Nhà vệ sinh riêng'),
('WiFi'), 
('Bãi đỗ xe'),
('Ban công');

-- Create initial packages
INSERT INTO packages (name, price, duration, description) VALUES 
('Cơ bản', 50000, 7, 'Gói cơ bản hiển thị tin 7 ngày'),
('Tiêu chuẩn', 100000, 15, 'Gói tiêu chuẩn hiển thị tin 15 ngày'),
('Cao cấp', 200000, 30, 'Gói cao cấp hiển thị tin 30 ngày với ưu tiên tìm kiếm'); 