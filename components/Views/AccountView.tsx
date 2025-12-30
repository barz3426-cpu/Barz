
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User as UserIcon, Star, CreditCard, ChevronLeft, Plus, Settings, 
  ShieldCheck, Bell, MapPin, History, Award, Zap, ChevronRight,
  LogOut, Wallet as WalletIcon, Gift, Shield, Loader2, Edit3, Camera, Save, X, Lock
} from 'lucide-react';
import { db } from '../../services/db';
import { UserRole, User, Order } from '../../types';

interface AccountViewProps {
  onBack: () => void;
  role: UserRole;
}

export const AccountView: React.FC<AccountViewProps> = ({ onBack, role }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'WALLET' | 'SETTINGS'>('PROFILE');
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecharging, setIsRecharging] = useState(false);
  
  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Edit States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await db.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setEditName(currentUser.name);
        setEditAvatar(currentUser.avatar || '');
        const allOrders = await db.getOrders();
        setOrders(allOrders.filter(o => o.customerId === currentUser.id));
      }
    } catch (err) {
      console.error("Error fetching account data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    window.addEventListener('db-update', fetchUserData);
    return () => window.removeEventListener('db-update', fetchUserData);
  }, []);

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsSavingProfile(true);
    try {
      await db.updateUser(user.id, { 
        name: editName.trim(), 
        avatar: editAvatar.trim() || 'https://i.pravatar.cc/150' 
      });
      setIsEditingProfile(false);
      // Success feedback could be a toast here
    } catch (err) {
      alert("فشل تحديث البيانات");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || newPassword.length < 3) return alert('كلمة المرور قصيرة جداً');
    setIsSavingPassword(true);
    try {
      await db.updateUser(user.id, { password: newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      alert('تم تحديث كلمة المرور بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء التحديث');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRecharge = async (amount: number) => {
    setIsRecharging(true);
    await db.updateWallet(amount);
    setTimeout(() => {
      setIsRecharging(false);
      alert(`تم إضافة ${amount.toLocaleString('ar-IQ')} د.ع لمحفظتك!`);
    }, 600);
  };

  const levelProgress = useMemo(() => {
    if (!user) return 0;
    const pts = user.points;
    if (user.level === 'BRONZE') return Math.min((pts / 200) * 100, 100);
    if (user.level === 'SILVER') return Math.min(((pts - 200) / 800) * 100, 100);
    return 100;
  }, [user]);

  if (isLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-black text-slate-400">جاري جلب بيانات حسابك...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 pb-32 animate-fadeIn min-h-screen">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mt-6 sticky top-4 z-20">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
        <div className="flex bg-white/90 backdrop-blur-xl p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: 'PROFILE', label: 'حسابي', icon: <UserIcon size={14}/> },
            { id: 'WALLET', label: 'المحفظة', icon: <WalletIcon size={14}/> },
            { id: 'SETTINGS', label: 'الإعدادات', icon: <Settings size={14}/> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsEditingProfile(false); }} 
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] flex items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'PROFILE' && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          {/* User Info Card */}
          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
             {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute top-6 left-6 p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                >
                  <Edit3 size={18} />
                </button>
             )}
             
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-[36px] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden transition-transform duration-500 group">
                    <img 
                      src={isEditingProfile ? (editAvatar || 'https://i.pravatar.cc/150') : (user?.avatar || 'https://i.pravatar.cc/150')} 
                      className="w-full h-full object-cover" 
                    />
                    {isEditingProfile && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                         <Camera className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  {!isEditingProfile && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl border-4 border-white shadow-lg">
                      <Zap size={14} fill="currentColor" />
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="mt-8 w-full max-w-sm space-y-5 animate-slideUp">
                    <div className="space-y-2 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاسم الجديد</p>
                       <input 
                         type="text" 
                         value={editName}
                         onChange={e => setEditName(e.target.value)}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                         placeholder="أدخل اسمك الكامل"
                       />
                    </div>
                    <div className="space-y-2 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رابط الصورة</p>
                       <input 
                         type="text" 
                         value={editAvatar}
                         onChange={e => setEditAvatar(e.target.value)}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-left"
                         placeholder="https://..."
                       />
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button 
                         onClick={handleSaveProfile}
                         disabled={isSavingProfile}
                         className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                       >
                         {isSavingProfile ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> حفظ البيانات</>}
                       </button>
                       <button 
                         onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); setEditAvatar(user?.avatar || ''); }}
                         className="px-8 py-5 bg-slate-100 text-slate-400 rounded-[24px] font-black text-sm active:scale-95 transition-all"
                       >
                         إلغاء
                       </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-slate-900 mt-6">{user?.name}</h3>
                    <p className="text-sm font-bold text-slate-400">{user?.phone}</p>
                    <div className="mt-3 px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black tracking-widest border border-blue-100">
                      عضو {user?.level === 'BRONZE' ? 'برونزي' : user?.level === 'SILVER' ? 'فضي' : 'ذهبي'}
                    </div>
                  </>
                )}
             </div>

             {!isEditingProfile && (
               <div className="mt-10 grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">نقاط الولاء</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{user?.points.toLocaleString('ar-IQ')}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المستوى</p>
                    <p className="text-sm font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                      {user?.level} <Award size={14} fill="currentColor"/>
                    </p>
                  </div>
               </div>
             )}
          </div>

          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-black">تقدم المستوى</h4>
                <span className="text-[10px] font-black text-blue-600">{Math.round(levelProgress)}%</span>
             </div>
             <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/30" style={{width: `${levelProgress}%`}}></div>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-lg font-black px-2 flex items-center gap-3">
               عناوين التوصيل <MapPin size={18} className="text-slate-400"/>
             </h4>
             {user?.addresses.map(addr => (
               <div key={addr.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{addr.label}</p>
                      <p className="text-xs font-bold text-slate-400">{addr.address}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600" />
               </div>
             ))}
             <button className="w-full py-5 bg-white border border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black text-xs flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Plus size={16} /> إضافة عنوان جديد
             </button>
          </div>
        </div>
      )}

      {activeTab === 'WALLET' && (
        <div className="mt-8 space-y-8 animate-fadeIn">
          <div className="bg-slate-900 p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-2">رصيد محفظتك</p>
                    <p className="text-5xl font-black tracking-tighter tabular-nums">
                      {user?.wallet.toLocaleString('ar-IQ')}
                      <span className="text-lg text-white/30 mr-3 font-bold">د.ع</span>
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <WalletIcon size={24} className="text-blue-400" />
                  </div>
               </div>

               <div className="mt-12 flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[5000, 10000, 25000, 50000].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => handleRecharge(amt)} 
                        disabled={isRecharging} 
                        className="py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black active:scale-90 transition-all hover:bg-white/10"
                      >
                        {amt/1000}K
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handleRecharge(25000)} disabled={isRecharging} className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-blue-600/30">
                    {isRecharging ? <Loader2 className="animate-spin" /> : <><Plus size={22}/> شحن سريع للمحفظة</>}
                  </button>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-xl font-black px-2 flex items-center gap-3">سجل العمليات <History size={20} className="text-slate-400"/></h4>
             {orders.length > 0 ? orders.slice(0, 5).map(o => (
               <div key={o.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-red-100 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all">
                        <WalletIcon size={20} />
                     </div>
                     <div>
                        <p className="font-black text-sm text-slate-900">طلب #{o.id.slice(-4)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(o.timestamp).toLocaleDateString('ar-SA')}</p>
                     </div>
                  </div>
                  <p className="font-black text-red-600 text-sm">-{o.total.toLocaleString('ar-IQ')} د.ع</p>
               </div>
             )) : <p className="text-center py-12 text-slate-300 font-bold bg-white rounded-[40px] border border-slate-100">لا توجد عمليات سابقة</p>}
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="mt-8 space-y-6 animate-fadeIn">
           <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              <SettingsItem icon={<Bell/>} title="الإشعارات" subtitle="تنبيهات العروض والطلبات" />
              <SettingsItem 
                icon={<Lock/>} 
                title="تغيير كلمة المرور" 
                subtitle="تأمين حسابك بكلمة مرور جديدة" 
                onClick={() => setShowPasswordModal(true)}
              />
              <SettingsItem icon={<Shield/>} title="الأمان والخصوصية" subtitle="إدارة بياناتك وحقوقك" />
              <SettingsItem icon={<Gift/>} title="الهدايا والبرومو" subtitle="إدارة أكواد الخصم والجوائز" />
           </div>
           
           <div className="bg-red-50 p-6 rounded-[40px] border border-red-100">
             <button onClick={() => db.logout()} className="w-full py-6 bg-white text-red-600 rounded-[30px] font-black text-sm flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
                <LogOut size={20} /> تسجيل الخروج النهائي
             </button>
           </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-fadeIn">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
           <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-scaleUp">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900">تغيير كلمة المرور</h3>
                <p className="text-xs font-bold text-slate-400 mt-2">يرجى إدخال كلمة المرور الجديدة بالأسفل</p>
              </div>

              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:border-blue-500 transition-all mb-6 text-center"
                placeholder="كلمة المرور الجديدة"
              />

              <div className="space-y-3">
                 <button 
                   onClick={handleUpdatePassword}
                   disabled={isSavingPassword || newPassword.length < 3}
                   className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isSavingPassword ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'تحديث الآن'}
                 </button>
                 <button 
                   onClick={() => setShowPasswordModal(false)}
                   className="w-full py-5 text-slate-400 font-black text-sm"
                 >
                   إلغاء
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SettingsItem = ({ icon, title, subtitle, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full p-8 flex items-center justify-between group hover:bg-slate-50 transition-colors"
  >
     <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
           {React.cloneElement(icon, { size: 20 })}
        </div>
        <div className="text-right">
           <p className="font-black text-slate-900 text-sm">{title}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>
        </div>
     </div>
     <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all" />
  </button>
);
