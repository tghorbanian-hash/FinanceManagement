/* Filename: DSGrid.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useRef } = React;
  const {
    Search, Settings, Trash2, Pin, PinOff, GripVertical, ChevronDown, 
    ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Layers, X, Maximize2, Minimize2, Plus, Filter, Upload, FileSpreadsheet, FileDown
  } = window.LucideIcons || {};

  const { Button, TextField, SelectField, ToggleField, CheckboxField, DatePicker, Badge } = window.DSCore || {};
  const { Modal } = window.DSFeedback || {};

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
        {Modal && (
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${t('انتخاب', 'Select')} ${label || ''}`} width="max-w-3xl" language={isRtl ? 'fa' : 'en'}>
            <div className="h-[350px] p-2 bg-slate-50/50">
              <DataGrid 
                data={data} columns={columns} language={isRtl ? 'fa' : 'en'} 
                onRowDoubleClick={(row) => { onChange(row); setIsOpen(false); }}
              />
            </div>
          </Modal>
        )}
      </div>
    );
  };

  const AdvancedFilter = ({ title, fields = [], onFilter, onClear, language = 'fa', defaultOpen = false, initialValues = {}, children }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [values, setValues] = useState(initialValues);

    useEffect(() => {
      if (initialValues && Object.keys(initialValues).length > 0 && Object.keys(values).length === 0) {
        setValues(initialValues);
      }
    }, [initialValues]);

    const handleChange = (name, val) => setValues(prev => ({ ...prev, [name]: val }));
    const handleClear = () => { setValues({}); if (onClear) onClear(); };

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col shrink-0 mb-3 font-sans transition-all duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={`h-9 px-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors select-none ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`} onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-2 text-indigo-600 shrink-0">
             <Filter size={14} strokeWidth={2.5} />
             <span className="text-[12px] font-black">{title || t('فیلتر پیشرفته', 'Advanced Filter')}</span>
          </div>
          <div className="text-slate-400 shrink-0">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
        </div>
        {isOpen && (
          <div className="p-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {fields.map((f, idx) => {
                if (f.type === 'select') return <SelectField key={idx} size="sm" label={f.label} isRtl={isRtl} options={f.options} value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)} />;
                if (f.type === 'toggle') return <ToggleField key={idx} size="sm" label={f.label} isRtl={isRtl} checked={values[f.name]} onChange={(v) => handleChange(f.name, v)} wrapperClassName="mt-5" />;
                if (f.type === 'checkbox') return <CheckboxField key={idx} size="sm" label={f.label} isRtl={isRtl} checked={values[f.name]} onChange={(v) => handleChange(f.name, v)} wrapperClassName="mt-5" />;
                if (f.type === 'lov') return <LOVField key={idx} size="sm" label={f.label} isRtl={isRtl} data={f.lovData} columns={f.lovColumns} displayValue={values[f.name]?.title} onChange={(row) => handleChange(f.name, row)} />;
                if (f.type === 'date') return <DatePicker key={idx} size="sm" label={f.label} isRtl={isRtl} language={language} value={values[f.name] || ''} onChange={(val) => handleChange(f.name, val)} />;
                return <TextField key={idx} size="sm" label={f.label} isRtl={isRtl} type={f.type} placeholder={f.type === 'date' ? 'YYYY/MM/DD' : ''} value={values[f.name] || ''} onChange={(e) => handleChange(f.name, e.target.value)} dir={f.type === 'date' || !isRtl ? 'ltr' : 'rtl'} />;
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                {children}
              </div>
              <div className="flex items-center gap-2 shrink-0 mr-auto">
                <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>{t('پاک کردن', 'Clear')}</Button>
                <Button variant="primary" size="sm" icon={Search} onClick={() => onFilter && onFilter(values)}>{t('جستجو', 'Search')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DataGrid = ({ data = [], columns = [], actions = [], language = 'fa', onAdd, onRowDoubleClick, selectable = false, bulkActions = [], headerMenus = [], rowReorderable = false, onRowReorder, onDownloadSample, showSummaryRow = false }) => {
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
    const [activeHeaderMenu, setActiveHeaderMenu] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    
    const colMenuRef = useRef(null);
    const headerMenuRef = useRef(null);
    const dragColItem = useRef(); const dragOverColItem = useRef();
    const dragRowItem = useRef(); const dragOverRowItem = useRef();

    useEffect(() => {
      const handleClickOutside = (e) => { 
        if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false); 
        if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setActiveHeaderMenu(null);
      };
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
          const valA = a[sortConfig.field]; const valB = b[sortConfig.field];
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      const buildGroupedData = (dataArray, colsToGroup, depth = 0, parentKey = '') => {
        if (depth >= colsToGroup.length) return dataArray;
        const currentField = colsToGroup[depth]; const groups = {};
        dataArray.forEach(row => { 
          let rawVal = row[currentField];
          let val = rawVal;
          if (rawVal && typeof rawVal === 'object') {
              val = rawVal.title || rawVal.name || rawVal.label || rawVal.text || rawVal.display || String(rawVal);
          }
          if (val === null || val === undefined || val === '') {
              val = t('نامشخص', 'Unknown');
          }
          if (!groups[val]) groups[val] = []; 
          groups[val].push(row); 
        });
        let groupedResult = [];
        Object.keys(groups).forEach(val => {
          const groupKey = parentKey ? `${parentKey}|${val}` : val;
          groupedResult.push({ isGroupHeader: true, groupField: currentField, groupValue: val, groupKey, depth, count: groups[val].length });
          if (!collapsedGroups.has(groupKey)) groupedResult = groupedResult.concat(buildGroupedData(groups[val], colsToGroup, depth + 1, groupKey));
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

    const summaryData = useMemo(() => {
      if (!showSummaryRow) return null;
      const flatData = processedData.filter(r => !r.isGroupHeader);
      const sums = {};
      let hasSummary = false;
      columns.forEach(col => {
        if (col.summarizable) {
          hasSummary = true;
          const total = flatData.reduce((acc, row) => {
             let raw = row[col.field];
             if(raw === null || raw === undefined) return acc;
             const val = parseFloat(String(raw).replace(/,/g, ''));
             return acc + (isNaN(val) ? 0 : val);
          }, 0);
          sums[col.field] = total;
        }
      });
      return hasSummary ? sums : null;
    }, [processedData, columns, showSummaryRow]);

    const handleSort = (field) => { setSortConfig(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' })); };
    const handleFilterChange = (field, value) => { setFilters(prev => ({ ...prev, [field]: value })); setPage(1); };
    const togglePin = (field) => { const newPinned = new Set(pinnedCols); if (newPinned.has(field)) newPinned.delete(field); else newPinned.add(field); setPinnedCols(newPinned); };
    const toggleVisibility = (field) => { const newHidden = new Set(hiddenCols); if (newHidden.has(field)) newHidden.delete(field); else newHidden.add(field); setHiddenCols(newHidden); };

    const handleColDragStart = (e, position, field) => { dragColItem.current = position; e.dataTransfer.setData('colField', field); };
    const handleColDragEnter = (e, position) => { dragOverColItem.current = position; };
    const handleColDragEnd = () => {
      if (dragColItem.current !== null && dragOverColItem.current !== null) {
        const newOrder = [...columnOrder]; const draggedContent = newOrder[dragColItem.current];
        newOrder.splice(dragColItem.current, 1); newOrder.splice(dragOverColItem.current, 0, draggedContent); setColumnOrder(newOrder);
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

    const handleGroupDrop = (e) => { e.preventDefault(); const field = e.dataTransfer.getData('colField'); if (field && !groupCols.includes(field)) { setGroupCols([...groupCols, field]); setPage(1); } };
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
    const handleSelectRow = (id) => { if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rowId => rowId !== id)); else setSelectedRows([...selectedRows, id]); };

    const exportCSV = () => {
      const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
      const rows = gridData.map(row => visibleColumns.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
      const csv = '\uFEFF' + headers + '\n' + rows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `export_${new Date().getTime()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const getStickyStyles = (field, isAction = false, isHeader = false, isFooter = false) => {
      const bg = (isHeader || isFooter) ? '#f1f5f9' : '#ffffff'; 
      if (isAction) return { position: 'sticky', [isRtl ? 'left' : 'right']: 0, zIndex: isHeader || isFooter ? 50 : 20, backgroundColor: bg };
      if (field === 'ROW_REORDER_COL') return { position: 'sticky', [isRtl ? 'right' : 'left']: 0, zIndex: isHeader || isFooter ? 45 : 15, backgroundColor: bg };
      if (field === 'SELECT_COL') return { position: 'sticky', [isRtl ? 'right' : 'left']: rowReorderable ? 30 : 0, zIndex: isHeader || isFooter ? 45 : 15, backgroundColor: bg };

      if (!pinnedCols.has(field)) return { zIndex: isHeader || isFooter ? 30 : 1 };
      
      let offset = (rowReorderable ? 30 : 0) + (selectable ? 40 : 0); 
      for (let col of visibleColumns) {
        if (col.field === field) break;
        offset += parseInt(col.width || 100);
      }
      return { position: 'sticky', [isRtl ? 'right' : 'left']: offset, zIndex: isHeader || isFooter ? 40 : 10, backgroundColor: bg };
    };

    const renderCellContent = (col, row, rowIndex) => {
      if (col.render) return col.render(row[col.field], row, rowIndex);
      const val = row[col.field];
      if (col.type === 'toggle') return <ToggleField checked={!!val} disabled isRtl={isRtl} wrapperClassName="pointer-events-none" />;
      if (col.type === 'checkbox') return <CheckboxField checked={!!val} disabled isRtl={isRtl} wrapperClassName="pointer-events-none" />;
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
                <Button key={i} size="sm" variant={act.variant || 'outline'} icon={act.icon} onClick={() => {act.onClick(selectedRows); setSelectedRows([]);}} className={`!h-7 text-[10px] ${act.className || ''}`}>
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
            {headerMenus && headerMenus.length > 0 && (
              <div className="flex items-center gap-1.5" ref={headerMenuRef}>
                {headerMenus.map((menu, idx) => (
                  <div key={idx} className="relative h-full">
                    <Button size="sm" variant={menu.variant || 'outline'} onClick={() => setActiveHeaderMenu(activeHeaderMenu === idx ? null : idx)} className={`h-full flex items-center justify-between gap-4 min-w-[130px] ${menu.className || ''}`}>
                      <span className="flex items-center gap-1.5">
                        {menu.icon && <menu.icon size={14} className="shrink-0" />}
                        {menu.label}
                      </span>
                      <ChevronDown size={14} className="opacity-70 shrink-0" />
                    </Button>
                    {activeHeaderMenu === idx && (
                      <div className="absolute top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1.5 z-50 min-w-[180px] right-0 animate-in zoom-in-95 duration-100 flex flex-col gap-0.5">
                        <div className="text-[11px] font-black text-slate-400 mb-1 px-2 pt-1 uppercase">{menu.label}</div>
                        {menu.items.map((item, i) => {
                          if (item.divider) return <div key={i} className="h-px bg-slate-100 my-1"></div>;
                          return (
                            <button key={i} onClick={() => { item.onClick(); setActiveHeaderMenu(null); }} className={`flex items-center gap-2 w-full text-start px-2.5 py-2 text-[11.5px] font-bold rounded-md hover:bg-slate-50 transition-colors ${item.className || 'text-slate-700 hover:text-indigo-600'}`}>
                              {item.icon && <item.icon size={14} className={item.iconClassName || ''} />}
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>
              </div>
            )}
            
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
            {onDownloadSample && (
              <button onClick={onDownloadSample} title={t('دانلود نمونه فایل اکسل', 'Download Excel Sample')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><FileDown size={16} /></button>
            )}
            <button onClick={() => document.getElementById('grid-import-input').click()} title={t('ورود اطلاعات', 'Import')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><Upload size={16} /></button>
            <input id="grid-import-input" type="file" className="hidden" accept=".csv" />
            <button onClick={exportCSV} title={t('خروجی اکسل', 'Export')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-md transition-all h-full flex items-center justify-center"><FileSpreadsheet size={16} /></button>
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
                            if (act.hidden && act.hidden(row)) return null;
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
            
            {showSummaryRow && summaryData && (
              <tfoot className="sticky bottom-0 z-40 bg-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t-2 border-slate-200">
                <tr>
                  {rowReorderable && <td style={getStickyStyles('ROW_REORDER_COL', false, false, true)} className={`p-2 border-t border-slate-200 bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}></td>}
                  {selectable && <td style={getStickyStyles('SELECT_COL', false, false, true)} className={`p-2 border-t border-slate-200 bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}></td>}
                  {visibleColumns.map((col, idx) => {
                    const isFirstVisible = idx === 0;
                    const cellValue = col.summarizable && summaryData[col.field] !== undefined 
                      ? (col.formatSummary ? col.formatSummary(summaryData[col.field]) : summaryData[col.field].toLocaleString()) 
                      : (isFirstVisible && !col.summarizable ? t('جمع کل:', 'Total:') : '');
                    return (
                      <td key={`summary-${col.field}`} style={getStickyStyles(col.field, false, false, true)} className={`p-2 font-black text-[12px] text-slate-800 bg-slate-100 border-t border-slate-200 ${isRtl ? 'border-l' : 'border-r'} ${col.summarizable ? 'text-indigo-700' : ''}`}>
                        {cellValue}
                      </td>
                    );
                  })}
                  {actions.length > 0 && <td style={getStickyStyles('ACTIONS', true, false, true)} className="p-2 border-t border-slate-200 bg-slate-100 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]"></td>}
                </tr>
              </tfoot>
            )}
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

  window.DSGrid = { LOVField, AdvancedFilter, DataGrid };
})();