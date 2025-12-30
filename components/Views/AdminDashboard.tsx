
import React, { useState, useEffect } from 'react';
import { 
  Users, Layers, Tag, Ban, UserCheck, Plus, Trash2, 
  RefreshCw, DollarSign, ShoppingBag, CreditCard, Star,
  Image as ImageIcon, Sparkles, X, Check, Save, Activity, Clock
} from 'lucide-react';
import { db } from '../../services/db';
import { User, Service, Product, Banner } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'SERVICES' | 'BANNERS'>('STATS');
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Ban Modal State
  const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null);

  // Forms
  const [showAddService, setShowAddService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImg, setBannerImg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [u, s, b] = await Promise.all([db.getAllUsers(), db.getServices(), db.getBanners()]);
    setUsers(u);
    setServices(s);
    setBanners(b);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db-update', loadData);
    return () => window.removeEventListener('db-update', loadData);
  }, []);

  const handleApplyBan = async (hours: number | 'PERMANENT' | null) => {
    if (!selectedUserForBan) return;
    await db.setUserBan(selectedUserForBan.id, hours);
    setSelectedUserForBan(null);
    alert('تم تحديث حالة الحظر بنجاح.');
  };

  const handleAddService = async () => {
    if(!serviceName) return;
    await db.addService({ title: serviceName, color: 'bg-blue-600', iconName: 'Layers' });
    setServiceName('');
    setShowAddService(false);
  };

  const handleAddBanner = async () => {
    if(!bannerTitle || !bannerImg) return;
    await db.addBanner({ 
      title: bannerTitle, 
      subtitle: bannerSubtitle || 'إعلان جديد من الإدارة', 
      imageUrl: bannerImg 
    });
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImg('');
    setShowAddBanner(false);
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      await db.deleteBanner(id);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black">جاري تحديث البيانات...</div>;

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Navigation */}
      <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto hide-scrollbar">
        {[
          { id: 'STATS', label: 'الإحصائيات', icon: <Activity size={18}/> },
          { id: 'USERS', label: 'المستخدمين', icon: <Users size={18}/> },
          { id: 'SERVICES', label: 'الأقسام', icon: <Layers size={18}/> },
          { id: 'BANNERS', label: 'الإعلانات', icon: <Tag size={18}/> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-xs transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'STATS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
          <StatCard title="إجمالي الأعضاء" value={users.length} icon={<Users/>} color="blue" />
          <StatCard title="الأقسام النشطة" value={services.length} icon={<Layers/>} color="emerald" />
          <StatCard title="الإعلانات" value={banners.length} icon={<Tag/>} color="purple" />
          <StatCard title="المحظورين" value={users.filter(u=>u.isBanned).length} icon={<Ban/>} color="red" />
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 font-black text-xs text-slate-500">الاسم والبيانات</th>
                <th className="p-6 font-black text-xs text-slate-500">الحالة الحالية</th>
                <th className="p-6 font-black text-xs text-slate-500 text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className={u.isBanned ? 'bg-red-50/30' : ''}>
                  <td className="p-6">
                    <p className="font-black text-slate-900">{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{u.phone} • {u.role}</p>
                  </td>
                  <td className="p-6">
                    {u.isBanned ? 
                      <div className="flex flex-col gap-1">
                        <span className="text-red-600 font-black text-[10px] flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full w-fit"><Ban size={12}/> محظور</span>
                        {u.banUntil && (
                          <span className="text-[9px] text-slate-500 font-bold">حتى: {new Date(u.banUntil).toLocaleString('ar-SA')}</span>
                        )}
                      </div> : 
                      <span className="text-emerald-600 font-black text-[10px] flex items-center gap-1 bg-emerald-100 px-3 py-1 rounded-full w-fit"><Check size={12}/> حساب نشط</span>
                    }
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => setSelectedUserForBan(u)}
                      className={`px-5 py-2.5 rounded-xl font-black text-[10px] transition-all shadow-sm active:scale-95 ${u.isBanned ? 'bg-emerald-600 text-white' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white'}`}
                    >
                      {u.isBanned ? 'تعديل / فك الحظر' : 'حظر هذا المستخدم'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'SERVICES' && (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setShowAddService(true)} className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
            <Plus size={20}/> إضافة قسم جديد
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group relative">
                <button onClick={() => db.deleteService(s.id)} className="absolute top-4 left-4 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg`}>
                  <Layers size={24}/>
                </div>
                <p className="font-black text-sm">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'BANNERS' && (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setShowAddBanner(true)} className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
            <Plus size={20}/> إضافة إعلان جديد
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map(b => (
              <div key={b.id} className="relative h-48 rounded-[40px] overflow-hidden group shadow-lg">
                <img src={b.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                   <h4 className="text-white font-black text-lg">{b.title}</h4>
                   <p className="text-white/60 text-[10px] font-bold mt-1">{b.subtitle}</p>
                </div>
                <button 
                  onClick={() => handleDeleteBanner(b.id)} 
                  className="absolute top-6 left-6 w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Duration Modal */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-sm:max-w-xs max-w-sm rounded-[40px] p-8 shadow-2xl animate-scaleUp">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[30px] flex items-center justify-center mx-auto mb-4">
                <Ban size={40} />
              </div>
              <h3 className="text-xl font-black">حظر المستخدم</h3>
              <p className="text-slate-400 text-xs font-bold mt-2">حدد مدة الحظر للمستخدم: {selectedUserForBan.name}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'فك الحظر الآن', val: null, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'ساعة واحدة', val: 1, color: 'bg-slate-50 text-slate-600' },
                { label: 'يوم كامل (24 ساعة)', val: 24, color: 'bg-slate-50 text-slate-600' },
                { label: 'أسبوع (7 أيام)', val: 168, color: 'bg-slate-50 text-slate-600' },
                { label: 'حظر نهائي', val: 'PERMANENT', color: 'bg-red-600 text-white' },
              ].map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleApplyBan(opt.val as any)}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all ${opt.color}`}
                >
                  <Clock size={16}/> {opt.label}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setSelectedUserForBan(null)}
              className="w-full mt-6 py-4 text-slate-400 font-bold text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-black mb-6">إضافة قسم جديد</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="اسم القسم" 
                value={serviceName} 
                onChange={e=>setServiceName(e.target.value)} 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500" 
              />
              <button onClick={handleAddService} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">حفظ القسم</button>
              <button onClick={()=>setShowAddService(false)} className="w-full text-slate-400 font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Banner Modal */}
      {showAddBanner && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-black mb-6">إضافة إعلان جديد</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="عنوان الإعلان الرئيسي" 
                value={bannerTitle} 
                onChange={e=>setBannerTitle(e.target.value)} 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500" 
              />
              <input 
                type="text" 
                placeholder="العنوان الفرعي" 
                value={bannerSubtitle} 
                onChange={e=>setBannerSubtitle(e.target.value)} 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500" 
              />
              <input 
                type="text" 
                placeholder="رابط صورة الإعلان (URL)" 
                value={bannerImg} 
                onChange={e=>setBannerImg(e.target.value)} 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-500" 
              />
              <div className="pt-4 space-y-3">
                <button onClick={handleAddBanner} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">حفظ الإعلان</button>
                <button onClick={()=>setShowAddBanner(false)} className="w-full text-slate-400 font-bold text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-blue-100 transition-all">
    <div className={`w-16 h-16 rounded-[22px] bg-${color}-50 text-${color}-600 flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);
