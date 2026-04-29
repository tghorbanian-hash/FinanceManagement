/* Filename: DesignSystem.js */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Loader2, AlertCircle, Search, Download, Upload, Settings, Eye, Edit, Trash2, 
  Paperclip, Printer, Pin, PinOff, GripVertical, ChevronDown, 
  ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Layers, X, Maximize2, Minimize2, Plus, Home, Filter
} from 'lucide-react';

// ==========================================
// 1. Button Component
// ==========================================
const Button = ({
  children, variant = 'primary', size = 'md', isLoading = false, disabled = false,
  icon: Icon, iconPosition = 'right', className = '', onClick, type = 'button', ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shrink-0";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm shadow-red-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200"
  };
  const sizes = { sm: "text-[11px] h-8 px-3 gap-1.5", md: "text-[12px] h-10 px-4 gap-2", lg: "text-[14px] h-12 px-6 gap-2.5" };
  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <button type={type} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || isLoading} onClick={onClick} {...props}>
      {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span className="truncate">{children}</span>
      {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} className="shrink-0" />}
    </button>
  );
};

// ==========================================
// 2. TextField Component
// ==========================================
const TextField = ({ label, error, hint, icon: Icon, disabled = false, required = false, className = '', wrapperClassName = '', id, type = 'text', size = 'md', isRtl = true, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };
  
  return (
    <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
      {label && <label htmlFor={inputId} className="text-[12px] font-bold text-slate-700 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative flex items-center">
        {Icon && <div className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} text-slate-400 pointer-events-none`}><Icon size={size === 'sm' ? 14 : 16} /></div>}
        <input
          id={inputId} type={type} disabled={disabled}
          className={`w-full ${inputHeights[size]} bg-white border rounded-lg text-slate-800 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'} ${Icon ? (isRtl ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5') : 'px-2.5'} ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'} {...props}
        />
      </div>
      {error ? <div className="flex items-center gap-1 text-red-500 text-[11px] font-bold mt-0.5"><AlertCircle size={12} /><span>{error}</span></div> : hint ? <div className="text-slate-500 text-[11px] mt-0.5">{hint}</div> : null}
    </div>
  );
};

