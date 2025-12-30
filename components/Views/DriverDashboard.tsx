
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Navigation as NavIcon, MapPin, Phone, MessageSquare, Clock, 
  Loader2, User as UserIcon, CheckCircle2, Award, Zap, TrendingUp, 
  Power, Target, DollarSign, ChevronRight, Activity
} from 'lucide-react';
import { db } from '../../services/db';
import L from 'leaflet';
import { Order, User } from '../../types';
import { ChatView } from './ChatView';

const LiveOrderMap: React.FC<{ destination: { lat: number, lng: number } }> = ({ destination }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([destination.lat, destination.lng], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    L.marker([destination.lat, destination.lng]).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [destination]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-[40px] shadow-inner" />;
};

export const DriverDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'NAVIGATE' | 'PERFORMANCE'>('EXPLORE');
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driver, setDriver] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{name: string, id: string} | null>(null);

  const load = async () => {
    const [o, u] = await Promise.all([db.getOrders(), db.getCurrentUser()]);
    setOrders(o);
    setDriver(u);
    const active = o.find(order => (order.status === 'ON_WAY' || order.status === 'ACCEPTED') && order.driverId === u?.id);
    if (active) {
      const customer = await db.getUserById(active.customerId);
      if (customer) setCustomerInfo({ name: customer.name, id: customer.id });
    } else {
      setCustomerInfo(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener('db-update', load);
    return () => window.removeEventListener('db-update', load);
  }, []);

  const activeOrder = orders.find(o => (o.status === 'ON_WAY' || o.status === 'ACCEPTED') && o.driverId === driver?.id);
  const availableOrders = orders.filter(o => o.status === 'PENDING');

  const handleAccept = async (orderId: string) => {
    if (driver && isOnline) {
      await db.updateOrderStatus(orderId, 'ON_WAY', driver.id);
      setActiveTab('NAVIGATE');
    } else {
      alert('يرجى تفعيل وضع الاتصال أولاً!');
    }
  };

  const dailyGoalPercent = 65; // قيمة افتراضية للتوضيح

  if (isLoading) return <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>;

  return (
    <div className={`max-w-4xl mx-auto px-5 pb-32 min-h-screen transition-colors duration-500 ${isOnline ? 'bg-slate-50' : 'bg-slate-100'}`}>
      {/* Online Status Header */}
      <div className={`mt-6 p-8 rounded-[48px] shadow-2xl relative overflow-hidden transition-all duration-700 ${isOnline ? 'bg-slate-900' : 'bg-white border border-slate-200'} text-white`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              <div className="relative">
                <div className={`w-20 h-20 rounded-3xl border-4 ${isOnline ? 'border-emerald-500 animate-pulse' : 'border-slate-200'} p-1`}>
                  <img src={driver?.avatar || 'https://i.pravatar.cc/150'} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-4 ${isOnline ? 'bg-emerald-500 border-slate-900' : 'bg-slate-300 border-white'} flex items-center justify-center`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className={`text-2xl font-black ${isOnline ? 'text-white' : 'text-slate-900'}`}>أهلاً، {driver?.name?.split(' ')[0]}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <Activity size={14} className={isOnline ? 'text-emerald-500' : 'text-slate-300'} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-white/60' : 'text-slate-400'}`}>
                     {isOnline ? 'أنت نشط الآن وتستقبل الطلبات' : 'أنت في وضع عدم الاتصال'}
                   </span>
                </div>
              </div>
           </div>
           
           <button 
             onClick={() => setIsOnline(!isOnline)}
             className={`px-10 py-5 rounded-[32px] font-black text-sm flex items-center gap-3 shadow-xl transition-all active:scale-95 ${isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}
           >
             <Power size={20} /> {isOnline ? 'اتصال مفعل' : 'تفعيل الاتصال'}
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm mt-8">
        {[
          { id: 'EXPLORE', label: 'المهام', icon: <Target size={18}/> },
          { id: 'NAVIGATE', label: 'الملاحة', icon: <NavIcon size={18}/> },
          { id: 'PERFORMANCE', label: 'أدائي', icon: <Activity size={18}/> }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'EXPLORE' && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">أرباح اليوم</p>
                <p className="text-2xl font-black text-slate-900 mt-1">٤٥,٠٠٠ <span className="text-xs">د.ع</span></p>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهدف اليومي</p>
                <div className="mt-2 flex items-center gap-3">
                   <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width: `${dailyGoalPercent}%`}}></div>
                   </div>
                   <span className="text-[10px] font-black text-emerald-600">{dailyGoalPercent}%</span>
                </div>
             </div>
          </div>

          <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3">
            الطلبات المتاحة حولك
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] animate-pulse">مباشر</span>
          </h3>
          
          {!isOnline && (
            <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-300">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Power size={40} className="text-slate-200" />
               </div>
               <p className="text-slate-400 font-black text-lg">فعل وضع الاتصال لرؤية الطلبات</p>
            </div>
          )}

          {isOnline && availableOrders.length > 0 ? availableOrders.map(order => (
            <div key={order.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
               <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                     <Zap size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">#{order.id.slice(-5)}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><MapPin size={12}/> {order.location.address}</p>
                  </div>
               </div>
               <div className="flex items-center justify-between w-full md:w-auto gap-8 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-blue-600 font-black text-lg">٥,٠٠٠ د.ع</p>
                    <p className="text-[9px] font-black text-slate-400">ربح التوصيل الصافي</p>
                  </div>
                  <button onClick={() => handleAccept(order.id)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl hover:bg-blue-600">قبول</button>
               </div>
            </div>
          )) : isOnline && (
            <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100">
               <Loader2 size={40} className="mx-auto text-blue-100 animate-spin mb-4" />
               <p className="text-slate-300 font-black">جاري البحث عن مهام قريبة...</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'NAVIGATE' && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          {activeOrder ? (
            <div className="space-y-6">
              <div className="h-[450px] bg-white rounded-[48px] overflow-hidden relative border-4 border-white shadow-2xl">
                 <LiveOrderMap destination={activeOrder.location} />
                 <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-[32px] shadow-2xl border border-white/50 flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">الوجهة القادمة</p>
                         <p className="text-sm font-black truncate max-w-[150px]">{activeOrder.location.address}</p>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => setShowChat(true)} className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><MessageSquare size={20}/></button>
                         <button className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Phone size={20}/></button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-2xl space-y-8">
                 <div className="flex items-center gap-5 px-2">
                   <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner">
                     <UserIcon className="text-slate-300" size={32} />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">توصيل الطلب للعميل</p>
                     <p className="text-xl font-black text-slate-900">{customerInfo?.name || 'جاري التحميل...'}</p>
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => db.updateOrderStatus(activeOrder.id, 'DELIVERED')}
                   className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-emerald-600"
                 >
                   <CheckCircle2 size={28} /> تأكيد تسليم الطلب
                 </button>
              </div>

              {showChat && <ChatView orderId={activeOrder.id} recipientName={customerInfo?.name || 'العميل'} onClose={() => setShowChat(false)} />}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[40px] border border-slate-200">
               <NavIcon size={40} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-300 font-black">لا توجد رحلة نشطة حالياً</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'PERFORMANCE' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <StatCard title="إجمالي الرحلات" value="٢٥٤" unit="رحلة" icon={<TrendingUp/>} color="emerald" />
          <StatCard title="التقييم العام" value="٤.٩٥" unit="/ ٥" icon={<Star size={20}/>} color="amber" />
          <StatCard title="ساعات النشاط" value="١٢٤" unit="ساعة" icon={<Clock/>} color="blue" />
          <StatCard title="نقاط الولاء" value={driver?.points || 0} unit="نقطة" icon={<Award/>} color="purple" />
          
          <div className="md:col-span-2 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-xl font-black">المستوى القادم</h3>
             <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[32px]">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner">
                   <Award size={40} />
                </div>
                <div className="flex-1">
                   <p className="font-black text-slate-900 text-lg">المستوى الذهبي</p>
                   <p className="text-xs font-bold text-slate-400 mt-1">أكمل ١٢ رحلة أخرى للترقية</p>
                   <div className="mt-4 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-amber-500 rounded-full" style={{width: '75%'}}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-100 transition-all">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value} <span className="text-[10px] opacity-40">{unit}</span></p>
    </div>
  </div>
);

const Star = ({ size, fill }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
