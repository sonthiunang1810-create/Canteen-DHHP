const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Danh sách Tài khoản mặc định
const users = [
  { username: "kitchen", password: "123", role: "kitchen", name: "Nhà Bếp Canteen" },
  { username: "admin", password: "123", role: "admin", name: "Quản Lý Canteen" }
];

let menu = [
  { id: 1, name: "Cơm tấm sườn nướng", price: 30000, category: "Cơm", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300", available: true },
  { id: 2, name: "Bún bò Huế đặc biệt", price: 35000, category: "Bún/Phở", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300", available: true },
  { id: 3, name: "Mì xào hải sản", price: 32000, category: "Mì", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300", available: false },
  { id: 4, name: "Trà sữa Thái xanh", price: 15000, category: "Đồ uống", image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=300", available: true }
];

let orders = [];

// API Đăng nhập
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { name: user.name, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: "Tài khoản hoặc mật khẩu không đúng!" });
  }
});

app.get('/api/menu', (req, res) => res.json(menu));

app.post('/api/menu/toggle', (req, res) => {
  const { id, available } = req.body;
  const item = menu.find(m => m.id === id);
  if (item) {
    item.available = available;
    io.emit('menu_updated', menu);
    res.json({ success: true, menu });
  } else {
    res.status(404).json({ error: "Không tìm thấy món" });
  }
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    studentCode: req.body.studentCode || "Khách vãng lai",
    items: req.body.items,
    total: req.body.total,
    table: req.body.table || "Bàn QR",
    status: 'Đang chuẩn bị',
    createdAt: new Date().toLocaleTimeString('vi-VN')
  };
  orders.unshift(newOrder);

  io.emit('new_order', newOrder);
  io.emit('sales_update', getSalesStats());
  res.json({ success: true, order: newOrder });
});

function getSalesStats() {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    ordersList: orders
  };
}

io.on('connection', (socket) => {
  socket.emit('sales_update', getSalesStats());
});

server.listen(5000, '0.0.0.0', () => console.log('Backend running on port 5000'));