// ==========================================
// 3. SelectField Component
// ==========================================
const SelectField = ({ label, error, options = [], disabled = false, required = false, className = '', wrapperClassName = '', id, size = 'md', isRtl = true, ...props }) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const inputHeights = { sm: 'h-8 text-[11px]', md: 'h-10 text-[13px]', lg: 'h-12 text-[14px]' };

  return (
    <div className={`flex flex-col ${size === 'sm' ? 'gap-1' : 'gap-1.5'} w-full ${wrapperClassName}`}>
      {label && <label htmlFor={selectId} className="text-[12px] font-bold text-slate-700 flex items-center gap-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative">
        <select
          id={selectId} disabled={disabled}
          className={`w-full ${inputHeights[size]} bg-white border rounded-lg text-slate-800 transition-all outline-none appearance-none cursor-pointer focus:bg-white focus:ring-2 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'} ${isRtl ? 'pl-8 pr-2.5' : 'pr-8 pl-2.5'} ${className}`}
          dir={isRtl ? 'rtl' : 'ltr'} {...props}
        >
          <option value="" disabled hidden>انتخاب کنید...</option>
          {options.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-2.5' : 'right-2.5'} pointer-events-none text-slate-400`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></div>
      </div>
      {error && <div className="flex items-center gap-1 text-red-500 text-[11px] font-bold mt-0.5"><AlertCircle size={12} /><span>{error}</span></div>}
    </div>
  );
};

// ==========================================
// 4. Card & Badge Component
// ==========================================
const Card = ({ title, action, children, className = '', noPadding = false }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
    {(title || action) && (
      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50 shrink-0">
        <h3 className="font-black text-[13px] text-slate-800">{title}</h3>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={`flex-1 ${noPadding ? '' : 'p-4'}`}>{children}</div>
  </div>
);

const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: "bg-slate-100 text-slate-600 border border-slate-200", success: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border border-amber-200", danger: "bg-red-50 text-red-600 border border-red-200", indigo: "bg-indigo-50 text-indigo-600 border border-indigo-200"
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${variants[variant]} ${className}`}>{children}</span>;
};

// ==========================================
// 5. PageHeader Component
// ==========================================
const PageHeader = ({ title, icon: Icon, breadcrumbs = [], language = 'fa' }) => {
  const isRtl = language === 'fa';
  return (
    <div className="flex flex-col gap-1.5 mb-4 shrink-0" dir={isRtl ? 'rtl' : 'ltr'}>
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
        <h1 className="text-[15px] font-black tracking-tight">{title}</h1>
      </div>
    </div>
  );
};

// ==========================================
// 6. AdvancedFilter Component
// ==========================================
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
          {/* استفاده از سایز فشرده (sm) برای فیلدها */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {fields.map((f, idx) => {
              if (f.type === 'select') {
                return <SelectField key={idx} size="sm" label={f.label} isRtl={isRtl} options={f.options} value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)} />;
              }
              return (
                <TextField 
                  key={idx} size="sm" label={f.label} isRtl={isRtl}
                  type={f.type} 
                  placeholder={f.type === 'date' ? 'YYYY/MM/DD' : ''}
                  value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)}
                  dir={f.type === 'date' || !isRtl ? 'ltr' : 'rtl'}
                />
              );
            })}
          </div>
          {/* حذف خط بالایی دکمه‌ها و فشرده‌سازی فاصله */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>{t('پاک کردن', 'Clear')}</Button>
            <Button variant="primary" size="sm" icon={Search} onClick={() => onFilter && onFilter(values)}>{t('جستجو', 'Search')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 7. DataGrid Component (Advanced)
// ==========================================
const DataGrid = ({ data = [], columns = [], actions = [], language = 'fa', onAdd }) => {
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
  
  const colMenuRef = useRef(null);
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setGridData(data); }, [data]);

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

  const handleDragStart = (e, position, field) => { dragItem.current = position; e.dataTransfer.setData('colField', field); };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newOrder = [...columnOrder];
      const draggedContent = newOrder[dragItem.current];
      newOrder.splice(dragItem.current, 1);
      newOrder.splice(dragOverItem.current, 0, draggedContent);
      setColumnOrder(newOrder);
    }
    dragItem.current = null; dragOverItem.current = null;
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

  const exportCSV = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const rows = gridData.map(row => visibleColumns.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const csv = '\uFEFF' + headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `export_${new Date().getTime()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getTemplate = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const blob = new Blob(['\uFEFF' + headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `template.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStickyStyles = (field, isAction = false, isHeader = false) => {
    const baseZ = isHeader ? 30 : 10;
    if (isAction) return { position: 'sticky', [isRtl ? 'left' : 'right']: 0, zIndex: baseZ, background: 'inherit' };
    if (!pinnedCols.has(field)) return {};
    let offset = 0;
    for (let col of visibleColumns) {
      if (col.field === field) break;
      offset += parseInt(col.width || 100);
    }
    return { position: 'sticky', [isRtl ? 'right' : 'left']: offset, zIndex: baseZ, background: 'inherit' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col font-sans h-full overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Unified Toolbar */}
      <div className="flex flex-wrap items-stretch p-1.5 border-b border-slate-200 bg-white gap-2 shrink-0 min-h-[46px]">
        
        {/* Action Buttons (New) - جابجا شده به سمت راست/ابتدای هدر */}
        <div className="flex items-center shrink-0">
          {onAdd && (
            <Button size="sm" variant="primary" icon={Plus} onClick={onAdd} className="h-full px-3.5 text-[11px] shadow-sm">
              {t('جدید', 'New')}
            </Button>
          )}
        </div>

        {/* Grouping Drop Zone */}
        <div 
          className={`flex-1 flex items-center gap-2 px-3 py-1 border border-dashed rounded-md transition-colors overflow-x-auto custom-scrollbar ${groupCols.length > 0 ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
          onDragOver={(e) => e.preventDefault()} onDrop={handleGroupDrop}
        >
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

        {/* Tools Menu (Columns, Import, Export) - جابجا شده به انتهای هدر */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center h-full" ref={colMenuRef}>
            <button onClick={() => setShowColMenu(!showColMenu)} title={t('نمایش/مخفی‌سازی ستون‌ها', 'Columns')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center">
              <Settings size={16} />
            </button>
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
          <button onClick={() => getTemplate()} title={t('دریافت نمونه فایل', 'Template')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Download size={16} /></button>
          <button onClick={() => document.getElementById('grid-import-input').click()} title={t('ورود اطلاعات', 'Import')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Upload size={16} /></button>
          <input id="grid-import-input" type="file" className="hidden" accept=".csv" />
          <button onClick={exportCSV} title={t('خروجی اکسل', 'Export')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Printer size={16} /></button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-auto custom-scrollbar flex-1 relative bg-white">
        {/* رفع باگ نشت بک‌گراند: استفاده از border-separate بجای border-collapse */}
        <table className="w-full text-start border-separate border-spacing-0 min-w-max" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="sticky top-0 z-40 bg-slate-100 shadow-sm">
            <tr>
              {visibleColumns.map((col, index) => {
                const actualIndex = columnOrder.indexOf(col.field);
                const isPinned = pinnedCols.has(col.field);
                const headerZIndex = isPinned ? 35 : 30; 
                return (
                  <th 
                    key={col.field} draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex, col.field)}
                    onDragEnter={(e) => handleDragEnter(e, actualIndex)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                    style={{ width: col.width || '150px', ...getStickyStyles(col.field, false), zIndex: headerZIndex }}
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
                <th style={{...getStickyStyles('ACTIONS', true), zIndex: 40}} className="p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 w-[120px] bg-slate-100 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">
                  {t('عملیات', 'Actions')}
                </th>
              )}
            </tr>

            <tr>
              {visibleColumns.map((col) => {
                const isPinned = pinnedCols.has(col.field);
                const filterZIndex = isPinned ? 35 : 30;
                return (
                  <td key={`filter-${col.field}`} style={{...getStickyStyles(col.field, false), zIndex: filterZIndex}} className={`p-1 border-b border-slate-200 bg-slate-50 ${isRtl ? 'border-l' : 'border-r'}`}>
                    <div className="relative">
                      {/* تقویم بازگردانده شد و دکمه سرچ در تقویم پنهان است */}
                      {col.type !== 'date' && <Search size={10} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-1.5' : 'left-1.5'} text-slate-400`} />}
                      <input 
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        dir={col.type === 'date' || !isRtl ? 'ltr' : 'rtl'}
                        value={filters[col.field] || ''} onChange={(e) => handleFilterChange(col.field, e.target.value)}
                        placeholder={col.type === 'date' ? '' : t('جستجو...', 'Search...')}
                        className={`w-full h-6 text-[10px] font-sans font-bold bg-white border border-slate-200 rounded outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${col.type === 'date' ? 'px-1' : (isRtl ? 'pr-5 pl-1' : 'pl-5 pr-1')}`}
                      />
                    </div>
                  </td>
                );
              })}
              {actions.length > 0 && <td style={{...getStickyStyles('ACTIONS', true), zIndex: 40}} className="border-b border-slate-200 bg-slate-50 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]"></td>}
            </tr>
          </thead>

          <tbody className="z-10 relative">
            {paginatedData.length > 0 ? paginatedData.map((row, rowIndex) => {
              if (row.isGroupHeader) {
                const isCollapsed = collapsedGroups.has(row.groupKey);
                return (
                  <tr key={`group-${row.groupKey}`} className="bg-indigo-50/40 border-b border-indigo-100">
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="p-0 sticky left-0 right-0">
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

              return (
                <tr key={row.id || rowIndex} className="bg-white hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                  {visibleColumns.map((col) => (
                    <td key={`${row.id || rowIndex}-${col.field}`} style={getStickyStyles(col.field)} className={`p-1.5 text-[11px] text-slate-700 truncate bg-inherit ${isRtl ? 'border-l border-slate-100' : 'border-r border-slate-100'}`}>
                      {row[col.field]}
                    </td>
                  ))}
                  
                  {actions.length > 0 && (
                    <td style={getStickyStyles('ACTIONS', true)} className="p-1 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.01)] bg-inherit relative z-20 border-slate-100">
                      <div className="flex items-center justify-center gap-0.5">
                        {actions.map((act, i) => (
                          <button key={i} onClick={(e) => { e.stopPropagation(); act.onClick(row); }} title={act.tooltip} className={`p-1.5 rounded-md text-slate-400 bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all ${act.className || 'hover:text-indigo-600'}`}>
                            <act.icon size={14} strokeWidth={2} />
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="p-12 text-center text-slate-400 text-[12px] font-medium bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-3"><Search size={32} className="text-slate-300" /><span>{t('هیچ داده‌ای برای نمایش یافت نشد.', 'No data found to display.')}</span></div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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

window.DesignSystem = { Button, TextField, Card, Badge, SelectField, PageHeader, AdvancedFilter, DataGrid };