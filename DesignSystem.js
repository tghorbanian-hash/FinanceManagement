/* Filename: DesignSystem.js */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Download, Upload, Settings, Eye, Edit, Trash2, 
  Paperclip, Printer, Pin, PinOff, GripVertical, ChevronDown, 
  ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Filter, Layers
} from 'lucide-react';

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
  const [groupBy, setGroupBy] = useState('');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [showColMenu, setShowColMenu] = useState(false);
  const dragItem = useRef();
  const dragOverItem = useRef();

  // Sync external data changes
  useEffect(() => { setGridData(data); }, [data]);

  // Derived visible columns in order
  const visibleColumns = useMemo(() => {
    return columnOrder
      .filter(f => !hiddenCols.has(f))
      .map(f => columns.find(c => c.field === f))
      .filter(Boolean);
  }, [columnOrder, hiddenCols, columns]);

  // Sorting, Filtering & Grouping Engine
  const processedData = useMemo(() => {
    let result = [...gridData];

    // 1. Filter
    Object.keys(filters).forEach(key => {
      const filterVal = filters[key].toString().toLowerCase();
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

    // 3. Group
    if (groupBy) {
      const grouped = {};
      result.forEach(row => {
        const groupVal = row[groupBy] || t('نامشخص', 'Unknown');
        if (!grouped[groupVal]) grouped[groupVal] = [];
        grouped[groupVal].push(row);
      });
      
      let flattened = [];
      Object.keys(grouped).forEach(key => {
        flattened.push({ isGroupHeader: true, groupValue: key, count: grouped[key].length });
        flattened = flattened.concat(grouped[key]);
      });
      return flattened;
    }

    return result;
  }, [gridData, filters, sortConfig, groupBy, t]);

  // Pagination
  const totalRecords = processedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  // Handlers
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page on filter
  };

  const togglePin = (field) => {
    const newPinned = new Set(pinnedCols);
    if (newPinned.has(field)) newPinned.delete(field);
    else newPinned.add(field);
    setPinnedCols(newPinned);
  };

  const toggleVisibility = (field) => {
    const newHidden = new Set(hiddenCols);
    if (newHidden.has(field)) newHidden.delete(field);
    else newHidden.add(field);
    setHiddenCols(newHidden);
  };

  // Drag & Drop for columns
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = () => {
    const newOrder = [...columnOrder];
    const draggedContent = newOrder[dragItem.current];
    newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOverItem.current, 0, draggedContent);
    setColumnOrder(newOrder);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Export CSV
  const exportCSV = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const rows = processedData
      .filter(row => !row.isGroupHeader)
      .map(row => visibleColumns.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = '\uFEFF' + headers + '\n' + rows; // \uFEFF for UTF-8 BOM
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV Target
  const fileInputRef = useRef(null);
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.replace(/['"]+/g, '').trim());
        const importedData = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/['"]+/g, '').trim());
          const row = { id: new Date().getTime() + i }; // Generate ID if needed
          headers.forEach((h, idx) => {
            const col = columns.find(c => t(c.header_fa, c.header_en) === h || c.field === h);
            if (col) row[col.field] = values[idx];
          });
          importedData.push(row);
        }
        setGridData(prev => [...prev, ...importedData]);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const getTemplate = () => {
    const headers = visibleColumns.map(c => t(c.header_fa, c.header_en)).join(',');
    const blob = new Blob(['\uFEFF' + headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sticky positioning calculation
  const getStickyStyles = (field, isAction = false) => {
    if (isAction) {
      return { position: 'sticky', [isRtl ? 'left' : 'right']: 0, zIndex: 10, background: '#fff' };
    }
    if (!pinnedCols.has(field)) return {};
    
    // Calculate offset based on previous pinned columns
    let offset = 0;
    for (let f of columnOrder) {
      if (f === field) break;
      if (pinnedCols.has(f) && !hiddenCols.has(f)) {
        const colDef = columns.find(c => c.field === f);
        offset += parseInt(colDef?.width || 100);
      }
    }
    return { position: 'sticky', [isRtl ? 'right' : 'left']: offset, zIndex: 10, background: '#f8fafc' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-slate-200 bg-slate-50 gap-2">
        <div className="flex items-center gap-2">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button onClick={() => setShowColMenu(!showColMenu)} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 text-[11px] font-bold">
              <Settings size={14} />
              <span>{t('ستون‌ها', 'Columns')}</span>
            </button>
            {showColMenu && (
              <div className="absolute top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-md p-2 z-50 min-w-[200px] right-0">
                <div className="text-[11px] font-black text-slate-800 mb-2 pb-1 border-b">{t('نمایش/عدم نمایش', 'Show/Hide')}</div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                  {columns.map(c => (
                    <label key={c.field} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded text-[11px] text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={!hiddenCols.has(c.field)} 
                        onChange={() => toggleVisibility(c.field)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t(c.header_fa, c.header_en)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grouping */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1">
            <Layers size={14} className="text-slate-400" />
            <select 
              value={groupBy} 
              onChange={(e) => { setGroupBy(e.target.value); setPage(1); }}
              className="text-[11px] font-bold text-slate-600 outline-none bg-transparent cursor-pointer"
            >
              <option value="">{t('بدون گروه‌بندی', 'No Grouping')}</option>
              {columns.map(c => (
                <option key={c.field} value={c.field}>{t(`گروه‌بندی: ${c.header_fa}`, `Group by: ${c.header_en}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <button onClick={() => getTemplate()} className="flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded text-[11px] font-bold transition-colors">
            <Download size={14} />
            <span>{t('نمونه فایل', 'Template')}</span>
          </button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded text-[11px] font-bold transition-colors">
            <Upload size={14} />
            <span>{t('دریافت', 'Import')}</span>
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors">
            <Download size={14} />
            <span>{t('خروجی اکسل', 'Export Excel')}</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto custom-scrollbar flex-1 relative min-h-[300px]">
        <table className="w-full text-left border-collapse table-fixed min-w-max" dir={isRtl ? 'rtl' : 'ltr'}>
          <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
            {/* Header Row */}
            <tr>
              {visibleColumns.map((col, index) => {
                const actualIndex = columnOrder.indexOf(col.field);
                return (
                  <th 
                    key={col.field}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex)}
                    onDragEnter={(e) => handleDragEnter(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ width: col.width || '150px', ...getStickyStyles(col.field) }}
                    className="p-1.5 border-b border-r border-slate-200 text-[11px] font-black text-slate-700 select-none bg-slate-100"
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
                        className={`p-0.5 rounded shrink-0 ${pinnedCols.has(col.field) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'}`}
                        title={t('سنجاق کردن', 'Pin Column')}
                      >
                        {pinnedCols.has(col.field) ? <PinOff size={12} /> : <Pin size={12} />}
                      </button>
                    </div>
                  </th>
                )
              })}
              {/* Action Column Header */}
              {actions.length > 0 && (
                <th style={getStickyStyles('ACTIONS', true)} className="p-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 w-[120px] bg-slate-100 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                  {t('عملیات', 'Actions')}
                </th>
              )}
            </tr>
            {/* Inline Filter Row */}
            <tr>
              {visibleColumns.map((col) => (
                <td key={`filter-${col.field}`} style={getStickyStyles(col.field)} className="p-1 border-b border-r border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search size={10} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-1.5' : 'left-1.5'} text-slate-400`} />
                    <input 
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      value={filters[col.field] || ''}
                      onChange={(e) => handleFilterChange(col.field, e.target.value)}
                      placeholder={t('جستجو...', 'Search...')}
                      className={`w-full h-6 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isRtl ? 'pr-5 pl-1' : 'pl-5 pr-1'}`}
                    />
                  </div>
                </td>
              ))}
              {actions.length > 0 && <td style={getStickyStyles('ACTIONS', true)} className="border-b border-slate-200 bg-slate-50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]"></td>}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, rowIndex) => {
              // Group Header Render
              if (row.isGroupHeader) {
                return (
                  <tr key={`group-${rowIndex}`} className="bg-indigo-50/50 border-b border-slate-200">
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="p-2 text-[11px] font-black text-indigo-800">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-indigo-500" />
                        <span>{row.groupValue}</span>
                        <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-full text-[9px]">{row.count} {t('مورد', 'Items')}</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Normal Row Render
              return (
                <tr key={row.id || rowIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  {visibleColumns.map((col) => (
                    <td key={`${row.id || rowIndex}-${col.field}`} style={getStickyStyles(col.field)} className="p-1.5 border-r border-slate-100 text-[11px] text-slate-700 truncate group-hover:bg-slate-50 transition-colors">
                      {row[col.field]}
                    </td>
                  ))}
                  
                  {/* Actions Column */}
                  {actions.length > 0 && (
                    <td style={getStickyStyles('ACTIONS', true)} className="p-1 border-slate-100 group-hover:bg-slate-50 transition-colors text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-center gap-1">
                        {actions.map((act, i) => (
                          <button 
                            key={i} 
                            onClick={() => act.onClick(row)}
                            title={act.tooltip}
                            className={`p-1 rounded text-slate-400 hover:bg-slate-200 transition-colors ${act.className || 'hover:text-indigo-600'}`}
                          >
                            <act.icon size={14} strokeWidth={2.5} />
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="p-8 text-center text-slate-400 text-[12px] font-medium bg-slate-50/50">
                  {t('اطلاعاتی برای نمایش یافت نشد.', 'No data found to display.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between p-2 border-t border-slate-200 bg-slate-50 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">{t('تعداد در صفحه:', 'Rows per page:')}</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-[11px] font-bold bg-white border border-slate-300 rounded px-1 py-0.5 outline-none focus:border-indigo-500 text-slate-700"
          >
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mx-2">
            {t(`نمایش ${(page - 1) * pageSize + 1} تا ${Math.min(page * pageSize, totalRecords)} از ${totalRecords}`, `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalRecords)} of ${totalRecords}`)}
          </span>
          
          <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-transparent hover:bg-slate-100 transition-all">
            {isRtl ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-transparent hover:bg-slate-100 transition-all">
            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          
          <span className="text-[11px] font-black text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100">
            {page} / {totalPages || 1}
          </span>
          
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-transparent hover:bg-slate-100 transition-all">
            {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="p-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-transparent hover:bg-slate-100 transition-all">
            {isRtl ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

window.DesignSystem = { DataGrid };