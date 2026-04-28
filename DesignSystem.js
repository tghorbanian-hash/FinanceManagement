/* Filename: DesignSystem.js */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Download, Upload, Settings, Eye, Edit, Trash2, 
  Paperclip, Printer, Pin, PinOff, GripVertical, ChevronDown, 
  ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Layers, X, Maximize2, Minimize2
} from 'lucide-react';

// ==========================================
// 1. DataGrid Component
// ==========================================
const DataGrid = ({ 
  data = [], 
  columns = [], 
  actions = [], 
  language = 'fa' 
}) => {
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  // States
  const [gridData, setGridData] = useState(data);
  const [columnOrder, setColumnOrder] = useState(columns.map(c => c.field));
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [pinnedCols, setPinnedCols] = useState(new Set());
  
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [groupCols, setGroupCols] = useState([]); // آرایه برای گروه‌بندی چند سطحی
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);
  const dragItem = useRef();
  const dragOverItem = useRef();

  // کلیک بیرون از منوی ستون‌ها برای بستن آن
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external data changes
  useEffect(() => { setGridData(data); }, [data]);

  // Derived visible columns in order: Pinned first, then unpinned
  const visibleColumns = useMemo(() => {
    const visibleFields = columnOrder.filter(f => !hiddenCols.has(f));
    const pinned = visibleFields.filter(f => pinnedCols.has(f));
    const unpinned = visibleFields.filter(f => !pinnedCols.has(f));
    return [...pinned, ...unpinned].map(f => columns.find(c => c.field === f)).filter(Boolean);
  }, [columnOrder, hiddenCols, pinnedCols, columns]);

  // Sorting, Filtering & Recursive Grouping Engine
  const processedData = useMemo(() => {
    let result = [...gridData];

    // 1. Filter
    Object.keys(filters).forEach(key => {
      const filterVal = filters[key]?.toString().toLowerCase();
      if (!filterVal) return;
      result = result.filter(row => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return val.toString().toLowerCase().includes(filterVal);
      });
    });

    // 2. Sort
    if (sortConfig.field) {
      result.sort((a, b) => {
        const valA = a[sortConfig.field];
        const valB = b[sortConfig.field];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 3. Recursive Multi-level Grouping
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
        groupedResult.push({
          isGroupHeader: true,
          groupField: currentField,
          groupValue: val,
          groupKey: groupKey,
          depth: depth,
          count: groups[val].length
        });

        // اگر گروه بسته نشده بود، زیرمجموعه‌هایش را پردازش کن
        if (!collapsedGroups.has(groupKey)) {
          groupedResult = groupedResult.concat(
            buildGroupedData(groups[val], colsToGroup, depth + 1, groupKey)
          );
        }
      });
      return groupedResult;
    };

    if (groupCols.length > 0) {
      return buildGroupedData(result, groupCols);
    }

    return result;
  }, [gridData, filters, sortConfig, groupCols, collapsedGroups, t]);

  // Pagination
  const totalRecords = processedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  // Handlers
  const handleSort = (field) => {
    setSortConfig(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const togglePin = (field) => {
    const newPinned = new Set(pinnedCols);
    if (newPinned.has(field)) newPinned.delete(field); else newPinned.add(field);
    setPinnedCols(newPinned);
  };

  const toggleVisibility = (field) => {
    const newHidden = new Set(hiddenCols);
    if (newHidden.has(field)) newHidden.delete(field); else newHidden.add(field);
    setHiddenCols(newHidden);
  };

  // Drag & Drop for reordering columns
  const handleDragStart = (e, position, field) => { 
    dragItem.current = position; 
    e.dataTransfer.setData('colField', field); // برای ناحیه گروه‌بندی
  };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newOrder = [...columnOrder];
      const draggedContent = newOrder[dragItem.current];
      newOrder.splice(dragItem.current, 1);
      newOrder.splice(dragOverItem.current, 0, draggedContent);
      setColumnOrder(newOrder);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Grouping Drop Zone Handlers
  const handleGroupDrop = (e) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('colField');
    if (field && !groupCols.includes(field)) {
      setGroupCols([...groupCols, field]);
      setPage(1);
    }
  };
  const removeGroupCol = (field) => {
    setGroupCols(groupCols.filter(f => f !== field));
    // پاک کردن استیت گروه‌های بسته شده برای جلوگیری از باگ نمایشی
    setCollapsedGroups(new Set());
    setPage(1);
  };

  const toggleGroupCollapse = (groupKey) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) newCollapsed.delete(groupKey); else newCollapsed.add(groupKey);
    setCollapsedGroups(newCollapsed);
  };

  const expandAllGroups = () => setCollapsedGroups(new Set());
  const collapseAllGroups = () => {
    // برای سادگی، یک راهکار سریع برای بستن همه: پیدا کردن تمام کلیدهای سطح اول
    const topLevelKeys = processedData.filter(r => r.isGroupHeader && r.depth === 0).map(r => r.groupKey);
    setCollapsedGroups(new Set(topLevelKeys));
  };

  // Exports & Imports
  const exportCSV = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const rows = gridData
      .map(row => visibleColumns.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = '\uFEFF' + headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `export_${new Date().getTime()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getTemplate = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const blob = new Blob(['\uFEFF' + headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `template.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Sticky positioning calculation based on NEW visual order
  const getStickyStyles = (field, isAction = false, isHeader = false) => {
    const baseZ = isHeader ? 30 : 10;
    if (isAction) {
      return { position: 'sticky', [isRtl ? 'left' : 'right']: 0, zIndex: baseZ, background: 'inherit' };
    }
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
      
      {/* 1. Grouping Drop Zone */}
      <div 
        className={`px-3 py-2 border-b border-slate-200 transition-colors flex flex-wrap items-center gap-2 shrink-0 min-h-[40px] ${groupCols.length > 0 ? 'bg-indigo-50/50' : 'bg-slate-50'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleGroupDrop}
      >
        <Layers size={16} className={groupCols.length > 0 ? 'text-indigo-500' : 'text-slate-400'} />
        {groupCols.length === 0 ? (
          <span className="text-[11px] text-slate-400 font-medium">
            {t('برای گروه‌بندی، هدر ستون‌ها را به اینجا بکشید (Drag & Drop)...', 'Drag and drop column headers here to group...')}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {groupCols.map((field, idx) => {
              const colDef = columns.find(c => c.field === field);
              return (
                <div key={field} className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-[11px] font-bold shadow-sm">
                  <span>{colDef ? t(colDef.header_fa, colDef.header_en) : field}</span>
                  <button onClick={() => removeGroupCol(field)} className="text-indigo-400 hover:text-red-500 rounded-full p-0.5"><X size={12} /></button>
                  {idx < groupCols.length - 1 && <ChevronLeft size={14} className="text-slate-300 ml-1" />}
                </div>
              );
            })}
            <div className="mr-auto flex items-center gap-1 border-r border-slate-200 pr-2">
              <button onClick={expandAllGroups} title={t('باز کردن همه گروه‌ها', 'Expand All')} className="p-1 text-slate-500 hover:bg-slate-200 rounded transition-colors"><Maximize2 size={14} /></button>
              <button onClick={collapseAllGroups} title={t('بستن همه گروه‌ها', 'Collapse All')} className="p-1 text-slate-500 hover:bg-slate-200 rounded transition-colors"><Minimize2 size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-slate-200 bg-white gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Column Visibility Menu */}
          <div className="relative" ref={colMenuRef}>
            <button onClick={() => setShowColMenu(!showColMenu)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-[11px] font-bold transition-colors">
              <Settings size={14} className="text-indigo-500" />
              <span>{t('ستون‌ها', 'Columns')}</span>
            </button>
            {showColMenu && (
              <div className="absolute top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg p-3 z-50 min-w-[200px] right-0 animate-in zoom-in-95 duration-100">
                <div className="text-[12px] font-black text-slate-800 mb-2 pb-2 border-b border-slate-100">{t('نمایش / مخفی‌سازی', 'Show / Hide')}</div>
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-1">
                  {columns.map(c => (
                    <label key={c.field} className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-md text-[11px] font-bold text-slate-600 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={!hiddenCols.has(c.field)} 
                        onChange={() => toggleVisibility(c.field)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      {t(c.header_fa, c.header_en)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Action Icons */}
        <div className="flex items-center gap-1">
          <button onClick={() => getTemplate()} title={t('دریافت نمونه فایل (Template)', 'Download Template')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
            <Download size={16} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button onClick={() => document.getElementById('grid-import-input').click()} title={t('ورود اطلاعات (Import CSV)', 'Import Data')} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
            <Upload size={16} />
          </button>
          <input id="grid-import-input" type="file" className="hidden" accept=".csv" />
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button onClick={exportCSV} title={t('خروجی اکسل (Export)', 'Export to Excel')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all">
            <Printer size={16} /> {/* Can use FileSpreadsheet icon if available, using Printer as fallback */}
          </button>
        </div>
      </div>

      {/* 3. Scrollable Grid Container */}
      <div className="overflow-auto custom-scrollbar flex-1 relative bg-white">
        <table className="w-full text-left border-collapse table-fixed min-w-max" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="sticky top-0 z-40 shadow-sm">
            {/* Header Row */}
            <tr>
              {visibleColumns.map((col, index) => {
                const actualIndex = columnOrder.indexOf(col.field);
                const isPinned = pinnedCols.has(col.field);
                return (
                  <th 
                    key={col.field}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex, col.field)}
                    onDragEnter={(e) => handleDragEnter(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ width: col.width || '150px', ...getStickyStyles(col.field, false, true) }}
                    className={`p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 select-none bg-slate-100 ${isRtl ? 'border-l' : 'border-r'}`}
                  >
                    <div className="flex items-center justify-between gap-1 group">
                      <div className="flex items-center gap-1.5 cursor-pointer flex-1 overflow-hidden" onClick={() => handleSort(col.field)}>
                        <GripVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0" />
                        <span className="truncate">{t(col.header_fa, col.header_en)}</span>
                        {sortConfig.field === col.field && (
                          <span className="text-indigo-500 shrink-0">
                            {sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => togglePin(col.field)} 
                        className={`p-0.5 rounded shrink-0 transition-colors ${isPinned ? 'text-indigo-600 bg-indigo-50 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'}`}
                        title={t('سنجاق کردن', 'Pin Column')}
                      >
                        {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      </button>
                    </div>
                  </th>
                )
              })}
              {/* Action Column Header - Fixed Color */}
              {actions.length > 0 && (
                <th style={getStickyStyles('ACTIONS', true, true)} className="p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 w-[120px] bg-slate-100 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">
                  {t('عملیات', 'Actions')}
                </th>
              )}
            </tr>

            {/* Inline Filter Row */}
            <tr>
              {visibleColumns.map((col) => {
                const isDate = col.type === 'date';
                return (
                  <td key={`filter-${col.field}`} style={getStickyStyles(col.field, false, true)} className={`p-1 border-b border-slate-200 bg-slate-50 ${isRtl ? 'border-l' : 'border-r'}`}>
                    <div className="relative">
                      <Search size={10} className={`absolute top-1/2 -translate-y-1/2 ${isRtl && !isDate ? 'right-1.5' : 'left-1.5'} text-slate-400`} />
                      <input 
                        // برای فیلد تاریخ از text استفاده می‌کنیم اما با چینش چپ‌به‌راست تا کاربر راحت تایپ کند
                        type={col.type === 'number' ? 'number' : 'text'}
                        dir={isDate || !isRtl ? 'ltr' : 'rtl'}
                        value={filters[col.field] || ''}
                        onChange={(e) => handleFilterChange(col.field, e.target.value)}
                        placeholder={isDate ? 'YYYY/MM/DD' : t('جستجو...', 'Search...')}
                        className={`w-full h-6 text-[10px] font-sans font-bold bg-white border border-slate-200 rounded outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isDate || !isRtl ? 'pl-5 pr-1' : 'pr-5 pl-1'}`}
                      />
                    </div>
                  </td>
                );
              })}
              {actions.length > 0 && <td style={getStickyStyles('ACTIONS', true, true)} className="border-b border-slate-200 bg-slate-50 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]"></td>}
            </tr>
          </thead>

          <tbody className="z-10 relative">
            {paginatedData.length > 0 ? paginatedData.map((row, rowIndex) => {
              
              // ----------------- Group Header Render -----------------
              if (row.isGroupHeader) {
                const isCollapsed = collapsedGroups.has(row.groupKey);
                return (
                  <tr key={`group-${row.groupKey}`} className="bg-indigo-50/40 border-b border-indigo-100">
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="p-0">
                      <div 
                        className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-indigo-50 transition-colors"
                        style={{ paddingInlineStart: `${row.depth * 20 + 8}px` }}
                        onClick={() => toggleGroupCollapse(row.groupKey)}
                      >
                        <div className="text-indigo-500">
                          {isRtl ? (isCollapsed ? <ChevronLeft size={16}/> : <ChevronDown size={16}/>) : (isCollapsed ? <ChevronRight size={16}/> : <ChevronDown size={16}/>)}
                        </div>
                        <Layers size={14} className="text-indigo-400" />
                        <span className="text-[11px] font-black text-indigo-900">{row.groupValue}</span>
                        <span className="bg-white text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          {row.count} {t('ردیف', 'rows')}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // ----------------- Normal Row Render -----------------
              return (
                <tr key={row.id || rowIndex} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                  {visibleColumns.map((col) => (
                    <td key={`${row.id || rowIndex}-${col.field}`} style={{...getStickyStyles(col.field), backgroundColor: 'inherit'}} className={`p-1.5 border-slate-100 text-[11px] text-slate-700 truncate ${isRtl ? 'border-l' : 'border-r'}`}>
                      {row[col.field]}
                    </td>
                  ))}
                  
                  {/* Actions Column */}
                  {actions.length > 0 && (
                    <td style={{...getStickyStyles('ACTIONS', true), backgroundColor: 'inherit'}} className="p-1 border-slate-100 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.01)] relative z-10">
                      <div className="flex items-center justify-center gap-0.5">
                        {actions.map((act, i) => (
                          <button 
                            key={i} 
                            onClick={(e) => { e.stopPropagation(); act.onClick(row); }}
                            title={act.tooltip}
                            className={`p-1.5 rounded-md text-slate-400 bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all ${act.className || 'hover:text-indigo-600'}`}
                          >
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
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Search size={32} className="text-slate-300" />
                    <span>{t('هیچ داده‌ای برای نمایش یافت نشد.', 'No data found to display.')}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between p-2.5 border-t border-slate-200 bg-slate-50 gap-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">{t('تعداد در صفحه:', 'Rows per page:')}</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-[11px] font-bold bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 cursor-pointer transition-colors"
          >
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 mx-2 hidden sm:block">
            {t(`نمایش ${(page - 1) * pageSize + 1} تا ${Math.min(page * pageSize, totalRecords)} از ${totalRecords}`, `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalRecords)} of ${totalRecords}`)}
          </span>
          
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors">
              {isRtl ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors">
              {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            
            <div className="text-[11px] font-black text-indigo-700 px-3 py-1 bg-indigo-50 rounded">
              {page} <span className="text-indigo-300 mx-1">/</span> {totalPages || 1}
            </div>
            
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 rounded text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors">
              {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="p-1 rounded text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors">
              {isRtl ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

// ==========================================
// Export to Window Design System
// ==========================================
window.DesignSystem = { ...window.DesignSystem, DataGrid };