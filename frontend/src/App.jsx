import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = 'https://canteen-dhhp.onrender.com';
const socket = io(BACKEND_URL);

function StudentView() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [currentStudent, setCurrentStudent] = useState(null);
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/menu`).then(res => setMenu(res.data)).catch(() => {});
    socket.on('menu_updated', updatedMenu => setMenu(updatedMenu));
    return () => socket.off('menu_updated');
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    axios.post(`${BACKEND_URL}/api/student/register`, { username, email, password })
      .then(() => {
        alert("🎉 Đăng ký tài khoản thành công! Hãy đăng nhập.");
        setIsRegister(false);
        setPassword('');
        setErrorMsg('');
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Lỗi đăng ký! Không kết nối được Server."));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post(`${BACKEND_URL}/api/student/login`, { username, password })
      .then(res => {
        setCurrentStudent(res.data.student);
        setShowAuthModal(false);
        setErrorMsg('');
      })
      .catch(err => setErrorMsg(err.response?.data?.message || "Lỗi đăng nhập! Tên tài khoản hoặc mật khẩu không đúng."));
  };

  const addToCart = (item) => {
    // Nếu chưa đăng nhập -> Mở popup đăng nhập
    if (!currentStudent) {
      setShowAuthModal(true);
      return;
    }

    setCart(prev => {
      const exist = prev.find(x => x.id === item.id);
      return exist 
        ? prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const processPayment = (paymentMethod) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    axios.post(`${BACKEND_URL}/api/orders`, {
      studentCode: `SV: ${currentStudent.username}`,
      items: cart,
      total: total,
      paymentMethod: paymentMethod,
      table: "Bàn QR"
    }).then(() => {
      alert(`🎉 Đặt hàng thành công! Hình thức: ${paymentMethod}. Canteen đang chuẩn bị món.`);
      setCart([]);
      setShowCheckoutModal(false);
    });
  };

  const categories = [
    { name: 'Tất cả', icon: '🍽️' },
    { name: 'Cơm Tấm', icon: '🍱' },
    { name: 'Bún Bò', icon: '🍜' },
    { name: 'Mì Xào', icon: '🍝' },
    { name: 'Trà & Đồ Uống', icon: '🧋' }
  ];

  const filteredMenu = menu.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/logo-dhhp.png" alt="Logo DHHP" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #0284c7' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '800', letterSpacing: '0.3px' }}>CANTEEN ĐẠI HỌC HẢI PHÒNG</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                {currentStudent ? (
                  <>Tài khoản sinh viên: <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{currentStudent.username}</span></>
                ) : (
                  <span style={{ color: '#ea580c', fontWeight: 'bold' }}>Khách xem thực đơn</span>
                )}
              </p>
            </div>
          </div>

          <div style={{ flex: '0 1 360px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm món ăn, đồ uống nhanh..." 
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: '20px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          {currentStudent ? (
            <button onClick={() => { setCurrentStudent(null); setCart([]); }} style={{ padding: '8px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}>
              🚪 Đăng xuất
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              🔑 Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {/* Banner */}
        <div style={{ 
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.4) 100%), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px', 
          padding: '36px 40px', 
          color: '#fff', 
          marginBottom: '28px', 
          boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.25)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <span style={{ background: '#ea580c', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>🔥 THỰC ĐƠN TƯƠI SẠCH MỖI NGÀY</span>
            <h2 style={{ margin: '12px 0 8px 0', fontSize: '28px', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Chúc bạn có bữa ăn ngon miệng tại Canteen! 🍜</h2>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.9, maxWidth: '600px' }}>Đặt món trước siêu tốc - Không lo chen lấn - Nhận món tươi nóng tận bàn ngay khi ra chơi.</p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px' }}>⚡</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>Phục vụ</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>Siêu Tốc</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px' }}>🛡️</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>An toàn</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#4ade80' }}>100% VSTP</div>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              style={{
                padding: '12px 24px',
                borderRadius: '16px',
                border: 'none',
                background: selectedCategory === cat.name ? '#0284c7' : '#fff',
                color: selectedCategory === cat.name ? '#fff' : '#475569',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: selectedCategory === cat.name ? '0 6px 16px rgba(2, 132, 199, 0.35)' : '0 2px 6px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Menu & Cart Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
          {/* Menu Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '19px', fontWeight: '800' }}>
                Danh sách món: {selectedCategory} ({filteredMenu.length} món)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {filteredMenu.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '20px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s' }}>
                  <div>
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px', marginBottom: '12px' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15,23,42,0.8)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                        {item.category}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#0f172a', fontWeight: '700', lineHeight: '1.3' }}>{item.name}</h4>
                    <p style={{ color: '#ea580c', fontWeight: '800', fontSize: '17px', margin: '0 0 14px 0' }}>{item.price.toLocaleString()} VNĐ</p>
                  </div>

                  <button 
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: item.available ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#cbd5e1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: item.available ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      boxShadow: item.available ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none'
                    }}
                  >
                    {item.available ? '➕ Thêm Vào Giỏ' : '🔴 Hết Hàng'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.06)', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🛒 Giỏ Hàng Món Ăn
                </h3>
                {cartCount > 0 && (
                  <span style={{ background: '#ea580c', color: '#fff', padding: '3px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }}>
                    {cartCount} món
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 10px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧺</div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Giỏ hàng đang trống</p>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>Hãy chọn vài món ngon từ thực đơn bên trái nhé</span>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                  {cart.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <div style={{ flex: 1, paddingRight: '10px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{c.name}</div>
                        <div style={{ color: '#ea580c', fontSize: '13px', fontWeight: '700' }}>{(c.price * c.qty).toLocaleString()} VNĐ</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '5px 10px', borderRadius: '10px' }}>
                        <button onClick={() => updateQuantity(c.id, -1)} style={{ width: '24px', height: '24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '18px', textAlign: 'center' }}>{c.qty}</span>
                        <button onClick={() => updateQuantity(c.id, 1)} style={{ width: '24px', height: '24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Tổng thanh toán:</span>
                  <strong style={{ color: '#ea580c', fontSize: '22px' }}>{cartTotal.toLocaleString()} VNĐ</strong>
                </div>

                <button 
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (!currentStudent) {
                      setShowAuthModal(true);
                    } else {
                      setShowCheckoutModal(true);
                    }
                  }} 
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: cart.length > 0 ? 'linear-gradient(135deg, #ea580c, #c2410c)' : '#cbd5e1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 'bold',
                    cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    boxShadow: cart.length > 0 ? '0 6px 18px rgba(234, 88, 12, 0.35)' : 'none'
                  }}
                >
                  💳 Xác Nhận Thanh Toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal (Popup Đăng nhập / Đăng ký) */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ maxWidth: '420px', width: '90%', background: '#fff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', padding: '24px 20px', textAlign: 'center', color: '#fff', position: 'relative' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
              <img src="/logo-dhhp.png" alt="Logo DHHP" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff', padding: '4px', marginBottom: '8px' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>CANTEEN ĐẠI HỌC HẢI PHÒNG</h3>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>
                {isRegister ? '📝 Đăng Ký Tài Khoản Sinh Viên' : '🔑 Đăng Nhập Để Tiếp Tục'}
              </h4>

              {errorMsg && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>⚠️ {errorMsg}</div>}

              {isRegister ? (
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>TÊN TÀI KHOẢN</label>
                    <input type="text" placeholder="Nhập tên tài khoản hoặc MSSV" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>EMAIL</label>
                    <input type="email" placeholder="Nhập địa chỉ email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>MẬT KHẨU</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{showPassword ? "👁️" : "🙈"}</button>
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Tạo Tài Khoản</button>
                  <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '16px', color: '#64748b' }}>Đã có tài khoản? <span onClick={() => { setIsRegister(false); setErrorMsg(''); }} style={{ color: '#0284c7', cursor: 'pointer', fontWeight: 'bold' }}>Đăng nhập</span></p>
                </form>
              ) : (
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>TÊN TÀI KHOẢN</label>
                    <input type="text" placeholder="Nhập tên tài khoản hoặc MSSV" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>MẬT KHẨU</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{showPassword ? "👁️" : "🙈"}</button>
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ea580c, #c2410c)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Vào Gọi Món Nhanh ➔</button>
                  <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '16px', color: '#64748b' }}>Chưa có tài khoản? <span onClick={() => { setIsRegister(true); setErrorMsg(''); }} style={{ color: '#ea580c', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</span></p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '420px', borderRadius: '24px', padding: '28px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>💳 MÃ QR THANH TOÁN CANTEEN</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>Quét mã chuyển khoản ngân hàng hoặc thanh toán tại quầy</p>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: '12px 10px 8px 10px', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0', 
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <img 
                src="/qr-thanhtoan.png" 
                alt="Ma QR Thanh Toan" 
                style={{ 
                  width: '100%', 
                  height: '280px', 
                  objectFit: 'contain',
                  borderRadius: '10px'
                }} 
              />
              <p style={{ margin: '8px 0 0 0', fontWeight: '800', color: '#ea580c', fontSize: '22px' }}>
                {cartTotal.toLocaleString()} VNĐ
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => processPayment("Chuyển khoản QR")} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #16a34a, #15803d)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                ✅ Đã Chuyển Khoản
              </button>

              <button 
                onClick={() => processPayment("Tiền mặt")} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                💵 Trả Tiền Mặt
              </button>
            </div>

            <button onClick={() => setShowCheckoutModal(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: '12px', fontSize: '13px', fontWeight: '600' }}>
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminView() {
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, ordersList: [] });

  useEffect(() => {
    if (isLogged) {
      axios.get(`${BACKEND_URL}/api/menu`).then(res => setMenu(res.data));
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
    axios.post(`${BACKEND_URL}/api/login`, { username, password })
      .then(() => { setIsLogged(true); setError(''); })
      .catch(() => setError("Tài khoản hoặc mật khẩu Quản lý không đúng!"));
  };

  const toggleAvailable = (id, currentStatus) => {
    axios.post(`${BACKEND_URL}/api/menu/toggle`, { id, available: !currentStatus });
  };

  const toggleOrderStatus = (id) => {
    axios.post(`${BACKEND_URL}/api/orders/toggle-status`, { id });
  };

  if (!isLogged) {
    return (
      <div style={{ 
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.95)), url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{ 
          maxWidth: '420px', 
          width: '90%', 
          background: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', 
          padding: '36px 32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'linear-gradient(135deg, #0284c7, #2563eb)', 
              borderRadius: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 14px auto',
              fontSize: '30px',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)'
            }}>
              👨‍🍳
            </div>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px' }}>HỆ THỐNG BẾP CANTEEN</h2>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Đăng nhập dành cho Bếp trưởng & Quản lý & Nhân Viên</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>TÊN ĐĂNG NHẬP</label>
              <input 
                type="text" 
                placeholder="VD: kitchen / admin" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '26px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>MẬT KHẨU</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'linear-gradient(135deg, #0284c7, #2563eb)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                fontSize: '15px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              Đăng Nhập Quản Lý
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>👨‍🍳 QUẢN LÝ BẾP CANTEEN</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Theo dõi đơn hàng thời gian thực & cập nhật thực đơn</p>
        </div>
        <button onClick={() => setIsLogged(false)} style={{ padding: '10px 20px', background: '#334155', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          🚪 Đăng xuất Bếp
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>TỔNG SỐ ĐƠN HÀNG</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', marginTop: '6px' }}>{stats.totalOrders} đơn</div>
        </div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>TỔNG DOANH THU</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80', marginTop: '6px' }}>{(stats.totalRevenue || 0).toLocaleString()} VNĐ</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        <div>
          <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>📦 Đơn Hàng Cần Chế Biến</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats.ordersList && stats.ordersList.length === 0 ? (
              <p style={{ color: '#64748b' }}>Chưa có đơn hàng nào.</p>
            ) : (
              stats.ordersList?.map(order => (
                <div key={order.id} style={{ background: '#1e293b', padding: '16px', borderRadius: '14px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{order.studentCode}</span>
                    <span style={{ background: order.status === 'Completed' ? '#166534' : '#854d0e', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>
                      {order.status === 'Completed' ? 'Hoàn thành' : 'Đang xử lý'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#cbd5e1' }}>Món: {order.items}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <strong style={{ color: '#4ade80' }}>{order.total?.toLocaleString()} VNĐ</strong>
                    <button onClick={() => toggleOrderStatus(order.id)} style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      Đổi trạng thái
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>🍱 Trạng Thái Món Ăn</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menu.map(item => (
              <div key={item.id} style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.price?.toLocaleString()} VNĐ</div>
                </div>
                <button 
                  onClick={() => toggleAvailable(item.id, item.available)}
                  style={{ padding: '6px 14px', background: item.available ? '#22c55e' : '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  {item.available ? 'Đang Bán' : 'Hết Hàng'}
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