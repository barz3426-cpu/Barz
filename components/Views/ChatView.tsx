
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, User, ShieldAlert, CheckCheck, Clock, Paperclip, MoreVertical } from 'lucide-react';
import { db } from '../../services/db';
import { ChatMessage, User as UserType } from '../../types';

interface ChatViewProps {
  orderId: string;
  recipientName: string;
  onClose: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ orderId, recipientName, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const [user, msgs] = await Promise.all([
      db.getCurrentUser(),
      db.getChatMessages(orderId)
    ]);
    setCurrentUser(user);
    setMessages(msgs);
  }, [orderId]);

  useEffect(() => {
    loadMessages();
    // الاستماع لحدث التحديث في قاعدة البيانات
    window.addEventListener('db-update', loadMessages);
    return () => window.removeEventListener('db-update', loadMessages);
  }, [loadMessages]);

  useEffect(() => {
    // تمرير تلقائي لآخر رسالة عند تحديث المصفوفة
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const textToSend = inputText.trim();
    setInputText(''); // مسح الحقل فوراً لتحسين تجربة المستخدم

    try {
      await db.sendMessage(orderId, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: textToSend
      });
      // سيتم تحديث الرسائل تلقائياً عبر حدث db-update
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(textToSend); // استعادة النص في حال فشل الإرسال
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white h-full sm:h-[85vh] sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Chat Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <User className="text-blue-600" size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg leading-tight">{recipientName}</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">متصل الآن بخصوص الطلب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95"><X size={20}/></button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
          {messages.length > 0 ? messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-scaleUp`}>
                <div className={`max-w-[85%] relative ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-[28px] shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    <p className="font-bold text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-black text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck size={12} className="text-blue-500" />}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-slate-100">
                <Clock size={32} className="text-blue-600" />
              </div>
              <div>
                <p className="font-black text-xl text-slate-900">المحادثة فارغة</p>
                <p className="text-sm font-bold mt-2">ابدأ المراسلة الآن بخصوص تفاصيل الطلب.</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-[28px] px-6 py-4 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-400 font-bold transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-14 h-14 bg-blue-600 text-white rounded-[24px] shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={22} className="rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
