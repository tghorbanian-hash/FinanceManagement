/* Filename: DesignSystem.js */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Loader2, AlertCircle, Search, Download, Upload, Settings, Eye, Edit, Trash2, 
  Paperclip, Printer, Pin, PinOff, GripVertical, ChevronDown, 
  ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Layers, X, Maximize2, Minimize2, Plus, Home, Filter, UploadCloud, FileText, Check
} from 'lucide-react';

const Button = ({
  children, variant = 'primary', size = 'md', isLoading = false, disabled = false,
  icon: Icon, iconPosition = 'right', className = '', onClick, type = 'button', title, ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shrink-0";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm shadow-red-200",
    'danger-outline': "bg-white text-red-500 border border-red-200 hover:bg-red-50 focus:ring-red-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200"
  };
  
  const hasText = React.Children.count(children) > 0;
  
  const sizes = { 
    sm: `h-8 ${hasText ? 'px-3 gap-1.5 text-[11px]' : 'w-8'}`, 
    md: `h-10 ${hasText ? 'px-4 gap-2 text-[12px]' : 'w-10'}`, 
    lg: `h-12 ${hasText ? 'px-6 gap-2.5 text-[14px]' : 'w-12'}` 
  };
  
  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <button type={type} title={title} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || isLoading} onClick={onClick} {...props}>
      {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} className="shrink-0" />}
      {hasText && <span className="truncate">{children}</span>}
      {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} className="shrink-0" />}
    </button>
  );
};

