
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Layout } from './components/Layout';
import { CustomerDashboard } from './components/Views/CustomerDashboard';
import { StoreDashboard } from './components/Views/StoreDashboard';
import { DriverDashboard } from './components/Views/DriverDashboard';
import { AdminDashboard } from './components/Views/AdminDashboard';
import { AccountView } from './components/Views/AccountView';
import { db } from './services/db';
import { 
  Phone, Lock, Loader2, User as UserIcon, Eye, EyeOff, 
  Sparkles, ShoppingBag, Truck, ShieldAlert,
  Code2, Stars, Rocket, Heart
} from 'lucide-react';

const SplashScreen: React.FC = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-white font-['Tajawal'] overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Shield */}
        <div className={`transition-all duration-1000 transform ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
            <div className="w-36 h-36 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[48px] flex items-center justify-center shadow-2xl relative border border-white/10 group overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
               <span className="text-7xl font-black drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">خ</span>
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
            </div>
          </div>
        </div>
        
        {/* Text Reveal */}
        <div className={`mt-10 text-center transition-all duration-1000 delay-300 ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl font-black tracking-tighter mb-1 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">خدماتي</h1>
          <div className="flex items-center gap-2 justify-center">
            <span className="h-px w-6 bg-blue-500/50"></span>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[4px]">Elite Services Ecosystem</p>
            <span className="h-px w-6 bg-blue-500/50"></span>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className={`mt-16 w-40 h-1 bg-white/5 rounded-full overflow-hidden transition-opacity duration-500 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
           <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 animate-[shimmer_2s_infinite]" style={{ width: '100%', backgroundSize: '200% 100%' }}></div>
        </div>
      </div>
      
      {/* Exclusive Production Credits */}
      <div className={`absolute bottom-16 w-full px-10 transition-all duration-1000 delay-700 ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="max-w-xs mx-auto">
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-xl border border-white/5 rounded-full">
                <Stars size={12} className="text-amber-400 animate-spin-slow" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Masterpiece Production</span>
             </div>
             
             <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-center flex-1">
                   <p className="text-[9px] font-bold text-slate-500 mb-0.5">Architect</p>
                   <p className="text-sm font-black text-white tracking-tight">بارز إسماعيل</p>
                </div>
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                <div className="flex flex-col items-center flex-1">
                   <p className="text-[9px] font-bold text-slate-500 mb-0.5">Visionary</p>
                   <p className="text-sm font-black text-white tracking-tight">عمر نبيل</p>
                </div>
             </div>

             <div className="flex items-center gap-1.5 text-blue-500/40 mt-2">
                <Rocket size={12} />
                <span className="text-[8px] font-black uppercase tracking-[2px]">Powered by Next-Gen Tech</span>
             </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent"></div>
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentGlobalView, setCurrentGlobalView] = useState<string | null>(null);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setCurrentGlobalView(null);
    setAuthMode('LOGIN');
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000); // 4 seconds for cinematic feel

    const checkAuth = async () => {
      try {
        const currentUser = await db.getCurrentUser();
        if (currentUser) {
          if (currentUser.isBanned) {
             handleLogout();
             setError('تم حظر حسابك لمخالفة القوانين.');
             return;
          }
          setUser(currentUser);
          setRole(currentUser.role);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Auth error", e);
      } finally {
        setLoading(false);
      }
    };

    const handleNavigate = (e: any) => {
      if (e.detail === 'ACCOUNT') setCurrentGlobalView('ACCOUNT');
      else if (e.detail === 'HOME') setCurrentGlobalView(null);
    };

    checkAuth();
    window.addEventListener('db-update', checkAuth);
    window.addEventListener('navigate-to', handleNavigate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('db-update', checkAuth);
      window.removeEventListener('navigate-to', handleNavigate);
    };
  }, []);

  const handleLogin = async (e?: React.FormEvent, demoRole?: UserRole) => {
    if (e) e.preventDefault();
    let loginPhone = phone;
    let loginPass = password;
    if (demoRole) {
      const demoMapping: any = {
        [UserRole.CUSTOMER]: '0500000001',
        [UserRole.STORE_OWNER]: '0500000002',
        [UserRole.DRIVER]: '0500000003',
        [UserRole.ADMIN]: '0500000004'
      };
      loginPhone = demoMapping[demoRole];
      loginPass = '123';
    }
    if (!loginPhone || !loginPass) return setError('يرجى ملء الحقول');
    setError('');
    setLoading(true);
    try {
      const u = await db.loginUser(loginPhone, loginPass);
      setUser(u);
      setRole(u.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) return <SplashScreen />;

  if (!user) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Tajawal'] overflow-x-hidden animate-fadeIn" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600 rounded-b-[60px] shadow-2xl"></div>
      
      <div className="relative z-10 max-w-md mx-auto w-full px-8 py-12 flex flex-col min-h-screen">
        <div className="mb-12 text-center pt-10 text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl border border-white/30 rounded-[36px] flex items-center justify-center text-white text-4xl font-black mb-8 shadow-2xl mx-auto transform hover:rotate-6 transition-transform duration-500">خ</div>
          <h1 className="text-4xl font-black leading-tight tracking-tighter">
            {authMode === 'LOGIN' ? 'مرحباً بعودتك' : 'انضم إلينا'}
          </h1>
          <p className="opacity-70 mt-2 font-bold text-sm">التطبيق الأذكى للخدمات في العراق</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black border border-red-100">{error}</div>}
            
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pr-14 pl-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-500 focus:bg-white transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className="w-full pr-14 pl-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-blue-500 focus:bg-white transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl shadow-blue-500/30 flex items-center justify-center gap-4 text-lg active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : 'دخول للمنصة'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">الدخول السريع للتجربة</p>
            <div className="grid grid-cols-4 gap-3">
               {[
                 { role: UserRole.CUSTOMER, label: 'عميل' },
                 { role: UserRole.STORE_OWNER, label: 'متجر' },
                 { role: UserRole.DRIVER, label: 'سائق' },
                 { role: UserRole.ADMIN, label: 'مدير' },
               ].map((demo) => (
                 <button key={demo.role} type="button" onClick={() => handleLogin(undefined, demo.role)} className="p-3 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 text-[9px] font-black text-slate-600 hover:text-blue-600 transition-all active:scale-90">
                  {demo.label}
                </button>
               ))}
            </div>
          </div>
        </div>

        <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="mt-10 text-center text-sm font-black text-blue-600">
          {authMode === 'LOGIN' ? 'إنشاء حساب جديد مجاناً' : 'لديك حساب؟ سجل الآن'}
        </button>
      </div>
    </div>
  );

  return (
    <Layout 
      role={role} 
      onLogout={handleLogout} 
      title={currentGlobalView === 'ACCOUNT' ? 'الملف الشخصي' : role === UserRole.ADMIN ? 'الإدارة العامة' : role === UserRole.STORE_OWNER ? 'إدارة المتجر' : role === UserRole.DRIVER ? 'لوحة الكابتن' : 'الرئيسية'} 
      onNavigate={(v) => setCurrentGlobalView(v === 'HOME' ? null : 'ACCOUNT')}
    >
      {currentGlobalView === 'ACCOUNT' ? (
        <AccountView onBack={() => setCurrentGlobalView(null)} role={role} />
      ) : (
        <div className="animate-reveal">
          {role === UserRole.STORE_OWNER && <StoreDashboard />}
          {role === UserRole.DRIVER && <DriverDashboard />}
          {role === UserRole.ADMIN && <AdminDashboard />}
          {role === UserRole.CUSTOMER && <CustomerDashboard />}
        </div>
      )}
    </Layout>
  );
};

export default App;
