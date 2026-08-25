import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

// ==========================================
// 1. GIAO DIỆN SINH VIÊN (URL: /)
// ==========================================
function StudentView() {
  const [isRegister, setIsRegister] = useState(false); // Chuyển đổi Đăng nhập / Đăng ký
  const [studentCode, setStudentCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [currentStudent, setCurrentStudent] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/menu').then(res => setMenu(res.data));
    socket.on('menu_updated', updatedMenu => setMenu(updatedMenu));
    return () => socket.off('menu_updated');
  }, []);

  // Xử lý Đăng ký
  const handleRegister = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/student/register', { studentCode, email, password })
      .then(() => {
        alert("🎉 Đăng ký tài khoản thành công! Hãy đăng nhập.");
        setIsRegister(false);
        setPassword('');
        setErrorMsg('');
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Lỗi đăng ký!"));
  };

  // Xử lý Đăng nhập
  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/student/login', { studentCode, password })
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
      studentCode: `SV: ${currentStudent.studentCode}`,
      items: cart,
      total: total,
      table: "Bàn QR"
    }).then(() => {
      alert("🎉 Gửi đơn thành công! Nhà bếp đang chuẩn bị món cho bạn.");
      setCart([]);
    });
  };

  // Form Đăng nhập / Đăng ký
  if (!currentStudent) {
    return (
      <div style={{ maxWidth: '380px', margin: '60px auto', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontFamily: 'Arial' }}>
        <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '5px' }}>🎓 Canteen Trường ĐH</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          {isRegister ? 'Tạo tài khoản sinh viên mới' : 'Đăng nhập gọi món tại bàn'}
        </p>

        {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{errorMsg}</p>}

        {isRegister ? (
          /* FORM ĐĂNG KÝ */
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Mã Sinh Viên</label>
              <input 
                type="text" 
                placeholder="VD: B20DCCN001" 
                value={studentCode} 
                onChange={e => setStudentCode(e.target.value)} 
                style={{ width: '92%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Email Sinh Viên</label>
              <input 
                type="email" 
                placeholder="sv@truong.edu.vn" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ width: '92%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Mật Khẩu</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '92%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Đăng Ký Tài Khoản
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '15px' }}>
              Đã có tài khoản? <span onClick={() => { setIsRegister(false); setErrorMsg(''); }} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>Đăng nhập</span>
            </p>
          </form>
        ) : (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Mã Sinh Viên</label>
              <input 
                type="text" 
                placeholder="VD: B20DCCN001" 
                value={studentCode} 
                onChange={e => setStudentCode(e.target.value)} 
                style={{ width: '92%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Mật Khẩu</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '92%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Đăng Nhập Gọi Món
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '15px' }}>
              Chưa có tài khoản? <span onClick={() => { setIsRegister(true); setErrorMsg(''); }} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</span>
            </p>
          </form>
        )}
      </div>
    );
  }

  // Màn hình xem Menu & Giỏ hàng sau khi Login
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px' }}>
          <div>
            <span>👋 Sinh viên: <strong>{currentStudent.studentCode}</strong></span>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{currentStudent.email}</div>
          </div>
          <button onClick={() => setCurrentStudent(null)} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đăng xuất</button>
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

// Cấu trúc Route giữ nguyên
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