const TextField = ({ label, error, hint, icon: Icon, disabled = false, required = false, className = '', wrapperClassName = '', id, type = 'text', size = 'md', isRtl = true, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };
  
  return (
    <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
      {label && <label htmlFor={inputId} className="text-[11px] font-bold text-slate-700 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative flex items-center">
        {Icon && <div className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} text-slate-400 pointer-events-none`}><Icon size={size === 'sm' ? 14 : 16} /></div>}
        <input
          id={inputId} type={type} disabled={disabled}
          className={`w-full ${inputHeights[size]} bg-white border rounded-lg text-slate-800 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 ${disabled ? 'bg-slate-100/50 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'} ${Icon ? (isRtl ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5') : 'px-2.5'} ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'} {...props}
        />
      </div>
      {error ? <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold mt-0.5"><AlertCircle size={10} /><span>{error}</span></div> : hint ? <div className="text-slate-500 text-[10px] mt-0.5">{hint}</div> : null}
    </div>
  );
};

const SelectField = ({ label, error, options = [], disabled = false, required = false, className = '', wrapperClassName = '', id, size = 'md', isRtl = true, ...props }) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };

  return (
    <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
      {label && <label htmlFor={selectId} className="text-[11px] font-bold text-slate-700 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative">
        <select
          id={selectId} disabled={disabled}
          className={`w-full ${inputHeights[size]} bg-white border rounded-lg text-slate-800 transition-all outline-none appearance-none cursor-pointer focus:bg-white focus:ring-2 ${disabled ? 'bg-slate-100/50 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'} ${isRtl ? 'pl-8 pr-2.5' : 'pr-8 pl-2.5'} ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'} {...props}
        >
          <option value="" disabled hidden>انتخاب کنید...</option>
          {options.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-2.5' : 'right-2.5'} pointer-events-none text-slate-400`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></div>
      </div>
      {error && <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold mt-0.5"><AlertCircle size={10} /><span>{error}</span></div>}
    </div>
  );
};

const ToggleField = ({ checked, onChange, disabled = false, isRtl = true, label, wrapperClassName = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${wrapperClassName}`} onClick={() => !disabled && onChange(!checked)}>
      <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-200 ease-in-out ${checked ? (isRtl ? 'left-0.5' : 'right-0.5') : (isRtl ? 'right-0.5' : 'left-0.5')}`}></div>
      </div>
      {label && <span className="text-[11px] font-bold text-slate-700 select-none">{label}</span>}
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
        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-100 disabled:border-slate-300"
      />
      {label && <span className="text-[11px] font-bold text-slate-700 select-none">{label}</span>}
    </label>
  );
};

const LOVField = ({ label, displayValue, onChange, data, columns, disabled = false, required = false, wrapperClassName = '', size = 'md', isRtl = true, placeholder = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = (fa, en) => isRtl ? fa : en;
  
  return (
    <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
      {label && <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative flex items-center" onClick={() => !disabled && setIsOpen(true)}>
        <div className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} text-slate-400 pointer-events-none`}><Search size={size === 'sm' ? 14 : 16} /></div>
        <div className={`w-full ${size === 'sm' ? 'h-8 text-[11px]' : 'h-10 text-[13px]'} bg-white border rounded-lg text-slate-800 transition-all outline-none flex items-center ${disabled ? 'bg-slate-100/50 text-slate-500 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:border-indigo-400 border-slate-300'} ${isRtl ? 'pr-2.5 pl-8' : 'pl-2.5 pr-8'}`}>
          <span className="truncate">{displayValue || placeholder || t('انتخاب کنید...', 'Select...')}</span>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${t('انتخاب', 'Select')} ${label}`} width="max-w-3xl" language={isRtl ? 'fa' : 'en'}>
        <div className="h-[350px] p-2 bg-slate-50/50">
          <DataGrid 
            data={data} columns={columns} language={isRtl ? 'fa' : 'en'} 
            onRowDoubleClick={(row) => { onChange(row); setIsOpen(false); }}
          />
        </div>
      </Modal>
    </div>
  );
};

const Card = ({ title, action, children, className = '', noPadding = false, headerClassName = '', isCollapsible = false, defaultCollapsed = false, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${className}`}>
      {(title || action) && (
        <div 
          className={`h-10 border-b border-slate-100 flex items-center justify-between px-3 bg-slate-50/50 shrink-0 transition-colors ${isCollapsible ? 'cursor-pointer select-none hover:bg-slate-100/50' : ''} ${headerClassName}`}
          onClick={() => isCollapsible && setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isCollapsible && (
              <span className="text-slate-400 shrink-0 transition-transform">
                {collapsed ? (isRtl ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>) : <ChevronDown size={16}/>}
              </span>
            )}
            <h3 className="font-black text-[12px] text-slate-800 truncate">{title}</h3>
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
    gray: "bg-slate-100 text-slate-600 border border-slate-200", 
    success: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border border-amber-200", 
    danger: "bg-red-50 text-red-600 border border-red-200", 
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    blue: "bg-blue-50 text-blue-600 border border-blue-200",
    orange: "bg-orange-50 text-orange-600 border border-orange-200"
  };
  return <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${variants[variant] || variants.gray} ${className}`}>{children}</span>;
};

const PageHeader = ({ title, icon: Icon, breadcrumbs = [], language = 'fa' }) => {
  const isRtl = language === 'fa';
  return (
    <div className="flex flex-col gap-1.5 mb-3 shrink-0" dir={isRtl ? 'rtl' : 'ltr'}>
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold overflow-hidden whitespace-nowrap">
          <Home size={12} className="shrink-0" />
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              <span className="opacity-40 shrink-0">{isRtl ? <ChevronLeft size={10} strokeWidth={3}/> : <ChevronRight size={10} strokeWidth={3}/>}</span>
              <span className="flex items-center gap-1 shrink-0 hover:text-indigo-600 cursor-pointer transition-colors">
                {bc.icon && <bc.icon size={12} />}
                {bc.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-slate-800">
        {Icon && <div className="p-1.5 bg-white border border-slate-200 shadow-sm text-indigo-600 rounded-lg shrink-0"><Icon size={18} strokeWidth={2.5}/></div>}
        <h1 className="text-[14px] font-black tracking-tight">{title}</h1>
      </div>
    </div>
  );
};

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
      
      <div 
        className={`bg-white shadow-2xl flex flex-col relative z-10 transition-all duration-300 animate-in zoom-in-95 overflow-hidden ${
          isMaximized ? 'w-full h-full inset-0 rounded-none' : `${width} w-full max-h-[90vh] rounded-xl`
        }`}
      >
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-black text-slate-800 text-[13px]">{title}</h3>
          <div className="flex items-center gap-1.5">
            {showMaximize && (
              <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                {isMaximized ? <Minimize2 size={14} strokeWidth={2.5} /> : <Maximize2 size={14} strokeWidth={2.5} />}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const AdvancedFilter = ({ title, fields = [], onFilter, onClear, language = 'fa', defaultOpen = false }) => {
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [values, setValues] = useState({});

  const handleChange = (name, val) => setValues(prev => ({ ...prev, [name]: val }));
  const handleClear = () => { setValues({}); if (onClear) onClear(); };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col shrink-0 mb-3 font-sans transition-all duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="h-9 px-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 rounded-lg transition-colors select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2 text-indigo-600">
          <Filter size={14} strokeWidth={2.5} />
          <span className="text-[12px] font-black">{title || t('فیلتر پیشرفته', 'Advanced Filter')}</span>
        </div>
        <div className="text-slate-400">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
      </div>
      
      {isOpen && (
        <div className="p-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {fields.map((f, idx) => {
              if (f.type === 'select') return <SelectField key={idx} size="sm" label={f.label} isRtl={isRtl} options={f.options} value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)} />;
              if (f.type === 'toggle') return <ToggleField key={idx} size="sm" label={f.label} isRtl={isRtl} checked={values[f.name]} onChange={(v) => handleChange(f.name, v)} wrapperClassName="mt-5" />;
              if (f.type === 'checkbox') return <CheckboxField key={idx} size="sm" label={f.label} isRtl={isRtl} checked={values[f.name]} onChange={(v) => handleChange(f.name, v)} wrapperClassName="mt-5" />;
              if (f.type === 'lov') return <LOVField key={idx} size="sm" label={f.label} isRtl={isRtl} data={f.lovData} columns={f.lovColumns} displayValue={values[f.name]?.title} onChange={(row) => handleChange(f.name, row)} />;
              return (
                <TextField 
                  key={idx} size="sm" label={f.label} isRtl={isRtl} type={f.type} placeholder={f.type === 'date' ? 'YYYY/MM/DD' : ''}
                  value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)} dir={f.type === 'date' || !isRtl ? 'ltr' : 'rtl'}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>{t('پاک کردن', 'Clear')}</Button>
            <Button variant="primary" size="sm" icon={Search} onClick={() => onFilter && onFilter(values)}>{t('جستجو', 'Search')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const AttachmentManager = ({ files = [], onUpload, onDelete, onDownload, readOnly = false, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (readOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onUpload(Array.from(e.dataTransfer.files));
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) onUpload(Array.from(e.target.files));
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-3 font-sans w-full h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {!readOnly && (
        <div 
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all shrink-0 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}
        >
          <UploadCloud size={24} className={isDragging ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="text-[12px] font-bold text-slate-700 mt-2">{t('فایل‌ها را اینجا رها کنید یا کلیک کنید', 'Drop files here or click to upload')}</span>
          <span className="text-[10px] text-slate-500 mt-1">{t('حداکثر حجم فایل: ۱۰ مگابایت', 'Max file size: 10MB')}</span>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
        </div>
      )}

      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
        {files.length === 0 ? (
          <div className="text-center p-4 text-[11px] text-slate-400 border border-slate-100 rounded-lg bg-slate-50/50">
            {t('هیچ فایلی ضمیمه نشده است.', 'No attachments found.')}
          </div>
        ) : (
          files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-white hover:border-indigo-200 transition-colors group shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md shrink-0"><FileText size={14} /></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{formatSize(file.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDownload && <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Download size={14} /></button>}
                {!readOnly && onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(file); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DataGrid = ({ 
  data = [], columns = [], actions = [], language = 'fa', 
  onAdd, onRowDoubleClick, selectable = false, bulkActions = [],
  rowReorderable = false, onRowReorder
}) => {
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [gridData, setGridData] = useState(data);
  const [columnOrder, setColumnOrder] = useState(columns.map(c => c.field));
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [pinnedCols, setPinnedCols] = useState(new Set());
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [groupCols, setGroupCols] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showColMenu, setShowColMenu] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  const colMenuRef = useRef(null);
  const dragColItem = useRef();
  const dragOverColItem = useRef();
  const dragRowItem = useRef();
  const dragOverRowItem = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setGridData(data); setSelectedRows([]); }, [data]);

  const visibleColumns = useMemo(() => {
    const visibleFields = columnOrder.filter(f => !hiddenCols.has(f));
    const pinned = visibleFields.filter(f => pinnedCols.has(f));
    const unpinned = visibleFields.filter(f => !pinnedCols.has(f));
    return [...pinned, ...unpinned].map(f => columns.find(c => c.field === f)).filter(Boolean);
  }, [columnOrder, hiddenCols, pinnedCols, columns]);

  const processedData = useMemo(() => {
    let result = [...gridData];
    Object.keys(filters).forEach(key => {
      const filterVal = filters[key]?.toString().toLowerCase();
      if (!filterVal) return;
      result = result.filter(row => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return val.toString().toLowerCase().includes(filterVal);
      });
    });

    if (sortConfig.field) {
      result.sort((a, b) => {
        const valA = a[sortConfig.field];
        const valB = b[sortConfig.field];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const buildGroupedData = (dataArray, colsToGroup, depth = 0, parentKey = '') => {
      if (depth >= colsToGroup.length) return dataArray;
      const currentField = colsToGroup[depth];
      const groups = {};
      dataArray.forEach(row => {
        const val = row[currentField] || t('نامشخص', 'Unknown');
        if (!groups[val]) groups[val] = [];
        groups[val].push(row);
      });
      let groupedResult = [];
      Object.keys(groups).forEach(val => {
        const groupKey = parentKey ? `${parentKey}|${val}` : val;
        groupedResult.push({ isGroupHeader: true, groupField: currentField, groupValue: val, groupKey, depth, count: groups[val].length });
        if (!collapsedGroups.has(groupKey)) {
          groupedResult = groupedResult.concat(buildGroupedData(groups[val], colsToGroup, depth + 1, groupKey));
        }
      });
      return groupedResult;
    };

    if (groupCols.length > 0) return buildGroupedData(result, groupCols);
    return result;
  }, [gridData, filters, sortConfig, groupCols, collapsedGroups, t]);

  const totalRecords = processedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  const handleSort = (field) => { setSortConfig(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' })); };
  const handleFilterChange = (field, value) => { setFilters(prev => ({ ...prev, [field]: value })); setPage(1); };
  const togglePin = (field) => { const newPinned = new Set(pinnedCols); if (newPinned.has(field)) newPinned.delete(field); else newPinned.add(field); setPinnedCols(newPinned); };
  const toggleVisibility = (field) => { const newHidden = new Set(hiddenCols); if (newHidden.has(field)) newHidden.delete(field); else newHidden.add(field); setHiddenCols(newHidden); };

  const handleColDragStart = (e, position, field) => { dragColItem.current = position; e.dataTransfer.setData('colField', field); };
  const handleColDragEnter = (e, position) => { dragOverColItem.current = position; };
  const handleColDragEnd = () => {
    if (dragColItem.current !== null && dragOverColItem.current !== null) {
      const newOrder = [...columnOrder];
      const draggedContent = newOrder[dragColItem.current];
      newOrder.splice(dragColItem.current, 1);
      newOrder.splice(dragOverColItem.current, 0, draggedContent);
      setColumnOrder(newOrder);
    }
    dragColItem.current = null; dragOverColItem.current = null;
  };

  const handleRowDragStart = (e, index) => { dragRowItem.current = index; e.dataTransfer.effectAllowed = 'move'; };
  const handleRowDragEnter = (e, index) => { dragOverRowItem.current = index; };
  const handleRowDragEnd = () => {
    if (dragRowItem.current !== null && dragOverRowItem.current !== null && dragRowItem.current !== dragOverRowItem.current) {
      if (onRowReorder) onRowReorder(dragRowItem.current, dragOverRowItem.current);
    }
    dragRowItem.current = null; dragOverRowItem.current = null;
  };

  const handleGroupDrop = (e) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('colField');
    if (field && !groupCols.includes(field)) { setGroupCols([...groupCols, field]); setPage(1); }
  };
  const removeGroupCol = (field) => { setGroupCols(groupCols.filter(f => f !== field)); setCollapsedGroups(new Set()); setPage(1); };
  const toggleGroupCollapse = (groupKey) => { const newCollapsed = new Set(collapsedGroups); if (newCollapsed.has(groupKey)) newCollapsed.delete(groupKey); else newCollapsed.add(groupKey); setCollapsedGroups(newCollapsed); };
  const expandAllGroups = () => setCollapsedGroups(new Set());
  const collapseAllGroups = () => { const topLevelKeys = processedData.filter(r => r.isGroupHeader && r.depth === 0).map(r => r.groupKey); setCollapsedGroups(new Set(topLevelKeys)); };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedData.filter(r => !r.isGroupHeader).map(r => r.id);
      setSelectedRows(Array.from(new Set([...selectedRows, ...allIds])));
    } else {
      const pageIds = paginatedData.map(r => r.id);
      setSelectedRows(selectedRows.filter(id => !pageIds.includes(id)));
    }
  };
  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rowId => rowId !== id)); else setSelectedRows([...selectedRows, id]);
  };

  const exportCSV = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const rows = gridData.map(row => visibleColumns.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const csv = '\uFEFF' + headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `export_${new Date().getTime()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStickyStyles = (field, isAction = false, isHeader = false) => {
    const baseZ = isHeader ? 30 : 1;
    if (isAction) return { position: 'sticky', [isRtl ? 'left' : 'right']: 0, zIndex: isHeader ? 50 : 20, background: 'inherit' };
    
    if (field === 'ROW_REORDER_COL') return { position: 'sticky', [isRtl ? 'right' : 'left']: 0, zIndex: isHeader ? 45 : 15, background: 'inherit' };
    if (field === 'SELECT_COL') return { position: 'sticky', [isRtl ? 'right' : 'left']: rowReorderable ? 30 : 0, zIndex: isHeader ? 45 : 15, background: 'inherit' };

    if (!pinnedCols.has(field)) return { zIndex: isHeader ? 30 : 1 };
    
    let offset = (rowReorderable ? 30 : 0) + (selectable ? 40 : 0); 
    for (let col of visibleColumns) {
      if (col.field === field) break;
      offset += parseInt(col.width || 100);
    }
    return { position: 'sticky', [isRtl ? 'right' : 'left']: offset, zIndex: isHeader ? 40 : 10, background: 'inherit' };
  };

  const renderCellContent = (col, row, rowIndex) => {
    if (col.render) return col.render(row[col.field], row, rowIndex);
    const val = row[col.field];
    if (col.type === 'toggle') return <ToggleField checked={!!val} disabled isRtl={isRtl} />;
    if (col.type === 'checkbox') return <CheckboxField checked={!!val} disabled isRtl={isRtl} />;
    if (col.type === 'badge') return <Badge variant={col.badgeColor ? col.badgeColor(val) : 'gray'}>{val}</Badge>;
    return val;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col font-sans h-full overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-stretch p-1.5 border-b border-slate-200 bg-white gap-2 shrink-0 min-h-[46px]">
        <div className="flex items-center shrink-0">
          {onAdd && (
            <Button size="sm" variant="primary" icon={Plus} onClick={onAdd} className="h-full px-3.5 text-[11px] shadow-sm">
              {t('جدید', 'New')}
            </Button>
          )}
        </div>

        {selectedRows.length > 0 && bulkActions.length > 0 ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-1 border border-indigo-200 bg-indigo-50 rounded-md transition-all animate-in fade-in">
            <span className="text-[11px] font-black text-indigo-800">{selectedRows.length} {t('مورد انتخاب شده', 'Items selected')}</span>
            <div className="w-px h-4 bg-indigo-200 mx-1"></div>
            {bulkActions.map((act, i) => (
              <Button key={i} size="sm" variant={act.variant || 'outline'} icon={act.icon} onClick={() => {act.onClick(selectedRows); setSelectedRows([]);}} className="!h-7 text-[10px]">
                {act.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className={`flex-1 flex items-center gap-2 px-3 py-1 border border-dashed rounded-md transition-colors overflow-x-auto custom-scrollbar ${groupCols.length > 0 ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`} onDragOver={(e) => e.preventDefault()} onDrop={handleGroupDrop}>
            <Layers size={14} className={groupCols.length > 0 ? 'text-indigo-500 shrink-0' : 'text-slate-400 shrink-0'} />
            {groupCols.length === 0 ? (
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('هدر ستون را برای گروه‌بندی اینجا رها کنید', 'Drop column header here to group')}</span>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-max">
                {groupCols.map((field, idx) => {
                  const colDef = columns.find(c => c.field === field);
                  return (
                    <div key={field} className="flex items-center gap-1 bg-white border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
                      <span>{colDef ? t(colDef.header_fa, colDef.header_en) : field}</span>
                      <button onClick={() => removeGroupCol(field)} className="text-indigo-400 hover:text-red-500 rounded-full p-0.5 ml-1"><X size={12} /></button>
                      {idx < groupCols.length - 1 && <ChevronLeft size={12} className="text-slate-300 ml-1" />}
                    </div>
                  );
                })}
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-auto shrink-0">
                  <button onClick={expandAllGroups} title={t('باز کردن همه', 'Expand All')} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Maximize2 size={12} /></button>
                  <button onClick={collapseAllGroups} title={t('بستن همه', 'Collapse All')} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Minimize2 size={12} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center h-full" ref={colMenuRef}>
            <button onClick={() => setShowColMenu(!showColMenu)} title={t('نمایش/مخفی‌سازی ستون‌ها', 'Columns')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Settings size={16} /></button>
            {showColMenu && (
              <div className="absolute top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-50 min-w-[200px] right-0 animate-in zoom-in-95 duration-100">
                <div className="text-[12px] font-black text-slate-800 mb-2 pb-2 border-b border-slate-100 px-1">{t('نمایش / مخفی‌سازی', 'Show / Hide')}</div>
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-0.5">
                  {columns.map(c => (
                    <label key={c.field} className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-md text-[11px] font-bold text-slate-600 transition-colors">
                      <input type="checkbox" checked={!hiddenCols.has(c.field)} onChange={() => toggleVisibility(c.field)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {t(c.header_fa, c.header_en)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>
          <button onClick={() => document.getElementById('grid-import-input').click()} title={t('ورود اطلاعات', 'Import')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Upload size={16} /></button>
          <input id="grid-import-input" type="file" className="hidden" accept=".csv" />
          <button onClick={exportCSV} title={t('خروجی اکسل', 'Export')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Printer size={16} /></button>
        </div>
      </div>

      <div className="overflow-auto custom-scrollbar flex-1 relative bg-white">
        <table className="w-full text-start border-separate border-spacing-0 min-w-max" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="sticky top-0 z-40 bg-slate-100 shadow-sm">
            <tr>
              {rowReorderable && <th style={{ width: '30px', ...getStickyStyles('ROW_REORDER_COL', false, true) }} className={`p-1.5 border-b border-slate-200 bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}></th>}
              {selectable && (
                <th style={{ width: '40px', ...getStickyStyles('SELECT_COL', false, true) }} className={`p-1.5 border-b border-slate-200 text-center bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}>
                  <input type="checkbox" onChange={handleSelectAll} checked={paginatedData.length > 0 && paginatedData.filter(r => !r.isGroupHeader).every(r => selectedRows.includes(r.id))} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </th>
              )}
              {visibleColumns.map((col, index) => {
                const actualIndex = columnOrder.indexOf(col.field);
                const isPinned = pinnedCols.has(col.field);
                return (
                  <th 
                    key={col.field} draggable
                    onDragStart={(e) => handleColDragStart(e, actualIndex, col.field)} onDragEnter={(e) => handleColDragEnter(e, actualIndex)} onDragEnd={handleColDragEnd} onDragOver={(e) => e.preventDefault()}
                    style={{ width: col.width || '150px', ...getStickyStyles(col.field, false, true) }}
                    className={`p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 select-none bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}
                  >
                    <div className="flex items-center justify-between gap-1 group">
                      <div className="flex items-center gap-1.5 cursor-pointer flex-1 overflow-hidden" onClick={() => handleSort(col.field)}>
                        <GripVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0" />
                        <span className="truncate">{t(col.header_fa, col.header_en)}</span>
                        {sortConfig.field === col.field && <span className="text-indigo-500 shrink-0">{sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</span>}
                      </div>
                      <button onClick={() => togglePin(col.field)} className={`p-0.5 rounded shrink-0 transition-colors ${isPinned ? 'text-indigo-600 bg-indigo-50 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'}`} title={t('سنجاق کردن', 'Pin Column')}>
                        {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      </button>
                    </div>
                  </th>
                )
              })}
              {actions.length > 0 && (
                <th style={{...getStickyStyles('ACTIONS', true, true)}} className="p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 w-[120px] bg-slate-100 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">
                  {t('عملیات', 'Actions')}
                </th>
              )}
            </tr>

            <tr>
              {rowReorderable && <td style={getStickyStyles('ROW_REORDER_COL', false, true)} className={`p-1 border-b border-slate-200 bg-slate-50 ${isRtl ? 'border-l' : 'border-r'}`}></td>}
              {selectable && <td style={getStickyStyles('SELECT_COL', false, true)} className={`p-1 border-b border-slate-200 bg-slate-50 ${isRtl ? 'border-l' : 'border-r'}`}></td>}
              {visibleColumns.map((col) => {
                return (
                  <td key={`filter-${col.field}`} style={getStickyStyles(col.field, false, true)} className={`p-1 border-b border-slate-200 bg-slate-50 ${isRtl ? 'border-l' : 'border-r'}`}>
                    <div className="relative">
                      {(col.type === 'text' || col.type === 'number') && <Search size={10} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-1.5' : 'left-1.5'} text-slate-400`} />}
                      {col.type !== 'toggle' && col.type !== 'checkbox' && (
                        <input 
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          dir={col.type === 'date' || !isRtl ? 'ltr' : 'rtl'}
                          value={filters[col.field] || ''} onChange={(e) => handleFilterChange(col.field, e.target.value)}
                          placeholder={col.type === 'date' ? '' : t('جستجو...', 'Search...')}
                          className={`w-full h-6 text-[10px] font-sans font-bold bg-white border border-slate-200 rounded outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${col.type === 'date' ? 'px-1' : (isRtl ? 'pr-5 pl-1' : 'pl-5 pr-1')}`}
                        />
                      )}
                    </div>
                  </td>
                );
              })}
              {actions.length > 0 && <td style={getStickyStyles('ACTIONS', true, true)} className="border-b border-slate-200 bg-slate-50 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]"></td>}
            </tr>
          </thead>

          <tbody className="z-10 relative">
            {paginatedData.length > 0 ? paginatedData.map((row, rowIndex) => {
              if (row.isGroupHeader) {
                const isCollapsed = collapsedGroups.has(row.groupKey);
                return (
                  <tr key={`group-${row.groupKey}`} className="bg-indigo-50/40 border-b border-indigo-100">
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0) + (selectable ? 1 : 0) + (rowReorderable ? 1 : 0)} className="p-0 sticky left-0 right-0">
                      <div className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-indigo-50 transition-colors w-max" style={{ paddingInlineStart: `${row.depth * 20 + 8}px` }} onClick={() => toggleGroupCollapse(row.groupKey)}>
                        <div className="text-indigo-500">{isRtl ? (isCollapsed ? <ChevronLeft size={14}/> : <ChevronDown size={14}/>) : (isCollapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>)}</div>
                        <Layers size={12} className="text-indigo-400" />
                        <span className="text-[11px] font-black text-indigo-900">{row.groupValue}</span>
                        <span className="bg-white text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] font-bold">{row.count} {t('ردیف', 'rows')}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              const isSelected = selectedRows.includes(row.id);
              const isDragging = rowReorderable;

              return (
                <tr 
                  key={row.id || rowIndex} 
                  onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                  draggable={isDragging}
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)} onDragEnter={(e) => handleRowDragEnter(e, rowIndex)} onDragEnd={handleRowDragEnd} onDragOver={(e) => e.preventDefault()}
                  className={`bg-white hover:bg-slate-50 border-b border-slate-100 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}
                >
                  {rowReorderable && (
                    <td style={{...getStickyStyles('ROW_REORDER_COL', false), backgroundColor: 'inherit'}} className={`p-0 text-center bg-white group-hover:bg-slate-50 ${isSelected ? 'bg-indigo-50' : ''} ${isRtl ? 'border-l border-slate-100' : 'border-r border-slate-100'}`}>
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 py-1.5 px-2 w-full flex items-center justify-center">
                        <GripVertical size={14} />
                      </div>
                    </td>
                  )}
                  {selectable && (
                    <td style={{...getStickyStyles('SELECT_COL', false), backgroundColor: 'inherit'}} className={`p-1.5 text-center bg-white group-hover:bg-slate-50 ${isSelected ? 'bg-indigo-50' : ''} ${isRtl ? 'border-l border-slate-100' : 'border-r border-slate-100'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(row.id)} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={`${row.id || rowIndex}-${col.field}`} style={{...getStickyStyles(col.field), backgroundColor: 'inherit'}} className={`p-1.5 text-[11px] text-slate-700 truncate bg-white group-hover:bg-slate-50 ${isSelected ? 'bg-indigo-50' : ''} ${isRtl ? 'border-l border-slate-100' : 'border-r border-slate-100'}`}>
                      {renderCellContent(col, row, rowIndex)}
                    </td>
                  ))}
                  
                  {actions.length > 0 && (
                    <td style={{...getStickyStyles('ACTIONS', true), backgroundColor: 'inherit'}} className={`p-1 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.01)] bg-white group-hover:bg-slate-50 ${isSelected ? 'bg-indigo-50' : ''} border-slate-100`}>
                      <div className="flex items-center justify-center gap-0.5">
                        {actions.map((act, i) => {
                          const actClass = typeof act.className === 'function' ? act.className(row) : (act.className || 'hover:text-indigo-600');
                          return (
                            <button key={i} onClick={(e) => { e.stopPropagation(); act.onClick(row, rowIndex); }} title={act.tooltip} className={`p-1.5 rounded-md text-slate-400 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all ${actClass}`}>
                              <act.icon size={14} strokeWidth={2} />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0) + (selectable ? 1 : 0) + (rowReorderable ? 1 : 0)} className="p-12 text-center text-slate-400 text-[12px] font-medium bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-3"><Search size={32} className="text-slate-300" /><span>{t('هیچ داده‌ای برای نمایش یافت نشد.', 'No data found to display.')}</span></div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between p-2 border-t border-slate-200 bg-slate-50 gap-4 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">{t('تعداد در صفحه:', 'Rows per page:')}</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="text-[11px] font-bold bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 cursor-pointer">
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 mx-2 hidden sm:block">{t(`نمایش ${(page - 1) * pageSize + 1} تا ${Math.min(page * pageSize, totalRecords)} از ${totalRecords}`, `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalRecords)} of ${totalRecords}`)}</span>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded"><ChevronsRight size={14} className={isRtl ? '' : 'rotate-180'} /></button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded"><ChevronRight size={14} className={isRtl ? '' : 'rotate-180'} /></button>
            <div className="text-[11px] font-black text-indigo-700 px-3 py-1 bg-indigo-50 rounded">{page} <span className="text-indigo-300 mx-1">/</span> {totalPages || 1}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded"><ChevronLeft size={14} className={isRtl ? '' : 'rotate-180'} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded"><ChevronsLeft size={14} className={isRtl ? '' : 'rotate-180'} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DesignSystem = { Button, TextField, SelectField, ToggleField, CheckboxField, LOVField, Card, Badge, PageHeader, Modal, AdvancedFilter, AttachmentManager, DataGrid };