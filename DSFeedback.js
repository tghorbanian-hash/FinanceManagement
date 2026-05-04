/* Filename: DSFeedback.js */
(() => {
  const React = window.React;
  const { useState, useEffect } = React;
  const { X, Maximize2, Minimize2, CheckCircle2, AlertCircle, Info, AlertTriangle } = window.LucideIcons || {};
  const { Button } = window.DSCore || {};

  const Modal = ({ isOpen, onClose, title, children, showMaximize = true, width = 'max-w-2xl', language = 'fa' }) => {
    const isRtl = language === 'fa';
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      if (isOpen) document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
        <div className={`bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col relative z-10 transition-all duration-300 animate-in zoom-in-95 overflow-hidden ${isMaximized ? 'w-full h-full inset-0 rounded-none' : `${width} w-full max-h-[95vh] rounded-2xl border border-slate-200`}`}>
          <div className="h-11 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h3 className="font-black text-slate-700 text-[13px] tracking-tight">{title}</h3>
            <div className="flex items-center gap-1">
              {showMaximize && (
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-95">
                  {isMaximized ? <Minimize2 size={14} strokeWidth={2.5} /> : <Maximize2 size={14} strokeWidth={2.5} />}
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all active:scale-95">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar bg-white flex flex-col min-h-0">{children}</div>
        </div>
      </div>
    );
  };

  const Tooltip = ({ children, text, position = 'top' }) => {
    const [show, setShow] = useState(false);
    const posClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
      left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
      right: "left-full top-1/2 -translate-y-1/2 ml-1.5"
    };
    return (
      <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
        {show && (
          <div className={`absolute z-[200] px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 duration-150 ${posClasses[position]}`}>
            {text}
          </div>
        )}
      </div>
    );
  };

  const Alert = ({ type = 'info', title, message, onClose }) => {
    const styles = {
      success: 'bg-emerald-50/50 border-emerald-200 text-emerald-800',
      error: 'bg-rose-50/50 border-rose-200 text-rose-800',
      warning: 'bg-amber-50/50 border-amber-200 text-amber-800',
      info: 'bg-indigo-50/50 border-indigo-200 text-indigo-800',
    };
    
    const icons = {
      success: <CheckCircle2 size={16} className="text-emerald-500" />,
      error: <AlertCircle size={16} className="text-rose-500" />,
      warning: <AlertTriangle size={16} className="text-amber-500" />,
      info: <Info size={16} className="text-indigo-500" />
    };

    return (
      <div className={`flex items-start p-3 border rounded-xl shadow-sm ${styles[type]} gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-1`}>
        <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
        <div className="flex-1 flex flex-col gap-0.5">
          {title && <h3 className="text-[12px] font-black">{title}</h3>}
          <div className="text-[11px] opacity-90 leading-relaxed font-medium">{message}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-0.5">
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  };

  const Toast = ({ type = 'success', message, isVisible, onClose }) => {
    if (!isVisible) return null;
    
    const styles = {
      success: 'bg-white border-emerald-100 text-emerald-900',
      error: 'bg-white border-rose-100 text-rose-900',
      warning: 'bg-white border-amber-100 text-amber-900',
      info: 'bg-white border-indigo-100 text-indigo-900',
    };

    const icons = {
      success: <CheckCircle2 size={16} className="text-emerald-500" />,
      error: <AlertCircle size={16} className="text-rose-500" />,
      warning: <AlertTriangle size={16} className="text-amber-500" />,
      info: <Info size={16} className="text-indigo-500" />
    };
    
    return (
      <div className={`fixed bottom-6 end-6 md:start-auto md:end-6 flex items-center px-4 py-3 border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${styles[type]} z-[200] gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300`}>
        <div className="shrink-0">{icons[type]}</div>
        <div className="text-[12px] font-black whitespace-nowrap">{message}</div>
        {onClose && (
          <button onClick={onClose} className="opacity-30 hover:opacity-100 transition-all p-1 ms-2 hover:bg-slate-50 rounded-lg">
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  };

  const Banner = ({ type = 'info', message, action, onClose }) => {
    const styles = {
      success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      error: 'bg-rose-50 border-rose-100 text-rose-800',
      warning: 'bg-amber-50 border-amber-100 text-amber-800',
      info: 'bg-indigo-50 border-indigo-100 text-indigo-800',
    };
    
    const icons = {
      success: <CheckCircle2 size={14} className="text-emerald-500" />,
      error: <AlertCircle size={14} className="text-rose-500" />,
      warning: <AlertTriangle size={14} className="text-amber-500" />,
      info: <Info size={14} className="text-indigo-500" />
    };

    return (
      <div className={`w-full flex items-center justify-between px-4 py-2 border-b transition-all duration-300 ${styles[type]} z-40`}>
        <div className="flex items-center gap-2.5">
          {icons[type]}
          <span className="text-[11px] font-bold tracking-tight">{message}</span>
        </div>
        <div className="flex items-center gap-3">
          {action && (
            <button onClick={action.onClick} className="text-[10px] font-black bg-white/50 hover:bg-white border border-black/5 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-sm">
              {action.label}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="opacity-30 hover:opacity-100 p-1 hover:bg-black/5 rounded-md transition-all">
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const Dialog = ({ isOpen, title, children, onConfirm, onCancel, confirmLabel = 'تایید', cancelLabel = 'انصراف', type = 'info', language = 'fa' }) => {
    const isRtl = language === 'fa';
    
    useEffect(() => {
      const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onCancel && onCancel(); };
      if (isOpen) document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const accentStyles = {
      success: "text-emerald-600 bg-emerald-50 border-emerald-100",
      error: "text-rose-600 bg-rose-50 border-rose-100",
      warning: "text-amber-600 bg-amber-50 border-amber-100",
      info: "text-indigo-600 bg-indigo-50 border-indigo-100"
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={onCancel} />
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-[0_30px_70px_rgba(0,0,0,0.12)] w-full max-w-sm overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
          <div className="px-6 pt-6 pb-3 flex items-center justify-between">
            <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${accentStyles[type]}`}>
              {title}
            </div>
            <button onClick={onCancel} className="opacity-30 hover:opacity-100 hover:bg-slate-100 p-1.5 rounded-lg transition-all">
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="px-6 pb-6">
            <div className="text-slate-600 text-[13px] leading-relaxed font-bold py-1">
              {children}
            </div>
            <div className="mt-8 flex justify-end gap-2.5">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel} className="!rounded-xl !px-4 !border-slate-200 !text-slate-500 !h-8 !text-[11px]">
                  {cancelLabel}
                </Button>
              )}
              {onConfirm && (
                <Button variant={type === 'error' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} className="!rounded-xl !px-6 !h-8 !text-[11px] shadow-sm">
                  {confirmLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  window.DSFeedback = { Modal, Tooltip, Alert, Toast, Banner, Dialog };
})();