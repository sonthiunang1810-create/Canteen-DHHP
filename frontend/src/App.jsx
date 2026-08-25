import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

function StudentView() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [currentStudent, setCurrentStudent] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/menu').then(res => setMenu(res.data)).catch(() => {});
    socket.on('menu_updated', updatedMenu => setMenu(updatedMenu));
    return () => socket.off('menu_updated');
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/student/register', { username, email, password })
      .then(() => {
        alert("🎉 Đăng ký tài khoản thành công! Hãy đăng nhập.");
        setIsRegister(false);
        setPassword('');
        setErrorMsg('');
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Lỗi đăng ký!"));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/student/login', { username, password })
      .then(res => {
        setCurrentStudent(res.data.student);
        setErrorMsg('');
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Lỗi đăng nhập!"));
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
      studentCode: `SV: ${currentStudent.username}`,
      items: cart,
      total: total,
      table: "Bàn QR"
    }).then(() => {
      alert("🎉 Gửi đơn thành công! Nhà bếp đang chuẩn bị món cho bạn.");
      setCart([]);
    });
  };

  if (!currentStudent) {
    return (
      <div style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{ 
          maxWidth: '400px', 
          width: '90%', 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '20px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
          overflow: 'hidden'
        }}>
          {/* Header chứa Logo DHHP và tiêu đề mới */}
          <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '25px 20px', textAlign: 'center', color: '#fff' }}>
            <img 
              src="/logo-dhhp.png" 
              alt="Logo Trường ĐH Hải Phòng" 
              style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fff', padding: '4px', marginBottom: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }} 
            />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>CANTEEN ĐẠI HỌC HẢI PHÒNG</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Đặt món thông minh • Nhận món tận bàn</p>
          </div>

          <div style={{ padding: '25px 30px' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#1e293b', fontSize: '16px' }}>
              {isRegister ? '📝 Đăng Ký Tài Khoản Sinh Viên' : '🔑 Đăng Nhập Hệ Thống'}
            </h3>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {isRegister ? (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>TÊN TÀI KHOẢN</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên tài khoản hoặc MSSV" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="email@gmail.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>MẬT KHẨU</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  Tạo Tài Khoản
                </button>
                <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '18px', color: '#64748b' }}>
                  Đã có tài khoản? <span onClick={() => { setIsRegister(false); setErrorMsg(''); }} style={{ color: '#ea580c', cursor: 'pointer', fontWeight: 'bold' }}>Đăng nhập</span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>TÊN TÀI KHOẢN</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên tài khoản hoặc MSSV" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>MẬT KHẨU</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  Vào Gọi Món Nhanh ➔
                </button>
                <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '18px', color: '#64748b' }}>
                  Chưa có tài khoản? <span onClick={() => { setIsRegister(true); setErrorMsg(''); }} style={{ color: '#ea580c', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo-dhhp.png" alt="Logo DHHP" style={{ width: '35px', height: '35px' }} />
            <div>
              <span>🎓 Tài khoản: <strong style={{ color: '#ea580c' }}>{currentStudent.username}</strong></span>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{currentStudent.email}</div>
            </div>
          </div>
          <button onClick={() => setCurrentStudent(null)} style={{ padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đăng xuất</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>🍔 Menu Hôm Nay</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {menu.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '12px', padding: '10px', border: '1px solid #e2e8f0' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#1e293b' }}>{item.name}</h4>
                  <p style={{ color: '#ea580c', fontWeight: 'bold', margin: '0 0 8px 0' }}>{item.price.toLocaleString()}đ</p>
                  <button 
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    style={{ width: '100%', padding: '8px', background: item.available ? '#16a34a' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', cursor: item.available ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                  >
                    {item.available ? '+ Thêm Món' : 'Hết Hàng'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>🛒 Giỏ Hàng Của Bạn</h3>
            {cart.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>Chưa chọn món nào</p> : cart.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '14px' }}>
                <span>{c.name} x {c.qty}</span>
                <strong>{(c.price * c.qty).toLocaleString()}đ</strong>
              </div>
            ))}
            <h4 style={{ marginTop: '15px', color: '#ea580c', fontSize: '16px', borderTop: '2px solid #f1f5f9', paddingTop: '10px' }}>Tổng: {cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}đ</h4>
            <button onClick={checkout} style={{ width: '100%', padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '10px' }}>
              Xác Nhận Đặt Đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: 'none', boxSizing: 'border-box' }}
          />
          <input 
            type="password" 
            placeholder="Mật khẩu (123)" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: 'none', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#f87171', fontSize: '12px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Đăng Nhập</button>
        </form>
      </div>
    );
  }

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
            <h2 style={{ margin: '5px 0 0 0', color: '#ea580c' }}>{stats.totalOrders} đơn</h2>
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
                  <span style={{ color: '#ea580c', fontSize: '12px' }}>{order.createdAt}</span>
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