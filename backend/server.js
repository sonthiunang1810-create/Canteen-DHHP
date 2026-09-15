const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const staffUsers = [
  { username: "kitchen", password: "123", role: "kitchen", name: "Nhà Bếp Canteen" },
  { username: "admin", password: "123", role: "admin", name: "Quản Lý Canteen" }
];

let studentUsers = [];

let menu = [
  { id: 1, name: "Cơm tấm sườn nướng", price: 30000, category: "Cơm Tấm", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300", available: true },
  { id: 2, name: "Cơm tấm sườn bì chả", price: 35000, category: "Cơm Tấm", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=300", available: true },
  { id: 3, name: "Cơm tấm gà quay xối mỡ", price: 35000, category: "Cơm Tấm", image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300", available: true },
  { id: 4, name: "Cơm tấm chả trứng ốp la", price: 25000, category: "Cơm Tấm", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300", available: true },
  { id: 5, name: "Cơm tấm xá xíu đặc biệt", price: 32000, category: "Cơm Tấm", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300", available: true },

  { id: 6, name: "Bún bò Huế đặc biệt", price: 35000, category: "Bún Bò", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300", available: true },
  { id: 7, name: "Bún bò giò heo", price: 40000, category: "Bún Bò", image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=300", available: true },
  { id: 8, name: "Bún bò tái nạm", price: 35000, category: "Bún Bò", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300", available: true },
  { id: 9, name: "Bún bò chả cua", price: 32000, category: "Bún Bò", image: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=300", available: true },
  { id: 10, name: "Bún bò gân bò thập cẩm", price: 42000, category: "Bún Bò", image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=300", available: true },

  { id: 11, name: "Mì xào hải sản", price: 32000, category: "Mì Xào", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300", available: true },
  { id: 12, name: "Mì xào bò rau cải", price: 30000, category: "Mì Xào", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300", available: true },
  { id: 13, name: "Mì xào trứng xúc xích", price: 22000, category: "Mì Xào", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300", available: true },
  { id: 14, name: "Mì xào giòn thập cẩm", price: 35000, category: "Mì Xào", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300", available: true },
  { id: 15, name: "Mì Ý xốt bò bằm (Spaghetti)", price: 30000, category: "Mì Xào", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300", available: true },

  { id: 16, name: "Trà sữa Thái xanh", price: 15000, category: "Trà & Đồ Uống", image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=300", available: true },
  { id: 17, name: "Trà chanh giã tay", price: 12000, category: "Trà & Đồ Uống", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300", available: true },
  { id: 18, name: "Trà đào cam sả", price: 20000, category: "Trà & Đồ Uống", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300", available: true },
  { id: 19, name: "Trà quất mật ong ice", price: 12000, category: "Trà & Đồ Uống", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300", available: true },
  { id: 20, name: "Cà phê sữa đá Sài Gòn", price: 15000, category: "Trà & Đồ Uống", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300", available: true }
];

let orders = [];

app.post('/api/student/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin!" });
  const exist = studentUsers.find(s => s.username === username);
  if (exist) return res.status(400).json({ success: false, message: "Tên tài khoản này đã được đăng ký!" });
  studentUsers.push({ username, email, password });
  res.json({ success: true });
});

app.post('/api/student/login', (req, res) => {
  const { username, password } = req.body;
  const student = studentUsers.find(s => s.username === username && s.password === password);
  if (student) res.json({ success: true, student: { username: student.username, email: student.email } });
  else res.status(401).json({ success: false, message: "Tên tài khoản hoặc mật khẩu không chính xác!" });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = staffUsers.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, user: { name: user.name, role: user.role } });
  else res.status(401).json({ success: false, message: "Tài khoản hoặc mật khẩu không đúng!" });
});

app.get('/api/menu', (req, res) => res.json(menu));

app.post('/api/menu/toggle', (req, res) => {
  const { id, available } = req.body;
  const item = menu.find(m => m.id === id);
  if (item) {
    item.available = available;
    io.emit('menu_updated', menu);
    res.json({ success: true, menu });
  } else res.status(404).json({ error: "Không tìm thấy món" });
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    studentCode: req.body.studentCode,
    items: req.body.items,
    total: req.body.total,
    paymentMethod: req.body.paymentMethod || "Mã QR / Tiền mặt",
    table: req.body.table || "Bàn QR",
    status: "pending", 
    createdAt: new Date().toLocaleTimeString('vi-VN')
  };
  orders.unshift(newOrder);

  io.emit('new_order', newOrder);
  io.emit('sales_update', getSalesStats());
  res.json({ success: true, order: newOrder });
});

app.post('/api/orders/toggle-status', (req, res) => {
  const { id } = req.body;
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = order.status === 'completed' ? 'pending' : 'completed';
    io.emit('sales_update', getSalesStats());
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: "Không tìm thấy đơn hàng" });
  }
});

// Chỉ tính tổng đơn và doanh thu cho các đơn ĐÃ HOÀN THÀNH (completed)
function getSalesStats() {
  const completedOrders = orders.filter(o => o.status === 'completed');
  return {
    totalOrders: completedOrders.length,
    totalRevenue: completedOrders.reduce((sum, o) => sum + o.total, 0),
    ordersList: orders
  };
}

io.on('connection', (socket) => {
  socket.emit('sales_update', getSalesStats());
});

server.listen(5000, () => console.log('Backend running on port 5000'));