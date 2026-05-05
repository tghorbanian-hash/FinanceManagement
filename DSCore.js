/* Filename: DSCore.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const { 
    Loader2, AlertCircle, Search, ChevronDown, ChevronLeft, ChevronRight, 
    Home, UploadCloud, FileText, Download, Trash2, ArrowUpRight, 
    ArrowDownRight, Calendar, Check, X, LayoutTemplate, Save, Settings, Info
  } = window.LucideIcons || {};

  const getGlobalCalendarMode = () => window.localStorage.getItem('fm_calendar_mode') || 'jalali';
  
  const setGlobalCalendarMode = (mode) => {
    window.localStorage.setItem('fm_calendar_mode', mode);
    window.dispatchEvent(new CustomEvent('fm_calendar_mode_change', { detail: mode }));
  };

  const useCalendarMode = () => {
    const [mode, setMode] = useState(getGlobalCalendarMode());
    useEffect(() => {
      const handler = (e) => setMode(e.detail);
      window.addEventListener('fm_calendar_mode_change', handler);
      return () => window.removeEventListener('fm_calendar_mode_change', handler);
    }, []);
    return mode;
  };

  const getGlobalTheme = () => window.localStorage.getItem('fm_theme') || 'light';

  const setGlobalTheme = (theme) => {
    window.localStorage.setItem('fm_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    window.dispatchEvent(new CustomEvent('fm_theme_change', { detail: theme }));
  };

  const useTheme = () => {
    const [theme, setTheme] = useState(getGlobalTheme());
    useEffect(() => {
      const handler = (e) => setTheme(e.detail);
      window.addEventListener('fm_theme_change', handler);
      return () => window.removeEventListener('fm_theme_change', handler);
    }, []);
    return theme;
  };

  const j2g = (jy, jm, jd) => {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + parseInt(jy / 33) * 8 + parseInt((jy % 33 + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * parseInt(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * parseInt(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * parseInt(days / 1461);
    days %= 1461;
    gy += parseInt((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let gd = days + 1;
    let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13; gm++) {
      let v = sal_a[gm];
      if (gd <= v) break;
      gd -= v;
    }
    return [gy, gm, gd];
  };

  const g2j = (gy, gm, gd) => {
    let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * parseInt(days / 12053);
    days %= 12053;
    jy += 4 * parseInt(days / 1461);
    days %= 1461;
    jy += parseInt((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy, jm, jd];
  };

  const formatGlobalDate = (gregorianDateStr, mode) => {
    if (!gregorianDateStr) return '';
    let str = String(gregorianDateStr).replace(/-/g, '/');
    if (str.includes('T')) str = str.split('T')[0];
    const parts = str.split('/');
    if (parts.length < 3) return gregorianDateStr;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);
    if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return gregorianDateStr;

    if (mode === 'jalali') {
      const [jy, jm, jd] = g2j(gy, gm, gd);
      return `${jy}/${jm < 10 ? '0'+jm : jm}/${jd < 10 ? '0'+jd : jd}`;
    }
    return `${gy}/${gm < 10 ? '0'+gm : gm}/${gd < 10 ? '0'+gd : gd}`;
  };

  const Button = (props) => {
    const { children, variant = 'primary', size = 'md', isLoading = false, disabled = false, icon: Icon, iconPosition = 'right', className = '', onClick, type = 'button', title } = props;
    const restProps = Object.assign({}, props);
    ['children', 'variant', 'size', 'isLoading', 'disabled', 'icon', 'iconPosition', 'className', 'onClick', 'type', 'title'].forEach(k => delete restProps[k]);
    
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shrink-0";
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none dark:bg-indigo-500 dark:hover:bg-indigo-600",
      secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600",
      outline: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-200 dark:focus:ring-slate-700",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm shadow-red-200 dark:shadow-none dark:bg-red-600 dark:hover:bg-red-700",
      'danger-outline': "bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-100 dark:focus:ring-red-900",
      ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-200 dark:focus:ring-slate-700"
    };
    const hasText = React.Children.count(children) > 0;
    const sizes = { sm: `h-8 ${hasText ? 'px-3 gap-1.5 text-[11px]' : 'w-8'}`, md: `h-10 ${hasText ? 'px-4 gap-2 text-[12px]' : 'w-10'}`, lg: `h-12 ${hasText ? 'px-6 gap-2.5 text-[14px]' : 'w-12'}` };
    const iconSizes = { sm: 14, md: 16, lg: 18 };

    return (
      <button type={type} title={title} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || isLoading} onClick={onClick} {...restProps}>
        {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />}
        {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} className="shrink-0" />}
        {hasText && <span className="truncate">{children}</span>}
        {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} className="shrink-0" />}
      </button>
    );
  };

  const TextField = (props) => {
    const { label, error, hint, icon: Icon, disabled = false, required = false, className = '', wrapperClassName = '', id, type = 'text', size = 'md', isRtl = true } = props;
    const restProps = Object.assign({}, props);
    ['label', 'error', 'hint', 'icon', 'disabled', 'required', 'className', 'wrapperClassName', 'id', 'type', 'size', 'isRtl'].forEach(k => delete restProps[k]);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };
    
    return (
      <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
        {label && <label htmlFor={inputId} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">{label} {required && <span className="text-red-500 dark:text-red-400">*</span>}</label>}
        <div className="relative flex items-center">
          {Icon && <div className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} text-slate-400 dark:text-slate-500 pointer-events-none`}><Icon size={size === 'sm' ? 14 : 16} /></div>}
          <input
            id={inputId} type={type} disabled={disabled}
            className={`w-full ${inputHeights[size]} bg-white dark:bg-slate-700/40 border rounded-lg text-slate-800 dark:text-slate-100 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700/60 focus:ring-2 ${disabled ? 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'border-slate-300 dark:border-slate-500 focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-400/20 hover:border-slate-400 dark:hover:border-slate-400'} ${Icon ? (isRtl ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5') : 'px-2.5'} ${className}`}
            dir={isRtl ? 'rtl' : 'ltr'} {...restProps}
          />
        </div>
        {error ? <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-[10px] font-bold mt-0.5"><AlertCircle size={10} /><span>{error}</span></div> : hint ? <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{hint}</div> : null}
      </div>
    );
  };

  const SelectField = ({ label, error, options = [], value, onChange, disabled = false, required = false, className = '', wrapperClassName = '', id, size = 'md', isRtl = true, placeholder = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const t = (fa, en) => isRtl ? fa : en;
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayValue = selectedOption ? selectedOption.label : '';

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const filteredOptions = options.filter(o => 
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(o.value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };

    return (
      <div ref={containerRef} className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full relative ${wrapperClassName}`}>
        {label && <label htmlFor={selectId} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">{label} {required && <span className="text-red-500 dark:text-red-400">*</span>}</label>}
        <div 
          className={`relative w-full ${inputHeights[size]} bg-white dark:bg-slate-700/40 border rounded-lg text-slate-800 dark:text-slate-100 transition-all flex items-center ${disabled ? 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700' : 'cursor-pointer border-slate-300 dark:border-slate-500 focus-within:border-indigo-400 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-400/20 hover:border-slate-400 dark:hover:border-slate-400'} ${className}`}
          onClick={() => !disabled && setIsOpen(true)}
        >
          {isOpen ? (
            <input
              ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={displayValue || placeholder || t('جستجو...', 'Search...')}
              className={`w-full h-full bg-transparent border-none outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 ${isRtl ? 'pr-2.5 pl-8' : 'pl-2.5 pr-8'}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          ) : (
            <div className={`w-full h-full flex items-center truncate ${isRtl ? 'pr-2.5 pl-8' : 'pl-2.5 pr-8'}`} dir={isRtl ? 'rtl' : 'ltr'}>
              <span className={displayValue ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400'}>{displayValue || placeholder || t('انتخاب کنید...', 'Select...')}</span>
            </div>
          )}
          <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-2.5' : 'right-2.5'} pointer-events-none text-slate-400 dark:text-slate-400`}>
            <ChevronDown size={14} />
          </div>
        </div>
        
        {isOpen && (
          <div className={`absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded-lg z-50 max-h-60 overflow-y-auto custom-scrollbar ${isRtl ? 'right-0' : 'left-0'}`}>
            {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
              <div 
                key={idx} 
                className={`px-3 py-2 text-[12px] cursor-pointer transition-colors ${String(value) === String(opt.value) ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if(onChange) onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
              </div>
            )) : (
              <div className="px-3 py-4 text-center text-[11px] text-slate-400 dark:text-slate-500">{t('موردی یافت نشد', 'No results')}</div>
            )}
          </div>
        )}
        {error && <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-[10px] font-bold mt-0.5"><AlertCircle size={10} /><span>{error}</span></div>}
      </div>
    );
  };

  const ToggleField = ({ checked, onChange, disabled = false, isRtl = true, label, wrapperClassName = '' }) => {
    return (
      <div className={`flex items-center gap-2 ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${wrapperClassName}`} onClick={() => !disabled && onChange(!checked)}>
        <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-500'}`}>
          <div className={`absolute top-0.5 w-3 h-3 bg-white dark:bg-slate-100 rounded-full shadow transition-all duration-200 ease-in-out ${checked ? (isRtl ? 'left-0.5' : 'right-0.5') : (isRtl ? 'right-0.5' : 'left-0.5')}`}></div>
        </div>
        {label && <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 select-none">{label}</span>}
      </div>
    );
  };

  const CheckboxField = ({ checked, onChange, disabled = false, label, wrapperClassName = '' }) => {
    return (
      <label className={`flex items-center gap-2 ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'} ${wrapperClassName}`}>
        <input 
          type="checkbox" 
          checked={checked || false} 
          onChange={(e) => onChange(e.target.checked)} 
          disabled={disabled}
          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700/40 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:border-slate-300 dark:disabled:border-slate-700"
        />
        {label && <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 select-none">{label}</span>}
      </label>
    );
  };

  const Card = ({ title, action, children, className = '', noPadding = false, headerClassName = '', isCollapsible = false, defaultCollapsed = false, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    
    return (
      <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${className}`}>
        {(title || action) && (
          <div 
            className={`h-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-3 bg-slate-50/50 dark:bg-slate-800/80 shrink-0 transition-colors ${isCollapsible ? 'cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-700/50' : ''} ${headerClassName}`}
            onClick={() => isCollapsible && setCollapsed(!collapsed)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isCollapsible && (
                <span className="text-slate-400 dark:text-slate-500 shrink-0 transition-transform">
                  {collapsed ? (isRtl ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>) : <ChevronDown size={16}/>}
                </span>
              )}
              <h3 className="font-black text-[12px] text-slate-800 dark:text-slate-100 truncate">{title}</h3>
            </div>
            {action && <div className="shrink-0" onClick={e => e.stopPropagation()}>{action}</div>}
          </div>
        )}
        {!collapsed && (
          <div className={`flex flex-col flex-1 min-h-0 ${noPadding ? '' : 'p-3'}`}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const Badge = ({ children, variant = 'gray', className = '' }) => {
    const variants = {
      gray: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600", 
      success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
      warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800", 
      danger: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800", 
      indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
      blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
    };
    return <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${variants[variant] || variants.gray} ${className}`}>{children}</span>;
  };

  const PageHeader = ({ title, icon: Icon, breadcrumbs = [], language = 'fa', actions, viewConfig }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    const [views, setViews] = useState([]);
    const [activeView, setActiveView] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [isDefaultView, setIsDefaultView] = useState(false);
    const dropdownRef = useRef(null);

    const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

    useEffect(() => {
      const clickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
      document.addEventListener('mousedown', clickOutside);
      return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

    useEffect(() => {
      if (viewConfig && viewConfig.pageId) {
        const loadViews = async () => {
          try {
            if (window.supabase) {
              const { data } = await window.supabase.from('fm_user_views').select('*').eq('page_id', viewConfig.pageId).eq('user_id', MOCK_USER_ID);
              if (data) {
                setViews(data);
                const def = data.find(v => v.is_default);
                if (def && !activeView) {
                  setActiveView(def);
                  if (viewConfig.onApplyState) viewConfig.onApplyState(def.view_data);
                }
              }
            } else throw new Error();
          } catch(e) {
            const local = JSON.parse(localStorage.getItem(`fm_views_${viewConfig.pageId}`) || '[]');
            setViews(local);
            const def = local.find(v => v.is_default);
            if (def && !activeView) {
              setActiveView(def);
              if (viewConfig.onApplyState) viewConfig.onApplyState(def.view_data);
            }
          }
        };
        loadViews();
      }
    }, [viewConfig]);

    const handleSaveView = async () => {
      if (!newViewName || !viewConfig) return;
      const dataToSave = typeof viewConfig.currentState === 'function' ? viewConfig.currentState() : viewConfig.currentState;
      const newView = {
        id: Date.now().toString(),
        user_id: MOCK_USER_ID,
        page_id: viewConfig.pageId,
        view_name: newViewName,
        view_data: dataToSave,
        is_default: isDefaultView
      };

      try {
        if (window.supabase) {
           if (isDefaultView) await window.supabase.from('fm_user_views').update({ is_default: false }).eq('page_id', viewConfig.pageId).eq('user_id', MOCK_USER_ID);
           await window.supabase.from('fm_user_views').insert([newView]);
        } else throw new Error();
      } catch(e) {
        let local = JSON.parse(localStorage.getItem(`fm_views_${viewConfig.pageId}`) || '[]');
        if (isDefaultView) local = local.map(v => ({...v, is_default: false}));
        local.push(newView);
        localStorage.setItem(`fm_views_${viewConfig.pageId}`, JSON.stringify(local));
      }

      setViews(prev => {
        let updated = [...prev];
        if (isDefaultView) updated = updated.map(v => ({...v, is_default: false}));
        return [...updated, newView];
      });
      setActiveView(newView);
      setIsSaveModalOpen(false);
      setNewViewName('');
    };

    const handleDeleteView = async (id) => {
      try {
        if (window.supabase) {
          await window.supabase.from('fm_user_views').delete().eq('id', id);
        } else throw new Error();
      } catch(e) {
        const local = JSON.parse(localStorage.getItem(`fm_views_${viewConfig.pageId}`) || '[]');
        const updated = local.filter(v => v.id !== id);
        localStorage.setItem(`fm_views_${viewConfig.pageId}`, JSON.stringify(updated));
      }
      setViews(prev => prev.filter(v => v.id !== id));
      if (activeView && activeView.id === id) {
        setActiveView(null);
      }
    };

    const handleApplyView = (view) => {
      setActiveView(view);
      setIsDropdownOpen(false);
      setIsManageModalOpen(false);
      if (viewConfig && viewConfig.onApplyState && view) {
        viewConfig.onApplyState(view.view_data);
      }
    };

    const handleResetView = () => {
      setActiveView(null);
      setIsDropdownOpen(false);
      if (viewConfig && viewConfig.onApplyState) {
        viewConfig.onApplyState(null); 
      }
    };

    return (
      <div className="flex flex-col mb-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex flex-col gap-1.5">
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold overflow-hidden whitespace-nowrap">
                <Home size={12} className="shrink-0" />
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={idx}>
                    <span className="opacity-40 shrink-0">{isRtl ? <ChevronLeft size={10} strokeWidth={3}/> : <ChevronRight size={10} strokeWidth={3}/>}</span>
                    <span className="flex items-center gap-1 shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
                      {bc.icon && <bc.icon size={12} />}
                      {bc.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              {Icon && <div className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0"><Icon size={18} strokeWidth={2.5}/></div>}
              <h1 className="text-[14px] font-black tracking-tight">{title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {viewConfig && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 px-3 h-8 rounded-lg border text-[11px] font-bold transition-all ${activeView ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <LayoutTemplate size={14} className={activeView ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                  <span>{t('نما:', 'View:')} {activeView ? activeView.view_name : t('پیش‌فرض سیستم', 'System Default')}</span>
                  <ChevronDown size={14} className="opacity-70" />
                </button>

                {isDropdownOpen && (
                  <div className={`absolute top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1.5 z-50 animate-in zoom-in-95 duration-100 ${isRtl ? 'left-0' : 'right-0'}`}>
                    <button onClick={() => { setIsSaveModalOpen(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                      <Save size={14} /> {t('ذخیره این نما', 'Save Current View')}
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
                    <button onClick={handleResetView} className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold transition-colors ${!activeView ? 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                      <span>{t('پیش‌فرض سیستم', 'System Default')}</span>
                      {!activeView && <Check size={14} className="text-emerald-500" />}
                    </button>
                    {views.map(v => (
                      <button key={v.id} onClick={() => handleApplyView(v)} className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold transition-colors ${activeView?.id === v.id ? 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        <span>{v.view_name}</span>
                        {activeView?.id === v.id && <Check size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
                    <button onClick={() => { setIsManageModalOpen(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <Settings size={14} /> {t('مدیریت نماها', 'Manage Views')}
                    </button>
                  </div>
                )}
              </div>
            )}
            {actions}
          </div>
        </div>

        {viewConfig && activeView && (
          <div className="mt-3 flex items-center justify-between p-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg animate-in slide-in-from-top-2 duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
             <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
                <Info size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span>{t('نمای اختصاصی', 'Custom View')} <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-800/50 rounded text-indigo-700 dark:text-indigo-200 mx-1">{activeView.view_name}</span> {t('اعمال شده است. ممکن است برخی از اطلاعات فیلتر شده باشند.', 'is applied. Some data might be filtered.')}</span>
             </div>
             <button onClick={handleResetView} className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded shadow-sm text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors shrink-0">
                {t('لغو نما', 'Clear View')}
             </button>
          </div>
        )}

        {viewConfig && window.DSFeedback && (
          <>
            <window.DSFeedback.Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title={t('ذخیره نمای جاری', 'Save Current View')} width="max-w-md" language={language}>
               <div className="p-5 flex flex-col gap-4">
                  <TextField label={t('نام نما', 'View Name')} value={newViewName} onChange={(e) => setNewViewName(e.target.value)} isRtl={isRtl} required />
                  <ToggleField label={t('تنظیم به عنوان پیش‌فرض این صفحه', 'Set as default for this page')} checked={isDefaultView} onChange={setIsDefaultView} isRtl={isRtl} />
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveView} disabled={!newViewName}>{t('ذخیره نما', 'Save View')}</Button>
                  </div>
               </div>
            </window.DSFeedback.Modal>

            <window.DSFeedback.Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title={t('مدیریت نماهای صفحه', 'Manage Page Views')} width="max-w-lg" language={language}>
               <div className="p-4 flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar gap-2">
                  {views.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-[11px] font-bold bg-slate-50 dark:bg-slate-900/50 rounded-lg">{t('هیچ نمایی ذخیره نشده است.', 'No saved views.')}</div>
                  ) : (
                    views.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{v.view_name}</span>
                          {v.is_default && <Badge variant="emerald" className="!py-0 !px-1.5 text-[9px]">{t('پیش‌فرض', 'Default')}</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleApplyView(v)} className="!h-7 !px-2 !text-[10px] text-indigo-600 dark:text-indigo-400">{t('اعمال', 'Apply')}</Button>
                          <button onClick={() => handleDeleteView(v.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </window.DSFeedback.Modal>
          </>
        )}
      </div>
    );
  };

  const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
    return (
      <div className={`flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto custom-scrollbar ${className}`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold transition-all border-b-2 outline-none whitespace-nowrap ${isActive ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-t-lg' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg'}`}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  const CurrencyField = (props) => {
    const { value, onChange, label, error, size = 'md', isRtl = true } = props;
    const restProps = Object.assign({}, props);
    ['value', 'onChange', 'label', 'error', 'size', 'isRtl'].forEach(k => delete restProps[k]);

    const format = (v) => {
      if (!v && v !== 0) return '';
      const clean = String(v).replace(/,/g, '');
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleInputChange = (e) => {
      const raw = e.target.value.replace(/,/g, '');
      if (!isNaN(raw) || raw === '') {
        onChange(raw);
      }
    };

    return (
      <TextField 
        {...restProps} label={label} error={error} size={size} isRtl={isRtl} 
        value={format(value)} onChange={handleInputChange} dir="ltr"
      />
    );
  };

  const TextAreaField = (props) => {
    const { label, error, disabled = false, required = false, className = '', id, rows = 3, size = 'md', isRtl = true } = props;
    const restProps = Object.assign({}, props);
    ['label', 'error', 'disabled', 'required', 'className', 'id', 'rows', 'size', 'isRtl'].forEach(k => delete restProps[k]);

    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className={`flex flex-col gap-1.5 w-full`}>
        {label && <label htmlFor={inputId} className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label} {required && <span className="text-red-500 dark:text-red-400">*</span>}</label>}
        <textarea
          id={inputId} disabled={disabled} rows={rows}
          className={`w-full bg-white dark:bg-slate-700/40 border rounded-lg text-slate-800 dark:text-slate-100 transition-all outline-none p-2.5 text-[13px] placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700/60 focus:ring-2 ${disabled ? 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'border-slate-300 dark:border-slate-500 focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-400/20 hover:border-slate-400 dark:hover:border-slate-400'} ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'} {...restProps}
        />
        {error && <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-[10px] font-bold mt-0.5"><AlertCircle size={10} /><span>{error}</span></div>}
      </div>
    );
  };

  const RadioGroup = ({ label, options = [], value, onChange, isRtl = true, inline = true }) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>}
        <div className={`flex ${inline ? 'flex-row gap-4' : 'flex-col gap-2'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="radio" name={label} value={opt.value} checked={value === opt.value} 
                  onChange={() => onChange(opt.value)} className="sr-only" 
                />
                <div className={`w-4 h-4 rounded-full border transition-all ${value === opt.value ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-700/40' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700/40 group-hover:border-slate-400 dark:group-hover:border-slate-400'}`}></div>
                {value === opt.value && <div className="absolute w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-in zoom-in-50 duration-200"></div>}
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 select-none">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const Skeleton = ({ className = '', variant = 'text', width, height }) => {
    const base = "bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0";
    const styles = variant === 'circle' ? 'rounded-full' : 'rounded-lg';
    return <div className={`${base} ${styles} ${className}`} style={{ width: width || '100%', height: height || (variant === 'text' ? '1rem' : '100%') }}></div>;
  };

  const EmptyState = ({ title, description, icon: Icon = Search, action }) => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
          <Icon size={32} strokeWidth={1.5} />
        </div>
        <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[250px] leading-relaxed mb-4">{description}</p>
        {action}
      </div>
    );
  };

  const StatCard = ({ label, value, icon: Icon, trend, trendValue, color = 'indigo', language = 'fa' }) => {
    const isRtl = language === 'fa';
    const colors = {
      indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800",
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
      amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
      rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800",
      blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
    };
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-xl p-4 shadow-sm group transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg border ${colors[color]} group-hover:scale-110 transition-transform`}>
            {Icon && <Icon size={20} />}
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
              {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
          <span className="text-[18px] font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
        </div>
      </div>
    );
  };

  const Timeline = ({ items = [], language = 'fa' }) => {
    const isRtl = language === 'fa';
    return (
      <div className="flex flex-col gap-4 relative py-2" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={`absolute top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-700 ${isRtl ? 'right-2' : 'left-2'}`}></div>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-4 relative z-10">
            <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm shrink-0 mt-1 ${item.variant === 'success' ? 'bg-emerald-500' : item.variant === 'danger' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100">{item.title}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{item.time}</span>
              </div>
              {item.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const Avatar = ({ src, name, size = 'md', className = '' }) => {
    const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-[12px]', lg: 'w-14 h-14 text-[14px]' };
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
    return (
      <div className={`${sizes[size]} rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black ${className}`}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  const DropdownMenu = ({ trigger, items = [], language = 'fa' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const isRtl = language === 'fa';

    useEffect(() => {
      const click = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', click);
      return () => document.removeEventListener('mousedown', click);
    }, []);

    return (
      <div className="relative inline-block text-start" ref={ref} dir={isRtl ? 'rtl' : 'ltr'}>
        <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
        {open && (
          <div className={`absolute z-[150] mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1 animate-in zoom-in-95 duration-150 ${isRtl ? 'left-0' : 'right-0'}`}>
            {items.map((item, i) => (
              item.divider ? <div key={i} className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-1"></div> :
              <button 
                key={i} 
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-bold rounded-lg transition-colors ${item.variant === 'danger' ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {item.icon && <item.icon size={14} />}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProgressBar = ({ value = 0, max = 100, color = 'indigo', size = 'md', label, showValue = true }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const heights = { sm: 'h-1', md: 'h-2', lg: 'h-4' };
    const colors = { indigo: "bg-indigo-600 dark:bg-indigo-500", emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500", blue: "bg-blue-500" };
    return (
      <div className="w-full flex flex-col gap-1.5">
        {(label || showValue) && (
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400">
            {label && <span>{label}</span>}
            {showValue && <span>{Math.round(pct)}%</span>}
          </div>
        )}
        <div className={`w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ${heights[size]}`}>
          <div className={`h-full transition-all duration-500 ease-out rounded-full ${colors[color]}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  const AttachmentManager = ({ files = [], onUpload, onDelete, onDownload, readOnly = false, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (!readOnly && e.dataTransfer.files?.length > 0) onUpload(Array.from(e.dataTransfer.files)); };
    const handleFileSelect = (e) => { if (e.target.files?.length > 0) onUpload(Array.from(e.target.files)); };

    const formatSize = (bytes) => {
      if (!bytes) return '0 B';
      const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
      <div className="flex flex-col gap-3 font-sans w-full h-full" dir={isRtl ? 'rtl' : 'ltr'}>
        {!readOnly && (
          <div onDragOver={e => {e.preventDefault(); setIsDragging(true);}} onDragLeave={e => {e.preventDefault(); setIsDragging(false);}} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all shrink-0 ${isDragging ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'}`}>
            <UploadCloud size={24} className={isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mt-2">{t('فایل‌ها را اینجا رها کنید یا کلیک کنید', 'Drop files here or click to upload')}</span>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {files.length === 0 ? <div className="text-center p-4 text-[11px] text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">{t('هیچ فایلی ضمیمه نشده است.', 'No attachments found.')}</div> : files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-colors group shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md shrink-0"><FileText size={14} /></div>
                <div className="flex flex-col min-w-0"><span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</span><span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{formatSize(file.size)}</span></div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDownload && <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md"><Download size={14} /></button>}
                {!readOnly && onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(file); }} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DatePicker = ({ label, value, onChange, isRtl = true, language = 'fa', required = false, size = 'md', disabled = false, id, wrapperClassName = '' }) => {
    const getTodayInfo = useCallback((mode) => {
      const today = new Date();
      const gy = today.getFullYear();
      const gm = today.getMonth() + 1;
      const gd = today.getDate();
      if (mode === 'jalali') {
        const [jy, jm, jd] = g2j(gy, gm, gd);
        return { y: jy, m: jm, d: jd };
      }
      return { y: gy, m: gm, d: gd };
    }, []);

    const globalMode = useCalendarMode();
    const [calendarMode, setCalendarMode] = useState(globalMode);
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
      setCalendarMode(globalMode);
    }, [globalMode]);
    
    const initToday = getTodayInfo(calendarMode);
    const [currentMonth, setCurrentMonth] = useState(initToday.m);
    const [currentYear, setCurrentYear] = useState(initToday.y);
    
    const containerRef = useRef(null);
    const inputId = id || `datepicker-${Math.random().toString(36).substr(2, 9)}`;
    const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };
    const t = (fa, en) => isRtl ? fa : en;

    useEffect(() => {
      const clickOutside = (e) => { 
        if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); 
      };
      document.addEventListener('mousedown', clickOutside);
      return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

    useEffect(() => {
      if (value && value.length === 10) {
        const parts = value.split('/');
        if (parts.length === 3) {
          const gy = parseInt(parts[0], 10);
          const gm = parseInt(parts[1], 10);
          const gd = parseInt(parts[2], 10);
          if (calendarMode === 'jalali') {
            const [jy, jm, jd] = g2j(gy, gm, gd);
            setCurrentYear(jy);
            setCurrentMonth(jm);
          } else {
            setCurrentYear(gy);
            setCurrentMonth(gm);
          }
        }
      }
    }, [value, calendarMode]);

    const displayValue = useMemo(() => {
      return formatGlobalDate(value, calendarMode);
    }, [value, calendarMode]);

    const handleDayClick = (day) => {
      if (calendarMode === 'jalali') {
        const [gy, gm, gd] = j2g(currentYear, currentMonth, day);
        onChange(`${gy}/${gm < 10 ? '0'+gm : gm}/${gd < 10 ? '0'+gd : gd}`);
      } else {
        const m = currentMonth < 10 ? `0${currentMonth}` : currentMonth;
        const d = day < 10 ? `0${day}` : day;
        onChange(`${currentYear}/${m}/${d}`);
      }
      setIsOpen(false);
    };

    const handleTodayClick = () => {
      const d = new Date();
      const gy = d.getFullYear();
      const gm = d.getMonth() + 1;
      const gd = d.getDate();
      onChange(`${gy}/${gm < 10 ? '0'+gm : gm}/${gd < 10 ? '0'+gd : gd}`);
      setIsOpen(false);
    };

    const handleOpen = () => {
      if (!disabled) {
        if (!value || value.length !== 10) {
          const ti = getTodayInfo(calendarMode);
          setCurrentYear(ti.y);
          setCurrentMonth(ti.m);
        }
        setIsOpen(true);
      }
    };

    const toggleCalendarMode = () => {
      const newMode = calendarMode === 'jalali' ? 'gregorian' : 'jalali';
      if (!value || value.length !== 10) {
         const ti = getTodayInfo(newMode);
         setCurrentYear(ti.y);
         setCurrentMonth(ti.m);
      }
      setCalendarMode(newMode);
    };

    let daysInMonth, firstDayOffset;
    if (calendarMode === 'jalali') {
      const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(currentYear % 33);
      daysInMonth = currentMonth <= 6 ? 31 : (currentMonth === 12 ? (isLeap ? 30 : 29) : 30);
      const [gy, gm, gd] = j2g(currentYear, currentMonth, 1);
      const d = new Date(gy, gm - 1, gd).getDay();
      firstDayOffset = (d + 1) % 7; 
    } else {
      daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      firstDayOffset = new Date(currentYear, currentMonth - 1, 1).getDay(); 
    }

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: firstDayOffset }, (_, i) => i);

    const faDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    const enDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const faMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const monthName = calendarMode === 'jalali' ? faMonths[currentMonth - 1] : enMonths[currentMonth - 1];
    const weekDays = calendarMode === 'jalali' ? faDays : enDays;

    const ti = getTodayInfo(calendarMode);
    const todayStr = `${ti.y}/${ti.m < 10 ? '0'+ti.m : ti.m}/${ti.d < 10 ? '0'+ti.d : ti.d}`;

    return (
      <div ref={containerRef} className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full relative ${wrapperClassName}`}>
        {label && <label htmlFor={inputId} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">{label} {required && <span className="text-red-500 dark:text-red-400">*</span>}</label>}
        <div className="relative group flex items-center">
          <div className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors pointer-events-none z-10`}>
            <Calendar size={size === 'sm' ? 14 : 16} />
          </div>
          <input 
            id={inputId} type="text" value={displayValue} readOnly disabled={disabled}
            onClick={handleOpen}
            placeholder={todayStr}
            className={`w-full ${inputHeights[size]} bg-white dark:bg-slate-700/40 border rounded-lg text-slate-800 dark:text-slate-100 transition-all outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-700/60 focus:ring-2 ${disabled ? 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'border-slate-300 dark:border-slate-500 focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-400/20 hover:border-slate-400 dark:hover:border-slate-400'} ${isRtl ? 'pr-8 pl-[60px]' : 'pl-8 pr-[60px]'} font-mono`}
            dir="ltr"
          />
          <div className={`absolute ${isRtl ? 'left-1' : 'right-1'} flex items-center gap-0.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-0.5 z-10`}>
            <button 
              type="button" onClick={(e) => { e.stopPropagation(); toggleCalendarMode(); }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300`}
              title={t('تغییر نوع تقویم', 'Toggle Calendar Mode')}
            >
              {calendarMode === 'jalali' ? 'FA' : 'EN'}
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className={`absolute top-full mt-1 ${isRtl ? 'right-0' : 'left-0'} z-[200] w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-3 animate-in zoom-in-95 duration-150`}>
            <div className="flex items-center justify-between mb-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => { if(currentMonth===1){setCurrentMonth(12); setCurrentYear(currentYear-1)}else setCurrentMonth(currentMonth-1) }} className="p-1 rounded text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronRight size={14} className={isRtl ? '' : 'rotate-180'} /></button>
              <div className="text-[12px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>{monthName}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{currentYear}</span>
              </div>
              <button type="button" onClick={() => { if(currentMonth===12){setCurrentMonth(1); setCurrentYear(currentYear+1)}else setCurrentMonth(currentMonth+1) }} className="p-1 rounded text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronLeft size={14} className={isRtl ? '' : 'rotate-180'} /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-1" dir={isRtl ? 'rtl' : 'ltr'}>
              {weekDays.map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1" dir={isRtl ? 'rtl' : 'ltr'}>
              {blanksArray.map(b => <div key={`blank-${b}`} className="h-7"></div>)}
              {daysArray.map(day => {
                const dStr = day < 10 ? '0'+day : day;
                const mStr = currentMonth < 10 ? '0'+currentMonth : currentMonth;
                const currentIterDate = calendarMode === 'jalali' 
                  ? (() => { const [gy,gm,gd] = j2g(currentYear, currentMonth, day); return `${gy}/${gm<10?'0'+gm:gm}/${gd<10?'0'+gd:gd}`; })()
                  : `${currentYear}/${mStr}/${dStr}`;
                const isSelected = value === currentIterDate;
                const isToday = (() => { const d=new Date(); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`})() === currentIterDate;
                
                let btnClass = 'h-7 w-full rounded flex items-center justify-center text-[11px] font-bold transition-all ';
                if (isSelected) {
                  btnClass += 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md';
                } else if (isToday) {
                  btnClass += 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
                } else {
                  btnClass += 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300';
                }

                return (
                  <button 
                    key={day} type="button" onClick={() => handleDayClick(day)}
                    className={btnClass}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); handleTodayClick(); }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-1.5 rounded transition-colors w-full border border-indigo-100 dark:border-indigo-800"
              >
                {t('امروز', 'Today')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Stepper = ({ steps = [], currentStep = 0, language = 'fa' }) => {
    const isRtl = language === 'fa';
    return (
      <div className="w-full py-4 px-2" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-700 z-0"></div>
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : isActive ? 'bg-white dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 scale-110 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}`}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-[12px] font-black">{idx + 1}</span>}
                </div>
                <span className={`text-[10px] font-black transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TagInput = ({ tags = [], onAdd, onDelete, placeholder, label, isRtl = true, size = 'md', wrapperClassName = '' }) => {
    const [val, setVal] = useState('');
    const handleKeyDown = (e) => { if (e.key === 'Enter' && val) { onAdd(val); setVal(''); e.preventDefault(); } };
    const minHeights = { sm: 'min-h-[32px]', md: 'min-h-[40px]', lg: 'min-h-[48px]' };
    
    return (
      <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
        {label && <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>}
        <div className={`flex flex-wrap gap-1.5 p-1 bg-white dark:bg-slate-700/40 border border-slate-300 dark:border-slate-500 rounded-lg focus-within:border-indigo-400 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-400/20 transition-all items-center ${minHeights[size]}`} dir={isRtl ? 'rtl' : 'ltr'}>
          {tags.map((tag, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30 animate-in zoom-in-90 duration-150">
              <span className="text-[11px] font-bold">{tag}</span>
              <button onClick={() => onDelete(idx)} className="text-indigo-400 dark:text-indigo-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><X size={10} /></button>
            </div>
          ))}
          <input 
            type="text" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] h-6 bg-transparent border-none outline-none text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 px-1"
          />
        </div>
      </div>
    );
  };

  const Spinner = ({ size = 'md', color = 'text-indigo-600 dark:text-indigo-400' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' };
    return (
      <svg className={`animate-spin ${sizes[size]} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };

  window.DSCore = {
    getGlobalCalendarMode, setGlobalCalendarMode, useCalendarMode, formatGlobalDate,
    getGlobalTheme, setGlobalTheme, useTheme,
    Button, TextField, SelectField, ToggleField, CheckboxField, Card, Badge, PageHeader, 
    Tabs, CurrencyField, TextAreaField, RadioGroup, Skeleton, EmptyState, StatCard, 
    Timeline, Avatar, DropdownMenu, ProgressBar, AttachmentManager, DatePicker, Stepper, 
    TagInput, Spinner
  };
})();