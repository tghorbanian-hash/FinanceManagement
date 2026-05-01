/* Filename: DSFeedback.js */
(() => {
  const React = window.React;
  const { useState, useEffect } = React;
  const { X, Maximize2, Minimize2 } = window.LucideIcons || {};
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
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
        <div className={`bg-white shadow-2xl flex flex-col relative z-10 transition-all duration-300 animate-in zoom-in-95 overflow-hidden ${isMaximized ? 'w-full h-full inset-0 rounded-none' : `${width} w-full max-h-[90vh] rounded-xl`}`}>
          <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="font-black text-slate-800 text-[13px]">{title}</h3>
            <div className="flex items-center gap-1.5">
              {showMaximize && <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">{isMaximized ? <Minimize2 size={14} strokeWidth={2.5} /> : <Maximize2 size={14} strokeWidth={2.5} />}</button>}
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><X size={16} strokeWidth={2.5} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 flex flex-col min-h-0">{children}</div>
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
          <div className={`absolute z-[200] px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-150 ${posClasses[position]}`}>
            {text}
            <div className={`absolute w-1.5 h-1.5 bg-slate-800 rotate-45 ${position === 'top' ? 'top-full -mt-1 left-1/2 -ml-1' : position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -ml-1' : ''}`}></div>
          </div>
        )}
      </div>
    );
  };

  const Alert = ({ type = 'info', title, message, onClose }) => {
    const typeStyles = {
      success: 'bg-emerald-50/60 border-emerald-500/30 text-emerald-800',
      error: 'bg-rose-50/60 border-rose-500/30 text-rose-800',
      warning: 'bg-amber-50/60 border-amber-500/30 text-amber-800',
      info: 'bg-sky-50/60 border-sky-500/30 text-sky-800',
    };
    
    const iconPaths = {
      success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />,
      error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />,
      warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    };

    return (
      <div className={`flex items-start p-4 border rounded-2xl backdrop-blur-lg shadow-sm ${typeStyles[type]} gap-3 transition-all duration-300`}>
        <div className="flex-shrink-0 pt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconPaths[type]}
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {title && <h3 className="text-sm font-bold">{title}</h3>}
          <div className="text-sm opacity-90 leading-relaxed">{message}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    );
  };

  const Toast = ({ type = 'success', message, isVisible, onClose }) => {
    if (!isVisible) return null;
    
    const typeStyles = {
      success: 'bg-emerald-600/90 border-emerald-400/50',
      error: 'bg-rose-600/90 border-rose-400/50',
      warning: 'bg-amber-500/90 border-amber-300/50',
      info: 'bg-sky-600/90 border-sky-400/50',
    };
    
    return (
      <div className={`fixed bottom-6 end-6 md:start-auto md:end-6 flex items-center p-4 border rounded-2xl backdrop-blur-xl shadow-2xl text-white ${typeStyles[type]} z-50 gap-4 animate-fade-in-up transition-all duration-300`}>
        <div className="text-sm font-medium">{message}</div>
        {onClose && (
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity p-1 border-s border-white/20 ps-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    );
  };

  const Banner = ({ type = 'info', message, action, onClose }) => {
    const typeStyles = {
      success: 'bg-emerald-600',
      error: 'bg-rose-600',
      warning: 'bg-amber-500',
      info: 'bg-indigo-600',
    };
    
    const iconPaths = {
      success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />,
      error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />,
      warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    };

    return (
      <div className={`w-full flex items-center justify-between px-4 py-2 text-white shadow-md transition-all duration-300 ${typeStyles[type]} z-40`}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconPaths[type]}
          </svg>
          <span className="text-[12px] font-bold">{message}</span>
        </div>
        <div className="flex items-center gap-4">
          {action && (
            <button onClick={action.onClick} className="text-[11px] font-black uppercase bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-md border border-white/20 transition-all">
              {action.label}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="opacity-70 hover:opacity-100 hover:bg-black/10 p-1 rounded transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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

    const headerColors = {
      success: "bg-emerald-600",
      error: "bg-rose-600",
      warning: "bg-amber-500",
      info: "bg-slate-800"
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
          <div className={`px-5 py-4 flex items-center justify-between text-white ${headerColors[type]}`}>
            <h3 className="font-black text-[14px]">{title}</h3>
            <button onClick={onCancel} className="opacity-70 hover:opacity-100 hover:bg-white/10 p-1 rounded transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6">
            <div className="text-slate-600 text-[13px] leading-relaxed font-medium">
              {children}
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              {onConfirm && (
                <Button variant={type === 'error' ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
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