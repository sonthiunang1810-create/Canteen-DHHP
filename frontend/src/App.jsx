import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

// ==========================================
// 1. GIAO DIỆN DÀNH RIÊNG CHO SINH VIÊN (URL: /)
// ==========================================
function StudentView() {
  const [studentCode, setStudentCode] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/menu').then(res => setMenu(res.data));
    socket.on('menu_updated', updatedMenu => setMenu(updatedMenu));
    return () => socket.off('menu_updated');
  }, []);

  const handleStartOrder = (e) => {
    e.preventDefault();
    if (!studentCode.trim()) return alert("Vui lòng nhập Mã Sinh Viên!");
    setIsLogged(true);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const exist = prev.find(x => x.id === item.id);
      return exist 
        ? prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const checkout = () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    axios.post('http://localhost:5000/api/orders', {
      studentCode: `SV: ${studentCode}`,
      items: cart,
      total: total,
      table: "Bàn QR"
    }).then(() => {
      alert("🎉 Gửi đơn thành công! Nhà bếp đang chuẩn bị món cho bạn.");
      setCart([]);
    });
  };

  // Màn hình 1: Nhập Mã Sinh Viên
  if (!isLogged) {
    return (
      <div style={{ maxWidth: '380px', margin: '80px auto', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontFamily: 'Arial' }}>
        <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '5px' }}>🎓 Canteen Trường ĐH</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Quét mã QR gọi món tại bàn</p>
        
        <form onSubmit={handleStartOrder}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Mã Sinh Viên</label>
            <input 
              type="text" 
              placeholder="VD: B20DCCN001" 
              value={studentCode}
              onChange={e => setStudentCode(e.target.value)}
              style={{ width: '92%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
            Xem Menu & Gọi Món
          </button>
        </form>
      </div>
    );
  }

  // Màn hình 2: Chọn món & Đặt hàng
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px' }}>
          <span>👋 Sinh viên: <strong>{studentCode}</strong></span>
          <button onClick={() => setIsLogged(false)} style={{ padding: '6px 12px', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đổi MSSV</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
          <div>
            <h3>🍔 Danh Sách Món Ăn</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {menu.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '14px' }}>{item.name}</h4>
                  <p style={{ color: '#e11d48', fontWeight: 'bold', margin: '0 0 8px 0' }}>{item.price.toLocaleString()}đ</p>
                  <button 
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    style={{ width: '100%', padding: '8px', background: item.available ? '#16a34a' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '4px', cursor: item.available ? 'pointer' : 'not-allowed' }}
                  >
                    {item.available ? '+ Thêm' : 'Hết món'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3>🛒 Giỏ Hàng</h3>
            {cart.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa có món nào</p> : cart.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #eee', fontSize: '14px' }}>
                <span>{c.name} x {c.qty}</span>
                <strong>{(c.price * c.qty).toLocaleString()}đ</strong>
              </div>
            ))}
            <h4 style={{ marginTop: '15px', color: '#e11d48' }}>Tổng: {cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}đ</h4>
            <button onClick={checkout} style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Gửi Đơn Này</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. GIAO DIỆN DÀNH RIÊNG CHO BẾP / ADMIN (URL: /admin)
// ==========================================
function AdminView() {
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, ordersList: [] });

  useEffect(() => {
    if (isLogged) {
      axios.get('http://localhost:5000/api/menu').then(res => setMenu(res.data));
      socket.on('menu_updated', updatedMenu => setMenu(updatedMenu));
      socket.on('sales_update', newStats => setStats(newStats));
    }
    return () => {
      socket.off('menu_updated');
      socket.off('sales_update');
    };
  }, [isLogged]);

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/login', { username, password })
      .then(() => { setIsLogged(true); setError(''); })
      .catch(() => setError("Tài khoản/Mật khẩu Admin không đúng!"));
  };

  const toggleAvailable = (id, currentStatus) => {
    axios.post('http://localhost:5000/api/menu/toggle', { id, available: !currentStatus });
  };

  // Form đăng nhập riêng biệt cho Admin
  if (!isLogged) {
    return (
      <div style={{ maxWidth: '360px', margin: '80px auto', padding: '25px', background: '#0f172a', color: '#fff', borderRadius: '12px', fontFamily: 'Arial' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>🔒 Đăng Nhập Quản Lý Bếp</h3>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Tên đăng nhập (kitchen / admin)" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{ width: '92%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Mật khẩu (123)" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '92%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: 'none' }}
          />
          {error && <p style={{ color: '#f87171', fontSize: '12px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Đăng Nhập</button>
        </form>
      </div>
    );
  }

  // Dashboard Nhà bếp / Quản lý
  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>📊 Dashboard Quản Lý Bếp & Doanh Số</h2>
          <button onClick={() => setIsLogged(false)} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Đăng xuất</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <span style={{ color: '#64748b' }}>Tổng đơn đã nhận:</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#2563eb' }}>{stats.totalOrders} đơn</h2>
          </div>
          <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <span style={{ color: '#64748b' }}>Doanh thu Realtime:</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#16a34a' }}>{stats.totalRevenue.toLocaleString()} VNĐ</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <h3>🔔 Đơn Hàng Mới Nhận (Realtime)</h3>
            {stats.ordersList.map(order => (
              <div key={order.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Đơn #{order.id} - {order.studentCode}</span>
                  <span style={{ color: '#2563eb', fontSize: '12px' }}>{order.createdAt}</span>
                </div>
                {order.items.map((it, i) => (
                  <div key={i} style={{ fontSize: '13px' }}>• {it.name} x {it.qty}</div>
                ))}
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#e11d48', marginTop: '5px' }}>{order.total.toLocaleString()} VNĐ</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <h3>🛠 Quản Lý Trạng Thái Món</h3>
            {menu.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span>{item.name}</span>
                <button 
                  onClick={() => toggleAvailable(item.id, item.available)}
                  style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', background: item.available ? '#dcfce7' : '#fee2e2', color: item.available ? '#15803d' : '#b91c1c', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {item.available ? '🟢 Đang bán' : '🔴 Hết món'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ĐIỀU HƯỚNG ROUTER CHÍNH
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}