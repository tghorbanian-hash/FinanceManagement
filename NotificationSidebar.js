/* Filename: NotificationSidebar.js */
import React, { useState, useEffect } from 'react';
import { X, Trash2, Bell, CheckCircle2, AlertCircle, Info, Trash, Loader2 } from 'lucide-react';

const NotificationSidebar = ({ isOpen, onClose, language = 'fa' }) => {
  const { Button } = window.DesignSystem || {};
  
  const isRtl = language === 'fa';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasInitialized, setHasInitialized] = useState(false); // جلوگیری از تولید مجدد دیتا
  const itemsPerPage = 20;

  const t = (fa, en) => isRtl ? fa : en;

  // شبیه‌سازی دریافت دیتا فقط برای اولین بار
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setLoading(true);
      const mockData = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        title: `${t('اعلان شماره', 'Notification #')}${i + 1}`,
        message: t('این یک پیام سیستم برای تست اسکرول و صفحه‌بندی است.', 'This is a system message to test scrolling and pagination.'),
        type: i % 3 === 0 ? 'info' : i % 3 === 1 ? 'success' : 'error',
        time: new Date(Date.now() - i * 3600000).toLocaleTimeString(isRtl ? 'fa-IR' : 'en-US')
      }));
      setNotifications(mockData);
      setHasInitialized(true);
      setLoading(false);
    }
  }, [isOpen, hasInitialized, t, isRtl]);

  const deleteOne = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAll = () => {
    if (window.confirm(t('آیا از حذف تمام اعلان‌ها اطمینان دارید؟', 'Are you sure you want to delete all notifications?'))) {
      setNotifications([]);
      setPage(1); // برگشت به صفحه اول بعد از حذف
    }
  };

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const currentData = notifications.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      
      <aside 
        className={`fixed top-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isRtl ? 'left-0 animate-slide-in-left' : 'right-0 animate-slide-in-right'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-indigo-600" />
            <span className="font-black text-slate-800 text-[14px]">{t('اعلان‌های سیستم', 'System Notifications')}</span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-5 py-2.5 border-b border-slate-50 flex justify-end">
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
                    <span className="text-[9px] text-slate-400 font-medium">{notif.time}</span>
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