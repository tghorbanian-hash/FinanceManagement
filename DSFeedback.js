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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
        <div className={`bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] flex flex-col relative z-10 transition-all duration-500 animate-in zoom-in-95 overflow-hidden ${isMaximized ? 'w-full h-full inset-0 rounded-none' : `${width} w-full max-h-[90vh] rounded-3xl`}`}>
          <div className="h-14 px-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50 shrink-0">
            <h3 className="font-black text-slate-800 text-[14px] tracking-tight">{title}</h3>
            <div className="flex items-center gap-2">
              {showMaximize && (
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all active:scale-90">
                  {isMaximized ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
                </button>
              )}
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all active:scale-90">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20 flex flex-col min-h-0">{children}</div>
        </div>
      </div>
    );
  };

  const Tooltip = ({ children, text, position = 'top' }) => {
    const [show, setShow] = useState(false);
    const posClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2"
    };
    return (
      <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
        {show && (
          <div className={`absolute z-[200] px-3 py-1.5 bg-slate-800/95 backdrop-blur-md text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-150 ${posClasses[position]}`}>
            {text}
            <div className={`absolute w-2 h-2 bg-slate-800/95 rotate-45 ${position === 'top' ? 'top-full -mt-1 left-1/2 -ml-1' : position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -ml-1' : ''}`}></div>
          </div>
        )}
      </div>
    );
  };

  const Alert = ({ type = 'info', title, message, onClose }) => {
    const styles = {
      success: 'bg-emerald-50/40 border-emerald-200/50 text-emerald-800 ring-emerald-50/50',
      error: 'bg-rose-50/40 border-rose-200/50 text-rose-800 ring-rose-50/50',
      warning: 'bg-amber-50/40 border-amber-200/50 text-amber-900 ring-amber-50/50',
      info: 'bg-indigo-50/40 border-indigo-200/50 text-indigo-800 ring-indigo-50/50',
    };
    
    const icons = {
      success: <CheckCircle2 size={18} className="text-emerald-500" />,
      error: <AlertCircle size={18} className="text-rose-500" />,
      warning: <AlertTriangle size={18} className="text-amber-500" />,
      info: <Info size={18} className="text-indigo-500" />
    };

    return (
      <div className={`flex items-start p-4 border rounded-2xl backdrop-blur-xl shadow-sm ring-4 ${styles[type]} gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2`}>
        <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
        <div className="flex-1 flex flex-col gap-1">
          {title && <h3 className="text-[13px] font-black">{title}</h3>}
          <div className="text-[12px] opacity-80 leading-relaxed font-medium">{message}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-lg">
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  };

  const Toast = ({ type = 'success', message, isVisible, onClose }) => {
    if (!isVisible) return null;
    
    const styles = {
      success: 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-100',
      error: 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-rose-100',
      warning: 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-amber-100',
      info: 'bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-indigo-100',
    };

    const icons = {
      success: <CheckCircle2 size={16} className="text-emerald-600" />,
      error: <AlertCircle size={16} className="text-rose-600" />,
      warning: <AlertTriangle size={16} className="text-amber-600" />,
      info: <Info size={16} className="text-indigo-600" />
    };
    
    return (
      <div className={`fixed bottom-8 end-8 md:start-auto md:end-8 flex items-center p-4 border-2 rounded-2xl backdrop-blur-2xl shadow-2xl ${styles[type]} z-[150] gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500`}>
        <div className="shrink-0">{icons[type]}</div>
        <div className="text-[12px] font-black">{message}</div>
        {onClose && (
          <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-all p-1.5 border-s border-black/10 ps-4 ml-2">
            <X size={14} strokeWidth={3} />
          </button>
        )}
      </div>
    );
  };

  const Banner = ({ type = 'info', message, action, onClose }) => {
    const styles = {
      success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
      error: 'bg-rose-50 border-rose-100 text-rose-900',
      warning: 'bg-amber-50 border-amber-100 text-amber-900',
      info: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    };
    
    const icons = {
      success: <CheckCircle2 size={16} className="text-emerald-500" />,
      error: <AlertCircle size={16} className="text-rose-500" />,
      warning: <AlertTriangle size={16} className="text-amber-500" />,
      info: <Info size={16} className="text-indigo-500" />
    };

    return (
      <div className={`w-full flex items-center justify-between px-6 py-3 border-b backdrop-blur-md transition-all duration-300 ${styles[type]} z-40`}>
        <div className="flex items-center gap-3">
          {icons[type]}
          <span className="text-[12px] font-bold tracking-tight">{message}</span>
        </div>
        <div className="flex items-center gap-4">
          {action && (
            <button onClick={action.onClick} className="text-[11px] font-black bg-white/60 hover:bg-white border border-black/5 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm">
              {action.label}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="opacity-30 hover:opacity-100 hover:bg-black/5 p-1.5 rounded-lg transition-all">
              <X size={16} strokeWidth={2.5} />
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

    const accentColors = {
      success: "bg-emerald-500/10 text-emerald-600 border-emerald-100",
      error: "bg-rose-500/10 text-rose-600 border-rose-100",
      warning: "bg-amber-500/10 text-amber-600 border-amber-100",
      info: "bg-indigo-500/10 text-indigo-600 border-indigo-100"
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300" onClick={onCancel} />
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_48px_96px_-12px_rgba(0,0,0,0.18)] w-full max-w-md overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-300">
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${accentColors[type]}`}>
              {title}
            </div>
            <button onClick={onCancel} className="opacity-30 hover:opacity-100 hover:bg-slate-100 p-2 rounded-xl transition-all">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
          <div className="px-8 pb-8">
            <div className="text-slate-600 text-[14px] leading-relaxed font-bold py-2">
              {children}
            </div>
            <div className="mt-10 flex justify-end gap-3">
              {onCancel && (
                <Button variant="outline" size="md" onClick={onCancel} className="!rounded-2xl !px-6 !border-slate-200">
                  {cancelLabel}
                </Button>
              )}
              {onConfirm && (
                <Button variant={type === 'error' ? 'danger' : 'primary'} size="md" onClick={onConfirm} className="!rounded-2xl !px-8 shadow-lg shadow-indigo-100">
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