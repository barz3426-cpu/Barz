
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Package, TrendingUp, Loader2, Trash2, X, Save, 
  Image as ImageIcon, Sparkles, Edit3, Upload, Percent, 
  ShoppingBag, Tag, ChevronRight, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, Order, Service, SubCategory } from '../../types';
import { generateProductDescription } from '../../geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const StoreDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'ORDERS' | 'INVENTORY'>('ANALYTICS');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Dynamic Categories Data
  const [services, setServices] = useState<Service[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '', // Dynamic ID
    subCategoryId: '', // Dynamic ID
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    stock: 10,
    discount: 0
  });

  const load = async () => {
    const [p, o, s, subs] = await Promise.all([
      db.getProducts(), 
      db.getOrders(),
      db.getServices(),
      db.getSubCategories()
    ]);
    setProducts(p);
    setOrders(o);
    setServices(s);
    setSubCategories(subs);

    // Set default category if not set
    if (s.length > 0 && !newProduct.category) {
      setNewProduct(prev => ({ ...prev, category: s[0].id }));
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('db-update', load);
    return () => window.removeEventListener('db-update', load);
  }, []);

  const chartData = useMemo(() => {
    // بيانات تجريبية للرسم البياني بناءً على الأيام الـ 7 الماضية
    return [
      { name: 'الأحد', sales: 450000 },
      { name: 'الاثنين', sales: 520000 },
      { name: 'الثلاثاء', sales: 380000 },
      { name: 'الأربعاء', sales: 610000 },
      { name: 'الخميس', sales: 750000 },
      { name: 'الجمعة', sales: 900000 },
      { name: 'السبت', sales: 820000 },
    ];
  }, []);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock < 5), [products]);

  // Filter SubCategories based on selected Main Category
  const availableSubCategories = useMemo(() => {
    return subCategories.filter(sub => sub.categoryId === newProduct.category);
  }, [subCategories, newProduct.category]);

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) return alert('البيانات غير مكتملة');
    if (editingId) {
      await db.updateProduct(editingId, newProduct);
    } else {
      await db.addProduct({ ...newProduct, storeId: 's1', rating: 5, reviewCount: 0 });
    }
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewProduct({ 
      name: '', 
      description: '', 
      price: 0, 
      category: services.length > 0 ? services[0].id : '', 
      subCategoryId: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 
      stock: 10, 
      discount: 0 
    });
  };

  const openEditModal = (product: Product) => {
    setNewProduct({ 
      ...product, 
      discount: product.discount || 0,
      subCategoryId: (product as any).subCategoryId || '' 
    });
    setEditingId(product.id);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-8 pb-32 animate-fadeIn px-5">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <QuickStatCard title="المبيعات الكلية" value="٢.٥ مليون" trend="+١٥٪" icon={<TrendingUp className="text-emerald-500"/>} color="emerald" />
        <QuickStatCard title="الطلبات النشطة" value={orders.filter(o=>o.status !== 'DELIVERED').length.toString()} trend="-٢" icon={<ShoppingBag className="text-blue-500"/>} color="blue" />
        <QuickStatCard title="المخزون الكلي" value={products.length.toString()} icon={<Package className="text-orange-500"/>} color="orange" />
        <QuickStatCard title="تنبيهات النقص" value={lowStockProducts.length.toString()} icon={<AlertTriangle className="text-red-500"/>} color="red" isAlert={lowStockProducts.length > 0} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm sticky top-20 z-10 backdrop-blur-md">
        {[
          { id: 'ANALYTICS', label: 'التحليلات' },
          { id: 'ORDERS', label: 'الطلبات' },
          { id: 'INVENTORY', label: 'المخزون' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-3.5 rounded-xl font-black text-xs transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black mb-8 flex items-center justify-between">
              أداء المبيعات الأسبوعي
              <span className="text-xs font-bold text-slate-400">آخر ٧ أيام</span>
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', fontFamily: 'Tajawal'}}
                    itemStyle={{fontWeight: 900, color: '#2563eb'}}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl overflow-hidden relative group">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full"></div>
             <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-black">جاهز لزيادة مبيعاتك؟</h4>
                  <p className="text-white/60 text-xs mt-2 font-bold">استخدم الذكاء الاصطناعي لتحسين أوصاف منتجاتك</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="px-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs shadow-xl active:scale-90 transition-transform flex items-center gap-2">
                  <Plus size={16}/> إضافة منتج
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="space-y-4 animate-fadeIn">
          {orders.length > 0 ? orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-100 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xs">#{o.id.slice(-4)}</div>
                <div>
                  <p className="font-black text-slate-900">{o.total.toLocaleString('ar-IQ')} د.ع</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{o.items.length} أصناف • {new Date(o.timestamp).toLocaleTimeString('ar-SA')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {o.status === 'PENDING' ? (
                  <button onClick={() => db.updateOrderStatus(o.id, 'ACCEPTED')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] shadow-lg active:scale-90 transition-all">قبول</button>
                ) : (
                  <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">{o.status}</span>
                )}
                <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><ChevronRight size={18}/></button>
              </div>
            </div>
          )) : <div className="py-24 text-center opacity-30 font-black">لا توجد طلبات معلقة</div>}
        </div>
      )}

      {activeTab === 'INVENTORY' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black">المخزون</h3>
            <button onClick={() => setShowAddModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><Plus size={20}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex gap-4 group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-inner shrink-0 relative">
                  <img src={p.image} className="w-full h-full object-cover" />
                  {p.stock < 5 && <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center"><AlertTriangle className="text-red-600" size={24}/></div>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-sm text-slate-900 truncate">{p.name}</h4>
                    <div className="flex gap-2">
                       <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={14}/></button>
                       <button onClick={() => db.deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <p className="text-blue-600 font-black text-xs mt-1">{p.price.toLocaleString('ar-IQ')} د.ع</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.stock < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, (p.stock/20)*100)}%`}}></div>
                    </div>
                    <span className={`text-[10px] font-black ${p.stock < 5 ? 'text-red-600' : 'text-slate-400'}`}>{p.stock} قطعة</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-scaleUp border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={closeModal} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاسم</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm" placeholder="مثلاً: وجبة برجر" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">القسم الرئيسي</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value, subCategoryId: ''})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm"
                  >
                    {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">القسم الفرعي</label>
                  <select 
                    value={newProduct.subCategoryId} 
                    onChange={e => setNewProduct({...newProduct, subCategoryId: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm"
                    disabled={availableSubCategories.length === 0}
                  >
                    <option value="">-- اختر القسم الفرعي --</option>
                    {availableSubCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">السعر (د.ع)</label>
                  <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">المخزون</label>
                  <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm" />
                </div>
              </div>
              
              <button onClick={handleAddProduct} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm">
                <Save size={18}/> حفظ البيانات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickStatCard = ({ title, value, trend, icon, color, isAlert }: any) => (
  <div className={`bg-white p-5 rounded-[32px] border ${isAlert ? 'border-red-200 bg-red-50/20' : 'border-slate-100'} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group`}>
    <div className="flex justify-between items-start">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[8px] font-black px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-auto">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className={`text-xl font-black mt-0.5 ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);
