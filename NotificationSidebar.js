/* Filename: NotificationSidebar.js */
import React, { useState, useEffect } from 'react';
import { X, Trash2, Bell, CheckCircle2, AlertCircle, Info, Trash, Loader2 } from 'lucide-react';

const NotificationSidebar = ({ isOpen, onClose, language = 'fa', onUpdateUnread }) => {
  const { Button } = window.DesignSystem || {};
  const supabase = window.supabase;
  
  // آی‌دی کاربر تستی که در سیستم شما فعلاً هاردکد شده است
  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
  
  const isRtl = language === 'fa';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const t = (fa, en) => isRtl ? fa : en;

  // واکشی اطلاعات و اتصال به سوکت‌های بلادرنگ سوپابیس
  useEffect(() => {
    if (!supabase) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setNotifications(data);
        if (onUpdateUnread) onUpdateUnread(data.length); 
      }
      setLoading(false);
    };

    fetchNotifications();

    // ایجاد کانال Real-time برای دریافت آپدیت‌ها در لحظه
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_notifications',
        filter: `user_id=eq.${MOCK_USER_ID}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => {
            const newData = [payload.new, ...prev];
            if (onUpdateUnread) onUpdateUnread(newData.length);
            return newData;
          });
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => {
            const newData = prev.filter(n => n.id !== payload.old.id);
            if (onUpdateUnread) onUpdateUnread(newData.length);
            return newData;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, onUpdateUnread]);

  const deleteOne = async (id) => {
    // آپدیت آنی در رابط کاربری (Optimistic UI)
    setNotifications(prev => prev.filter(n => n.id !== id));
    // ارسال درخواست حذف به دیتابیس
    await supabase.from('system_notifications').delete().eq('id', id);
  };

  const deleteAll = async () => {
    if (window.confirm(t('آیا از حذف تمام اعلان‌ها اطمینان دارید؟', 'Are you sure you want to delete all notifications?'))) {
      setNotifications([]);
      setPage(1);
      await supabase.from('system_notifications').delete().eq('user_id', MOCK_USER_ID);
    }
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleString(isRtl ? 'fa-IR' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch(e) { return isoString; }
  };

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const currentData = notifications.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // برای زنده ماندن سوکت‌ها، در صورت بسته بودن سایدبار فقط UI مخفی می‌شود و هوک‌ها به کارشان ادامه می‌دهند
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      
      <aside 
        className={`fixed top-0 bottom-0 w-full max-w-[380px] bg-white shadow-2xl z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isRtl ? 'left-0 animate-slide-in-left' : 'right-0 animate-slide-in-right'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-5 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" />
            <span className="font-black text-slate-800 text-[14px]">{t('اعلان‌های سیستم', 'System Notifications')}</span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-50 flex justify-end">
            <button 
              onClick={deleteAll}
              className="text-red-500 hover:text-red-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md"
            >
              <Trash2 size={14} />
              {t('حذف همه', 'Clear All')}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : currentData.length > 0 ? (
            currentData.map((notif) => (
              <div key={notif.id} className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-2.5">
                  <div className={`mt-0.5 shrink-0 ${notif.type === 'success' ? 'text-emerald-500' : notif.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                    {notif.type === 'success' ? <CheckCircle2 size={16} /> : notif.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-bold text-slate-800 mb-1 leading-tight">{notif.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5 line-clamp-2">{notif.message}</p>
                    <span className="text-[9px] text-slate-400 font-medium">{formatTime(notif.created_at)}</span>
                  </div>
                  <button 
                    onClick={() => deleteOne(notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all self-start"
                    title={t('حذف اعلان', 'Delete Notification')}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center"><Bell size={24} className="opacity-30" /></div>
              <p className="text-[12px] font-medium">{t('هیچ اعلانی یافت نشد.', 'No notifications found.')}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && Button && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button 
              size="sm" variant="outline" disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >{t('قبلی', 'Prev')}</Button>
            <span className="text-[11px] font-bold text-slate-500">
              {t('صفحه', 'Page')} {page} {t('از', 'of')} {totalPages}
            </span>
            <Button 
              size="sm" variant="outline" disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >{t('بعدی', 'Next')}</Button>
          </div>
        )}
      </aside>
    </>
  );
};

window.NotificationSidebar = NotificationSidebar;