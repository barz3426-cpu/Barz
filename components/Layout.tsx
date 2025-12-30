
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User, Notification } from '../types';
// Added ChevronRight to imports
import { Menu, Wallet, Moon, Sun, Award, LogOut, User as UserIcon, ShieldCheck, Globe, X, Bell, Package, CreditCard, Clock, ChevronRight } from 'lucide-react';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onLogout: () => void;
  title: string;
  onNavigate?: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, role, onLogout, title, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);

  const fetchLayoutData = async () => {
    const currentUser = await db.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      const notifs = await db.getNotifications();
      setNotifications(notifs);
    }
  };

  useEffect(() => {
    fetchLayoutData();
    window.addEventListener('db-update', fetchLayoutData);
    
    const handleToast = (e: any) => {
      const newNotif = e.detail;
      setToast(newNotif);
      setTimeout(() => setToast(null), 5000);
    };

    window.addEventListener('new-notification-toast', handleToast);
    return () => {
      window.removeEventListener('db-update', fetchLayoutData);
      window.removeEventListener('new-notification-toast', handleToast);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* Dynamic Floating Toast */}
      {toast && (
        <div className="fixed top-12 left-6 right-6 z-[1000] animate-slideUp">
           <div className="glass-card shadow-2xl p-5 rounded-[32px] flex items-center gap-4 max-w-sm mx-auto border-blue-100/50">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                 {toast.type === 'ORDER' ? <Package size={24}/> : <Bell size={24}/>}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="font-black text-sm text-slate-900">{toast.title}</p>
                 <p className="text-[10px] font-bold text-slate-500 truncate mt-1">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="p-2 text-slate-300"><X size={18}/></button>
           </div>
        </div>
      )}

      {/* Modern Header */}
      <header className={`sticky top-0 z-[60] pt-6 pb-2 transition-all ${darkMode ? 'bg-slate-950/80 border-white/5' : 'bg-[#F8FAFC]/80 border-slate-100'} backdrop-blur-2xl`}>
        <div className="px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center active:scale-90 transition-all"
            >
              <Menu size={22} className="text-slate-900" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">خدماتي</h1>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                 <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsNotifOpen(true)}
               className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center relative active:scale-90 transition-all"
             >
                <Bell size={20} className="text-slate-900" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-4 border-[#F8FAFC]">{unreadCount}</span>
                )}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Full Screen Notif Drawer */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[150] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={() => setIsNotifOpen(false)} />
          <aside className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[60px] max-h-[90vh] shadow-2xl flex flex-col animate-slideUp">
             <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-2xl font-black">مركز التنبيهات</h3>
                <button onClick={() => setIsNotifOpen(false)} className="p-4 bg-slate-50 rounded-2xl"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-20">
                {notifications.length > 0 ? notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-6 rounded-[40px] border transition-all ${n.isRead ? 'bg-white border-slate-50 opacity-60' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}
                  >
                     <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                           <Package size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                           <p className="font-black text-slate-900 text-sm">{n.title}</p>
                           <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                           <div className="flex items-center gap-1.5 mt-4 text-slate-300">
                             <Clock size={12}/>
                             <span className="text-[9px] font-bold">{new Date(n.timestamp).toLocaleTimeString('ar-SA')}</span>
                           </div>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                     </div>
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-20 font-black">
                     <Bell size={64} className="mx-auto mb-4" />
                     <p>لا يوجد جديد حالياً</p>
                  </div>
                )}
             </div>
          </aside>
        </div>
      )}

      {/* Sidebar - Enhanced */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-[85%] max-w-[340px] shadow-2xl flex flex-col bg-white overflow-hidden animate-reveal">
             <div className="p-10 pt-20 bg-gradient-to-br from-blue-600 to-indigo-800 text-white relative">
                <div className="absolute top-8 left-8 p-3 bg-white/10 rounded-2xl" onClick={() => setIsSidebarOpen(false)}><X size={24}/></div>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[30px] border-4 border-white/20 shadow-2xl overflow-hidden">
                    <img src={user?.avatar || 'https://i.pravatar.cc/150'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-black text-xl leading-none">{user?.name}</p>
                    <p className="text-[10px] opacity-60 font-bold mt-2">{user?.phone}</p>
                  </div>
                </div>
             </div>
             <div className="flex-1 py-8 px-6 space-y-2 overflow-y-auto">
                {[
                  { id: 'PROFILE', icon: <UserIcon size={20}/>, label: 'إعدادات الحساب' },
                  { id: 'WALLET', icon: <Wallet size={20}/>, label: 'المحفظة الرقمية' },
                  { id: 'SECURITY', icon: <ShieldCheck size={20}/>, label: 'الأمان والخصوصية' },
                  { id: 'SETTINGS', icon: <Globe size={20}/>, label: 'اللغة والإعدادات' },
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => { setIsSidebarOpen(false); if (onNavigate) onNavigate(item.id); }}
                    className="w-full flex items-center justify-between p-5 rounded-[24px] hover:bg-slate-50 font-black text-slate-600 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-4">{item.icon} <span className="text-sm">{item.label}</span></div>
                    <ChevronRight size={16} className="text-slate-200" />
                  </button>
                ))}
             </div>
             <div className="p-8 border-t border-slate-50">
                <button onClick={onLogout} className="w-full py-5 bg-red-50 text-red-600 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                   <LogOut size={20} /> تسجيل الخروج
                </button>
             </div>
          </aside>
        </div>
      )}
    </div>
  );
};
