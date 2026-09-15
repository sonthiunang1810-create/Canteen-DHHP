const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- KẾT NỐI MYSQL CLOUD (AIVEN) ---
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'defaultdb',
  port: process.env.DB_PORT || 27914,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // Bắt buộc cho Aiven Cloud
});

// Khởi tạo bảng tự động
async function initDatabase() {
  try {
    const connection = await db.getConnection();
    console.log('✅ Đã kết nối thành công tới Aiven MySQL Database!');

    // 1. Bảng users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        name VARCHAR(100),
        role ENUM('admin', 'kitchen', 'student') DEFAULT 'student'
      );
    `);

    // 2. Bảng menu
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        category VARCHAR(100),
        image TEXT,
        is_available BOOLEAN DEFAULT TRUE
      );
    `);

    // 3. Bảng orders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        student_name VARCHAR(100),
        total_price INT NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'QR',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Bảng order_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        menu_id INT,
        quantity INT,
        price INT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // Thêm tài khoản mặc định nếu chưa có
    const [users] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
    if (users.length === 0) {
      await connection.query(`
        INSERT INTO users (username, password, name, role) VALUES 
        ('kitchen', '123', 'Nhà Bếp Canteen', 'kitchen'),
        ('admin', '123', 'Quản lý Canteen', 'admin');
      `);
      console.log('✨ Đã tạo tài khoản mặc định (admin/kitchen)');
    }

    connection.release();
    console.log(' Đã kiểm tra và khởi tạo xong các bảng Database!');
  } catch (error) {
    console.error(' Lỗi kết nối hoặc khởi tạo Database:', error.message);
  }
}

initDatabase();

// --- API AUTH & TÀI KHOẢN ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT id, username, role, name, email FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    res.json({ message: 'Đăng nhập thành công', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, email, password, name } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const [result] = await db.query(
      'INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, "student")',
      [username, email, password, name || username]
    );

    res.json({ message: 'Đăng ký tài khoản thành công', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API MENU ---
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', async (req, res) => {
  const { name, price, category, image, is_available } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO menu (name, price, category, image, is_available) VALUES (?, ?, ?, ?, ?)',
      [name, price, category, image, is_available ?? true]
    );

    const [newItem] = await db.query('SELECT * FROM menu WHERE id = ?', [result.insertId]);
    io.emit('menu_updated');
    res.json(newItem[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { is_available } = req.body;
  try {
    await db.query('UPDATE menu SET is_available = ? WHERE id = ?', [is_available, id]);
    io.emit('menu_updated');
    res.json({ message: 'Cập nhật trạng thái món thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API ORDERS ---
app.post('/api/orders', async (req, res) => {
  const { user_id, student_name, items, total_price, payment_method } = req.body;
  try {
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, student_name, total_price, payment_method, status) VALUES (?, ?, ?, ?, "Pending")',
      [user_id, student_name, total_price, payment_method || 'QR']
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    }

    const newOrder = { id: orderId, user_id, student_name, items, total_price, status: 'Pending', created_at: new Date() };
    io.emit('new_order', newOrder);

    res.json({ message: 'Đặt món thành công', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    io.emit('order_status_changed', { orderId: id, status });
    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- REALTIME SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('⚡ Client kết nối Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔥 Client ngắt kết nối:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại cổng http://localhost:${PORT}`);
});