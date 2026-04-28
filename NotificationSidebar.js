/* Filename: NotificationSidebar.js */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Bell, CheckCircle2, AlertCircle, Info, Trash, Loader2, Check } from 'lucide-react';

const NotificationSidebar = ({ isOpen, onClose, language = 'fa', onUpdateUnread }) => {
  const { Button } = window.DesignSystem || {};
  const supabase = window.supabase;
  
  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
  
  const isRtl = language === 'fa';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const t = (fa, en) => isRtl ? fa : en;

  // محاسبه تعداد اعلان‌های ناخوانده
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  // ارسال تعداد ناخوانده‌ها به هدر اصلی سیستم (NavigationSystem)
  useEffect(() => {
    if (onUpdateUnread) {
      onUpdateUnread(unreadCount);
    }
  }, [unreadCount, onUpdateUnread]);

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
      }
      setLoading(false);
    };

    fetchNotifications();

    // اضافه شدن آپدیت بلادرنگ برای (UPDATE) وضعیت خوانده شدن
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_notifications',
        filter: `user_id=eq.${MOCK_USER_ID}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // متد جدید: خواندن یک اعلان
  const markAsRead = async (id) => {
    // آپدیت سریع در رابط کاربری
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // ثبت در دیتابیس
    await supabase.from('system_notifications').update({ is_read: true }).eq('id', id);
  };

  // متد جدید: خواندن تمام اعلان‌ها
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('system_notifications').update({ is_read: true }).eq('user_id', MOCK_USER_ID).eq('is_read', false);
  };

  const deleteOne = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${unreadCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              {unreadCount > 0 ? `${unreadCount} ${t('جدید', 'New')}` : t('همه خوانده شده', 'All Read')}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar (اضافه شدن دکمه خواندن همه) */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {t('خواندن همه', 'Mark All Read')}
            </button>
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
              <div 
                key={notif.id} 
                className={`group relative border rounded-lg p-3 transition-all animate-in fade-in slide-in-from-bottom-2 ${
                  notif.is_read 
                    ? 'bg-white border-slate-100 hover:border-slate-200' 
                    : 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-2.5">
                  <div className={`mt-0.5 shrink-0 ${notif.is_read ? 'opacity-50' : ''} ${notif.type === 'success' ? 'text-emerald-500' : notif.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                    {notif.type === 'success' ? <CheckCircle2 size={16} /> : notif.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[12px] font-bold mb-1 leading-tight ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>{notif.title}</h4>
                    <p className={`text-[11px] leading-relaxed mb-1.5 line-clamp-2 ${notif.is_read ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                    <span className="text-[9px] text-slate-400 font-medium">{formatTime(notif.created_at)}</span>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all self-start shrink-0">
                    {!notif.is_read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        title={t('علامت‌گذاری خوانده شده', 'Mark as read')}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteOne(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                      title={t('حذف اعلان', 'Delete')}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                {/* نشانگر بصری اعلان جدید */}
                {!notif.is_read && (
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-0 w-1 rounded-l-md' : 'left-0 w-1 rounded-r-md'} h-8 bg-indigo-500`} />
                )}
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