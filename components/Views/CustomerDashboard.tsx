
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, ShoppingCart, Star, Heart, ChevronRight, 
  Package, Sparkles, User as UserIcon, Plus, Minus, X, 
  CheckCircle2, Clock, Bot, Send, ArrowRight, Loader2, MessageSquare,
  MapPin, Flame, Zap, Navigation, Phone, Stars, Rocket
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, Banner, User as UserType, Order, Service, Store } from '../../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatView } from './ChatView';
import L from 'leaflet';

const TrackingMap: React.FC<{ location: any }> = ({ location }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false })
      .setView([location.lat || 33.3152, location.lng || 44.3661], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><div class="w-2 h-2 bg-white rounded-full animate-ping"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    L.marker([location.lat || 33.3152, location.lng || 44.3661], { icon }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [location]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-[40px] shadow-inner" />;
};

export const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'ORDERS' | 'FAVORITES'>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<Service | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [showCart, setShowCart] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<UserType | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Banner Dragging Logic
  const [currentBanner, setCurrentBanner] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const bannerTimerRef = useRef<number | null>(null);
  const startX = useRef(0);
  const containerWidth = useRef(0);
  const bannerContainerRef = useRef<HTMLDivElement>(null);

  const startBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = window.setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % (banners.length || 1));
    }, 5000);
  }, [banners.length]);

  const stopBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
  }, []);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    stopBannerTimer();
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    if (bannerContainerRef.current) {
      containerWidth.current = bannerContainerRef.current.offsetWidth;
    }
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = containerWidth.current / 4;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swipe Right - In RTL, this moves to previous banner (index decreases)
        setCurrentBanner(prev => Math.max(0, prev - 1));
      } else {
        // Swipe Left - In RTL, this moves to next banner (index increases)
        setCurrentBanner(prev => Math.min(banners.length - 1, prev + 1));
      }
    }
    
    setDragOffset(0);
    startBannerTimer();
  };

  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'أهلاً بك في خدماتي! أنا مساعدك الذكي المخصص لمساعدتك في استخدام التطبيق والتعرف على خدماتنا. كيف يمكنني خدمتك بخصوص التطبيق اليوم؟' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [p, b, u, s, st, c, ord] = await Promise.all([
      db.getProducts(), db.getBanners(), db.getCurrentUser(),
      db.getServices(), db.getStores(), db.getCart(), db.getOrders()
    ]);
    setProducts(p); setBanners(b); setCurrentUser(u);
    setServices(s); setStores(st); setCart(c); setOrders(ord);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('db-update', loadData);
    return () => {
      window.removeEventListener('db-update', loadData);
    };
  }, [loadData]);

  useEffect(() => {
    if (banners.length > 0) {
      startBannerTimer();
    }
    return () => stopBannerTimer();
  }, [banners.length, startBannerTimer, stopBannerTimer]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handleSendMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiInput('');
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        أنت ذكاء اصطناعي مدمج داخل تطبيق [خدماتي].
        مهمتك الوحيدة هي:
        - شرح ميزات التطبيق
        - مساعدة المستخدم على استخدام التطبيق
        - الإجابة فقط على الأسئلة المتعلقة بالتطبيق
        - توضيح الإعدادات، الأدوات، والخدمات الموجودة داخل التطبيق

        ممنوع عليك:
        - التحدث عن أي موضوع خارج التطبيق
        - إعطاء معلومات عامة، تعليمية، سياسية، دينية، أو تقنية غير متعلقة بالتطبيق
        - اقتراح تطبيقات أخرى أو مواقع خارجية
        - الإجابة على أسئلة لا تخص التطبيق

        أسلوبك: مهذب وواضح.
      `;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction }
      });
      setAiMessages(prev => [...prev, { role: 'bot', text: response.text || 'عذراً، لم أتمكن من معالجة طلبك.' }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ أثناء الاتصال بالخادم.' }]);
    } finally { setIsAiLoading(false); }
  };

  const handleCheckout = async () => {
    try {
      await db.checkout();
      setShowCart(false);
      setActiveTab('ORDERS');
    } catch (err: any) { alert(err.message); }
  };

  const openTracking = async (order: Order) => {
    setTrackingOrder(order);
    if (order.driverId) {
      const driver = await db.getUserById(order.driverId);
      setAssignedDriver(driver);
    }
  };

  return (
    <div className="animate-fadeIn min-h-screen pb-40">
      {/* Premium Header */}
      <div className="px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 pl-6 rounded-full border border-white/50 shadow-sm">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                 <MapPin size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">توصيل إلى</p>
                <p className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">{currentUser?.addresses[0]?.address || 'بغداد'}</p>
              </div>
           </div>
           <button onClick={() => setShowCart(true)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center relative shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-50 active:scale-90 transition-all">
             <ShoppingCart size={22} className="text-slate-900" />
             {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-lg">{cart.length}</span>}
           </button>
        </div>

        <div className="flex items-center gap-3">
          {(selectedCategory || selectedStore) && (
            <button onClick={() => selectedStore ? setSelectedStore(null) : setSelectedCategory(null)} className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
              <ArrowRight size={20} />
            </button>
          )}
          <div className="relative flex-1 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن وجبة، متجر، أو خدمة..."
              className="w-full h-15 pr-14 pl-6 bg-white border border-slate-100 rounded-3xl shadow-[0_5px_15px_rgba(0,0,0,0.02)] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-600/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        {activeTab === 'HOME' && (
          <div className="space-y-12 animate-reveal">
            {!selectedCategory && !selectedStore && (
              <>
                {/* Enhanced Interactive Banners */}
                <div className="px-6">
                   <div 
                      ref={bannerContainerRef}
                      className="relative h-56 w-full overflow-hidden rounded-[48px] shadow-2xl group cursor-grab active:cursor-grabbing touch-none select-none"
                      onTouchStart={handleDragStart}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                   >
                      <div 
                        className={`flex h-full ${!isDragging ? 'transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)' : ''}`} 
                        style={{ 
                          transform: `translateX(calc(${currentBanner * 100}% + ${dragOffset}px))`,
                        }}
                      >
                        {banners.map((b, i) => (
                          <div key={b.id} className="min-w-full h-full relative">
                            <img src={b.imageUrl} className={`w-full h-full object-cover transition-transform duration-[6000ms] ${currentBanner === i ? 'scale-110' : 'scale-100'}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-10 flex flex-col justify-end text-white">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-blue-600 rounded-full text-[8px] font-black uppercase tracking-[2px]">عرض خاص</span>
                              </div>
                              <h3 className="text-2xl font-black leading-tight pointer-events-none">{b.title}</h3>
                              <p className="text-xs opacity-70 font-bold mt-2 pointer-events-none">{b.subtitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 bg-black/20 backdrop-blur-md rounded-full pointer-events-none">
                        {banners.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentBanner === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                        ))}
                      </div>
                   </div>
                </div>

                {/* Categories Grid */}
                <div className="px-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black flex items-center gap-2">الأقسام <Zap size={18} className="text-blue-600" /></h3>
                    <button className="text-xs font-black text-blue-600">رؤية الكل</button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {services.map(s => (
                      <button key={s.id} onClick={() => setSelectedCategory(s)} className="flex flex-col items-center gap-3 group">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-y-2 shadow-xl ${s.color} text-white relative overflow-hidden`}>
                           <Package size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 text-center tracking-tight">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nearby Stores */}
                <div className="px-6">
                  <h3 className="text-xl font-black mb-6">المتاجر المميزة <Stars size={18} className="text-amber-400 inline" /></h3>
                  <div className="space-y-6">
                    {stores.map(store => (
                       <div key={store.id} onClick={() => setSelectedStore(store)} className="bg-white p-5 rounded-[40px] border border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex items-center gap-5 active:scale-[0.98] transition-all group cursor-pointer">
                          <div className="w-20 h-20 rounded-[28px] overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                            <img src={store.image} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-900 text-lg leading-none">{store.name}</h4>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-amber-500 font-black text-[10px]"><Star size={12} fill="currentColor"/> {store.rating}</div>
                              <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]"><Clock size={12}/> {store.deliveryTime}</div>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <ChevronRight size={20} />
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedStore && (
              <div className="px-6 animate-reveal">
                <div className="relative h-64 w-full rounded-[48px] overflow-hidden shadow-2xl mb-8">
                   <img src={selectedStore.image} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-10 flex flex-col justify-end">
                      <h3 className="text-3xl font-black text-white">{selectedStore.name}</h3>
                      <p className="text-white/60 font-bold mt-2">{selectedStore.description}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {products.filter(p => p.storeId === selectedStore.id).map(p => (
                    <ProductCardPremium 
                      key={p.id} 
                      product={p} 
                      onAdd={() => db.addToCart(p)} 
                      isFav={currentUser?.favorites?.includes(p.id)}
                      onToggleFav={() => db.toggleFavorite(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="px-6 space-y-8 animate-reveal">
            <h3 className="text-3xl font-black">طلباتي النشطة</h3>
            {orders.length > 0 ? orders.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col gap-6 relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                       <Package size={24} />
                    </div>
                    <div>
                      <p className="font-black text-sm">رقم الطلب #{o.id.slice(-5)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(o.timestamp).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    {o.status}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                  <p className="text-xl font-black text-blue-600">{o.total.toLocaleString('ar-IQ')} <span className="text-xs">د.ع</span></p>
                  {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => openTracking(o)}
                      className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center gap-3 active:scale-95 transition-all shadow-xl"
                    >
                      <Navigation size={16}/> تتبع مباشر
                    </button>
                  )}
                </div>
              </div>
            )) : <div className="py-24 text-center opacity-30 font-black">سجلك نظيف، اطلب الآن!</div>}
          </div>
        )}
      </div>

      {/* Tracking View */}
      {trackingOrder && (
        <div className="fixed inset-0 z-[700] flex flex-col animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setTrackingOrder(null)} />
          <div className="mt-auto bg-white rounded-t-[60px] h-[95vh] flex flex-col shadow-2xl animate-slideUp overflow-hidden">
            <div className="p-10 pb-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-5">
                  <button onClick={() => setTrackingOrder(null)} className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center active:scale-90 transition-all"><X size={24}/></button>
                  <div>
                    <h3 className="text-2xl font-black">رحلة الطلب</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 animate-pulse">تتبع مباشر • LIVE</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto px-10 pb-16 space-y-10 custom-scrollbar">
              <div className="h-[350px] w-full relative rounded-[48px] overflow-hidden border-4 border-white shadow-2xl">
                 <TrackingMap location={trackingOrder.location} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigation */}
      <nav className="fixed bottom-8 left-6 right-6 z-50">
         <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 p-2 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex justify-between items-center px-10">
            {[
              { id: 'HOME', icon: <Rocket size={20}/>, label: 'الرئيسية' },
              { id: 'ORDERS', icon: <Package size={20}/>, label: 'طلباتي' },
              { id: 'FAVORITES', icon: <Heart size={20}/>, label: 'المفضلة' },
              { id: 'PROFILE', icon: <UserIcon size={20}/>, label: 'حسابي' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => tab.id === 'PROFILE' ? window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'ACCOUNT' })) : setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-2 p-3 transition-all duration-500 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <div className={`transition-transform duration-500 ${activeTab === tab.id ? 'scale-125 -translate-y-2' : ''}`}>{tab.icon}</div>
              </button>
            ))}
         </div>
      </nav>

      {/* AI Assistant Bubble */}
      <button 
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-32 left-8 w-18 h-18 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-[24px] shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-90 animate-bounce"
      >
        <Bot size={32} />
      </button>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[500] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[60px] p-10 animate-slideUp max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="text-3xl font-black">سلة المشتريات</h3>
              <button onClick={() => setShowCart(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-5 bg-slate-50 p-5 rounded-[32px] border border-slate-100">
                  <img src={item.image} className="w-20 h-20 rounded-[24px] object-cover" />
                  <div className="flex-1">
                    <p className="font-black text-sm text-slate-900">{item.name}</p>
                    <p className="text-blue-600 font-black text-xs mt-1">{item.price.toLocaleString('ar-IQ')} د.ع</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100">
                    <button onClick={() => db.updateCartQuantity(item.id, -1)} className="w-8 h-8 text-slate-400 hover:text-red-500"><Minus size={16}/></button>
                    <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => db.updateCartQuantity(item.id, 1)} className="w-8 h-8 text-slate-400 hover:text-blue-600"><Plus size={16}/></button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mt-10 pt-10 border-t border-slate-50 shrink-0">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">إجمالي الدفع</span>
                  <span className="text-3xl font-black text-blue-600">{cartTotal.toLocaleString('ar-IQ')} د.ع</span>
                </div>
                <button 
                  onClick={handleCheckout} 
                  className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all"
                >
                  تأكيد وإتمام الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCardPremium = ({ product, onAdd, onToggleFav, isFav }: any) => (
  <div className="bg-white rounded-[40px] p-4 border border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col group active:scale-[0.98] transition-all">
    <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-inner">
      <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }} className={`absolute top-4 right-4 p-3 rounded-2xl backdrop-blur-md transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-400'}`}>
        <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
    <div className="mt-5 px-1 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-blue-600 font-black text-sm">{product.price.toLocaleString('ar-IQ')} <span className="text-[8px] opacity-60">د.ع</span></p>
      </div>
      <button onClick={onAdd} className="w-full py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black flex items-center justify-center gap-3 transition-all">
        <Plus size={16}/> أضف للسلة
      </button>
    </div>
  </div>
);
