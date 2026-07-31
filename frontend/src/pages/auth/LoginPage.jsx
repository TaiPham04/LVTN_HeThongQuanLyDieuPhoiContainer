import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '@/store/authStore';
import anhCang from '@/assets/images/cang.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register: registerUser, isLoading } = useAuthStore();
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [showPassReg, setShowPassReg] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const switchTab = (t) => { setTab(t); setServerError(''); reset(); };

  const onLogin = async (data) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      const role = result.user.role;
      if (role === 'admin')           navigate('/admin/dashboard');
      else if (role === 'nhanvien_cong') navigate('/nv/cong/cong');
      else if (role === 'nhanvien_bai')  navigate('/nv/bai/so-do-bai');
      else if (role === 'khachhang')  navigate('/kh/dashboard');
      else if (role === 'taixe')      navigate('/driver/phieu-lay-hang');
      else navigate('/admin/dashboard');
    } else {
      setServerError(result.message);
    }
  };

  const onRegister = async (data) => {
    setServerError('');
    if (data.matkhau !== data.xacnhanmatkhau) { setServerError('Mật khẩu xác nhận không khớp.'); return; }
    const result = await registerUser({
      hoten: data.hoten, sodienthoai: data.sodienthoai, tentochuc: data.tentochuc,
      email: data.email, password: data.matkhau, password_confirmation: data.xacnhanmatkhau,
    });
    if (result.success) navigate('/kh/dashboard');
    else setServerError(result.message || 'Đăng ký thất bại.');
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* TRÁI */}
        <div style={s.left}>
          <img src={anhCang} alt="Cảng LogiCon" style={s.bg} />
          <div style={s.overlay} />
          <div style={s.logoWrap}>
            <div style={s.logoBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
            </div>
            <div>
              <div style={s.logoName}>LogiCon</div>
              <div style={s.logoSub}>Hệ thống quản lý & điều phối container</div>
            </div>
          </div>
          <div style={s.leftBottom}>
            <div style={s.headline}>Quản lý cảng container<br /><span style={{color:'#e8920a'}}>thông minh & hiệu quả</span></div>
            <div style={s.desc}>Theo dõi toàn bộ vòng đời container — từ gate-in đến gate-out, gán vị trí bãi, đặt lịch vận chuyển và báo cáo thống kê thời gian thực.</div>
            <div style={s.statsRow}>
              {[{num:'5',lbl:'Vai trò nghiệp vụ'},{num:'10+',lbl:'Chức năng nghiệp vụ'},{num:'24/7',lbl:'Theo dõi realtime'}].map((x)=>(
                <div key={x.lbl} style={s.statBox}>
                  <div style={s.statNum}>{x.num}</div>
                  <div style={s.statLbl}>{x.lbl}</div>
                </div>
              ))}
            </div>
            <div style={s.copy}>© 2024 LogiCon — Đồ án tốt nghiệp</div>
          </div>
        </div>

        {/* PHẢI */}
        <div style={s.right}>
          <div style={s.formCard}>
            <div style={s.tabs}>
              {['login','register'].map((t)=>(
                <button key={t} onClick={()=>switchTab(t)} style={{...s.tab,...(tab===t?s.tabActive:{})}}>
                  {t==='login'?'Đăng nhập':'Đăng ký'}
                </button>
              ))}
            </div>

            {serverError && <div style={s.errBox}>{serverError}</div>}

            {tab==='login' && (
              <form onSubmit={handleSubmit(onLogin)} noValidate>
                <Field label="Email" error={errors.email?.message}>
                  <Inp icon="mail">
                    <input type="email" placeholder="email@example.com" style={inp(!!errors.email)}
                      {...register('email',{required:'Vui lòng nhập email.',pattern:{value:/\S+@\S+\.\S+/,message:'Email không hợp lệ.'}})} />
                  </Inp>
                </Field>
                <Field label="Mật khẩu" error={errors.password?.message}>
                  <Inp icon="lock" eye eyeOpen={showPass} onEye={()=>setShowPass(!showPass)}>
                    <input type={showPass?'text':'password'} placeholder="••••••••" style={inp(!!errors.password)}
                      {...register('password',{required:'Vui lòng nhập mật khẩu.'})} />
                  </Inp>
                </Field>
                <button type="submit" style={s.btn} disabled={isLoading}>{isLoading?'Đang xử lý...':'Đăng nhập'}</button>
              </form>
            )}

            {tab==='register' && (
              <form onSubmit={handleSubmit(onRegister)} noValidate>
                <div style={s.twoCol}>
                  <Field label="Họ và tên" error={errors.hoten?.message}>
                    <Inp icon="user"><input type="text" placeholder="Nguyễn Văn A" style={inp(!!errors.hoten)}
                      {...register('hoten',{required:'Vui lòng nhập họ tên.'})} /></Inp>
                  </Field>
                  <Field label="Số điện thoại">
                    <Inp icon="phone"><input type="tel" placeholder="0901234567" style={inp(false)} {...register('sodienthoai')} /></Inp>
                  </Field>
                </div>
                <Field label="Tên công ty / Forwarder" error={errors.tentochuc?.message}>
                  <Inp icon="building"><input type="text" placeholder="Công ty Logistics ABC" style={inp(!!errors.tentochuc)}
                    {...register('tentochuc',{required:'Vui lòng nhập tên công ty.'})} /></Inp>
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <Inp icon="mail"><input type="email" placeholder="email@example.com" style={inp(!!errors.email)}
                    {...register('email',{required:'Vui lòng nhập email.',pattern:{value:/\S+@\S+\.\S+/,message:'Email không hợp lệ.'}})} /></Inp>
                </Field>
                <div style={s.twoCol}>
                  <Field label="Mật khẩu" error={errors.matkhau?.message}>
                    <Inp icon="lock" eye eyeOpen={showPassReg} onEye={()=>setShowPassReg(!showPassReg)}>
                      <input type={showPassReg?'text':'password'} placeholder="••••••••" style={inp(!!errors.matkhau)}
                        {...register('matkhau',{required:'Vui lòng nhập mật khẩu.',minLength:{value:8,message:'Tối thiểu 8 ký tự.'}})} />
                    </Inp>
                  </Field>
                  <Field label="Xác nhận mật khẩu" error={errors.xacnhanmatkhau?.message}>
                    <Inp icon="lock"><input type="password" placeholder="••••••••" style={inp(!!errors.xacnhanmatkhau)}
                      {...register('xacnhanmatkhau',{required:'Vui lòng xác nhận.'})} /></Inp>
                  </Field>
                </div>
                <button type="submit" style={s.btn} disabled={isLoading}>{isLoading?'Đang xử lý...':'Tạo tài khoản'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.label}>{label}</label>
      {children}
      <p style={{ ...s.fieldErr, visibility: error ? 'visible' : 'hidden' }}>
        {error || 'placeholder'}
      </p>
    </div>
  );
}

const ICONS={
  mail:'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  lock:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  user:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  phone:'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  building:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
};

function Inp({icon,children,eye,eyeOpen,onEye}){
  return(
    <div style={{position:'relative'}}>
      <svg style={s.ico} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[icon]}/>
      </svg>
      {children}
      {eye&&(
        <button type="button" onClick={onEye} style={s.eyeBtn} tabIndex={-1}>
          {eyeOpen
            ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      )}
    </div>
  );
}

const OR='#e8920a';
const inp=(err)=>({width:'100%',padding:'10px 36px',fontSize:14,border:`1px solid ${err?'#e24b4a':'#e5e7eb'}`,borderRadius:8,outline:'none',background:'#f9fafb',color:'#111827',fontFamily:'inherit',transition:'border-color .15s'});
const s={
  page:{minHeight:'100vh',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px'},
  wrap:{display:'flex',width:'100%',maxWidth:1100,minHeight:620,borderRadius:16,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.18)'},
  left:{flex:1,position:'relative',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'36px 40px',overflow:'hidden',minHeight:620},
  bg:{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0},
  overlay:{position:'absolute',inset:0,background:'linear-gradient(170deg,rgba(10,15,30,0.45) 0%,rgba(10,15,30,0.72) 50%,rgba(10,15,30,0.93) 100%)',zIndex:1},
  logoWrap:{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:10},
  logoBox:{width:42,height:42,background:OR,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  logoName:{fontSize:20,fontWeight:600,color:'#fff'},
  logoSub:{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1},
  leftBottom:{position:'relative',zIndex:2},
  headline:{fontSize:24,fontWeight:600,color:'#fff',lineHeight:1.4,marginBottom:10},
  desc:{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.75,maxWidth:360},
  statsRow:{display:'flex',gap:12,marginTop:24},
  statBox:{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,padding:'10px 16px'},
  statNum:{fontSize:20,fontWeight:700,color:OR},
  statLbl:{fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:2},
  copy:{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:20},
  right:{width:420,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 28px'},
  formCard:{width:'100%',minHeight:610,background:'#fff',borderRadius:14,padding:'36px 32px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',transition:'min-height .2s ease'},
  tabs:{display:'flex',borderBottom:'1px solid #e5e7eb',marginBottom:24},
  tab:{flex:1,padding:'10px 0',textAlign:'center',fontSize:14,fontWeight:500,color:'#6b7280',cursor:'pointer',border:'none',background:'none',borderBottom:'2px solid transparent',marginBottom:-1,fontFamily:'inherit',transition:'all .15s'},
  tabActive:{color:OR,borderBottomColor:OR},
  errBox:{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#b91c1c',marginBottom:16},
  label:{display:'block',fontSize:12,fontWeight:500,color:'#374151',marginBottom:6},
  fieldErr:{fontSize:12,color:'#e24b4a',marginTop:4},
  ico:{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:16,height:16,pointerEvents:'none'},
  eyeBtn:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',padding:0},
  btn:{width:'100%',padding:'11px 0',background:OR,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  twoCol:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
};