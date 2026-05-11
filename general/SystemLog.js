/* Filename: access/SystemLog.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    History = FallbackIcon, Clock = FallbackIcon, Calendar = FallbackIcon, User = FallbackIcon, 
    Database = FallbackIcon, Activity = FallbackIcon, ArrowLeft = FallbackIcon, ArrowRight = FallbackIcon,
    Eye = FallbackIcon, RefreshCw = FallbackIcon, AlertCircle = FallbackIcon, Info = FallbackIcon,
    Plus = FallbackIcon, Edit = FallbackIcon, Trash2 = FallbackIcon, Box = FallbackIcon, Search = FallbackIcon
  } = LucideIcons;

  const SystemLog = ({ language = 'fa' }) => {
    const FallbackComponent = () => null;
    const Core = window.DSCore || window.DesignSystem || {};
    const { 
      Button = FallbackComponent, PageHeader = FallbackComponent, Badge = FallbackComponent 
    } = Core;
    
    const Grid = window.DSGrid || window.DesignSystem || {};
    const { DataGrid = FallbackComponent, AdvancedFilter = FallbackComponent } = Grid;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Modal = FallbackComponent, Toast = FallbackComponent } = Feedback;

    const formatGlobalDate = Core.formatGlobalDate || ((v) => v);
    const useCalendarMode = Core.useCalendarMode || (() => 'jalali');

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    const globalCalendarMode = useCalendarMode();

    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [gridState, setGridState] = useState(null);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
    
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const supabase = window.supabase;

    const showToast = useCallback((message, type = 'info') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        if (!supabase) throw new Error("Supabase is not initialized");
        const { data, error } = await supabase
          .from('fm_record_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(5000);
          
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Fetch logs error:", err);
        showToast(t('خطا در دریافت لاگ‌های سیستم', 'Error fetching system logs'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchLogs();
    }, []);

    const getEntityLabel = useCallback((entity) => {
        const labels = {
            'fm_currencies': t('تنظیمات ارزها', 'Currencies'),
            'fm_currency_rates': t('سوابق نرخ ارزها', 'Currency Rates'),
            'fm_record_logs': t('لاگ سیستم', 'System Logs'),
            'menus': t('منوهای سیستم', 'System Menus'),
            'users': t('کاربران', 'Users'),
        };
        return labels[entity] || entity;
    }, [t]);

    const getActionType = (actionStr) => {
        const act = String(actionStr).toUpperCase();
        if (act === 'CREATE' || act === 'ایجاد') return 'CREATE';
        if (act === 'UPDATE' || act === 'ویرایش') return 'UPDATE';
        if (act === 'DELETE' || act === 'حذف') return 'DELETE';
        return 'OTHER';
    };

    const getActionBadge = useCallback((action) => {
        const type = getActionType(action);
        if (type === 'CREATE') return <Badge variant="emerald" size="sm" className="w-16 justify-center shadow-sm">{t('ایجاد', 'CREATE')}</Badge>;
        if (type === 'UPDATE') return <Badge variant="amber" size="sm" className="w-16 justify-center shadow-sm">{t('ویرایش', 'UPDATE')}</Badge>;
        if (type === 'DELETE') return <Badge variant="rose" size="sm" className="w-16 justify-center shadow-sm">{t('حذف', 'DELETE')}</Badge>;
        return <Badge variant="slate" size="sm" className="w-16 justify-center shadow-sm">{action}</Badge>;
    }, [t]);

    const filteredLogs = useMemo(() => {
        let result = [...logs];
        
        if (filters.user_name) {
            const term = filters.user_name.toLowerCase();
            result = result.filter(r => (r.user_name || '').toLowerCase().includes(term));
        }
        if (filters.entity_type) {
            result = result.filter(r => r.entity_type === filters.entity_type);
        }
        if (filters.action) {
            result = result.filter(r => getActionType(r.action) === filters.action);
        }
        if (filters.details) {
            const term = filters.details.toLowerCase();
            result = result.filter(r => (r.details || '').toLowerCase().includes(term));
        }
        if (filters.fromDate) {
            const fromDateHyphen = filters.fromDate.replace(/\//g, '-');
            result = result.filter(r => {
                const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
                return dateStr >= fromDateHyphen;
            });
        }
        if (filters.toDate) {
            const toDateHyphen = filters.toDate.replace(/\//g, '-');
            result = result.filter(r => {
                const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
                return dateStr <= toDateHyphen;
            });
        }
        
        return result;
    }, [logs, filters]);

    const uniqueEntities = useMemo(() => {
        const entities = new Set(logs.map(l => l.entity_type).filter(Boolean));
        return Array.from(entities).map(e => ({ value: e, label: getEntityLabel(e) }));
    }, [logs, getEntityLabel]);

    const viewConfig = {
      pageId: 'system_logs_main',
      currentState: () => ({ filters, gridState }),
      onApplyState: (state) => {
        if (state) {
          if (state.filters) setFilters(state.filters);
          if (state.gridState) setGridState(state.gridState);
        } else {
          setFilters({});
          setGridState(null);
        }
      }
    };

    const columns = [
      { 
        field: 'timestamp', header_fa: 'تاریخ و زمان', header_en: 'Date & Time', width: '150px', 
        render: (v) => {
          if (!v) return '';
          const d = new Date(v);
          const formattedDate = formatGlobalDate ? formatGlobalDate(v, globalCalendarMode) : d.toISOString().split('T')[0].replace(/-/g, '/');
          return (
             <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
               <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
               <span className="font-mono text-[11px] font-medium" dir="ltr">{formattedDate}</span>
               <Clock size={12} className="text-slate-400 dark:text-slate-500 ml-1" />
               <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600" dir="ltr">
                  {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}
               </span>
             </div>
          );
        }
      },
      { 
        field: 'user_name', header_fa: 'کاربر', header_en: 'User', width: '140px', 
        render: (v) => (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    <User size={10} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200 truncate">{v}</span>
            </div>
        )
      },
      { 
        field: 'action', header_fa: 'عملیات', header_en: 'Action', width: '100px', 
        render: (v) => getActionBadge(v) 
      },
      { 
        field: 'entity_type', header_fa: 'موجودیت (بخش)', header_en: 'Entity Module', width: '150px', 
        render: (v) => (
            <div className="flex items-center gap-1.5">
                <Database size={12} className="text-slate-400 dark:text-slate-500" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{getEntityLabel(v)}</span>
            </div>
        )
      },
      { 
        field: 'details', header_fa: 'شرح جزئیات', header_en: 'Details', width: 'auto', minWidth: '250px',
        render: (v) => <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block w-full">{v || '-'}</span> 
      }
    ];

    const getFieldLabel = (key) => {
        const labels = {
          code: t('کد ارز', 'Currency Code'),
          title: t('عنوان', 'Title'),
          symbol: t('نماد', 'Symbol'),
          is_active: t('وضعیت فعالیت', 'Status'),
          fetch_type: t('نحوه دریافت', 'Fetch Type'),
          decimal_places: t('اعشار', 'Decimals'),
          targets: t('ارزهای هدف', 'Targets'),
          rate: t('نرخ تبدیل', 'Exchange Rate'),
          rate_date: t('تاریخ نرخ', 'Rate Date'),
          source: t('منبع اطلاعات', 'Source'),
          base_currency: t('ارز پایه', 'Base Currency'),
          target_currency: t('ارز هدف', 'Target Currency'),
          created_by: t('ایجاد کننده', 'Created By'),
          updated_by: t('ویرایش کننده', 'Updated By'),
          created_at: t('تاریخ ایجاد', 'Created At'),
          updated_at: t('تاریخ ویرایش', 'Updated At'),
          id: t('شناسه رکورد', 'Record ID')
        };
        return labels[key] || key;
    };

    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return t('خالی', 'Empty');
        if (typeof val === 'boolean') return val ? t('بله (فعال)', 'Yes (Active)') : t('خیر (غیرفعال)', 'No (Inactive)');
        if (Array.isArray(val)) return val.length ? val.join('، ') : t('بدون مقدار', 'No Value');
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const renderLogDetails = () => {
        if (!selectedLog) return null;
        
        const type = getActionType(selectedLog.action);
        const d = new Date(selectedLog.timestamp);
        const formattedDate = formatGlobalDate ? formatGlobalDate(selectedLog.timestamp, globalCalendarMode) : d.toISOString().split('T')[0];
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        const renderDiffs = () => {
            if (!selectedLog.old_data && !selectedLog.new_data) return (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 mt-4">
                    <Box size={32} className="opacity-40 mb-2" />
                    <span className="text-[11px] font-bold">{t('اطلاعات دقیق ساختاری برای این لاگ ثبت نشده است.', 'No structural data recorded for this log.')}</span>
                </div>
            );
            
            if (type === 'UPDATE' && selectedLog.old_data && selectedLog.new_data) {
                const changes = [];
                Object.keys(selectedLog.new_data).forEach(key => {
                    if (['updated_at', 'updated_by', 'created_at', 'created_by'].includes(key)) return;
                    const oldVal = selectedLog.old_data[key];
                    const newVal = selectedLog.new_data[key];
                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        changes.push({ key, oldVal, newVal });
                    }
                });
                
                if (changes.length === 0) return (
                    <div className="p-4 mt-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-[11px] text-slate-500 font-bold">
                        {t('هیچ تغییر مقداری در فیلدها یافت نشد.', 'No value changes found in fields.')}
                    </div>
                );

                return (
                    <div className="mt-6 flex flex-col gap-3">
                        <h4 className="text-[12px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 px-1 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <Edit size={14} className="text-amber-500" />
                            {t('فیلدهای تغییر یافته:', 'Changed Fields:')}
                        </h4>
                        <div className="flex flex-col gap-2">
                            {changes.map(c => (
                                <div key={c.key} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-full sm:w-1/4 font-black text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                        {getFieldLabel(c.key)}
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 sm:p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex-1 w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 px-2 py-1.5 rounded-md text-[11px] font-medium break-words">
                                            <span className="text-[9px] uppercase font-black opacity-60 block mb-0.5">{t('مقدار قبلی', 'Old Value')}</span>
                                            {formatValue(c.oldVal)}
                                        </div>
                                        <div className="shrink-0 text-slate-300 dark:text-slate-600 self-center hidden sm:block">
                                            {isRtl ? <ArrowLeft size={16} strokeWidth={2.5}/> : <ArrowRight size={16} strokeWidth={2.5}/>}
                                        </div>
                                        <div className="shrink-0 text-slate-300 dark:text-slate-600 self-center sm:hidden rotate-90">
                                            {isRtl ? <ArrowLeft size={16} strokeWidth={2.5}/> : <ArrowRight size={16} strokeWidth={2.5}/>}
                                        </div>
                                        <div className="flex-1 w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-2 py-1.5 rounded-md text-[11px] font-black break-words">
                                            <span className="text-[9px] uppercase font-black opacity-60 block mb-0.5">{t('مقدار جدید', 'New Value')}</span>
                                            {formatValue(c.newVal)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            
            if (type === 'DELETE' && selectedLog.old_data) {
                return (
                    <div className="mt-6 flex flex-col gap-3">
                        <h4 className="text-[12px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 px-1 border-b border-rose-100 dark:border-rose-900/30 pb-2">
                            <Trash2 size={14} />
                            {t('اطلاعات رکورد حذف شده:', 'Deleted Record Data:')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                            {Object.keys(selectedLog.old_data).filter(k => !['updated_at', 'updated_by', 'created_at', 'created_by'].includes(k)).map(key => (
                                <div key={key} className="flex flex-col bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{getFieldLabel(key)}</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 break-words">{formatValue(selectedLog.old_data[key])}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            if (type === 'CREATE' && selectedLog.new_data) {
                return (
                    <div className="mt-6 flex flex-col gap-3">
                        <h4 className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-1 border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
                            <Plus size={14} />
                            {t('اطلاعات رکورد ایجاد شده:', 'Created Record Data:')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            {Object.keys(selectedLog.new_data).filter(k => !['updated_at', 'updated_by', 'created_at', 'created_by'].includes(k)).map(key => (
                                <div key={key} className="flex flex-col bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{getFieldLabel(key)}</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 break-words">{formatValue(selectedLog.new_data[key])}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            return null;
        };

        return (
            <div className="flex flex-col h-full font-sans">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-sm">
                            <Activity size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-[14px] text-slate-800 dark:text-slate-100">{getActionBadge(selectedLog.action)}</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"><Database size={12}/> {getEntityLabel(selectedLog.entity_type)}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{t('شناسه رکورد:', 'Record ID:')} {selectedLog.record_id}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            <User size={12} className="text-slate-400" />
                            {selectedLog.user_name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {formattedDate}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {timeStr}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {selectedLog.details && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3.5 flex items-start gap-3">
                            <Info size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">{t('شرح عملیات', 'Operation Details')}</span>
                                <span className="text-[12px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium">{selectedLog.details}</span>
                            </div>
                        </div>
                    )}
                    
                    {renderDiffs()}
                </div>
            </div>
        );
    };

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت لاگ‌های سیستم', 'System Logs Management')}
          icon={History} language={language}
          breadcrumbs={[{ label: t('حقوق دسترسی', 'Access Rights') }, { label: t('لاگ‌ها', 'Logs') }]}
          viewConfig={viewConfig}
        >
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchLogs} className="shadow-sm bg-white dark:bg-slate-800">
                {t('بروزرسانی داده‌ها', 'Refresh Data')}
            </Button>
        </PageHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in duration-500 mt-2">
            <AdvancedFilter 
                fields={[
                  { name: 'user_name', label: t('کاربر تغییر دهنده', 'User'), type: 'text' },
                  { name: 'entity_type', label: t('موجودیت', 'Entity'), type: 'select', options: uniqueEntities },
                  { name: 'action', label: t('نوع عملیات', 'Action'), type: 'select', options: [
                      {value: 'CREATE', label: t('ایجاد', 'Create')},
                      {value: 'UPDATE', label: t('ویرایش', 'Update')},
                      {value: 'DELETE', label: t('حذف', 'Delete')}
                  ]},
                  { name: 'details', label: t('شرح جزئیات', 'Details Text'), type: 'text' },
                  { name: 'fromDate', label: t('از تاریخ', 'From Date'), type: 'date' },
                  { name: 'toDate', label: t('تا تاریخ', 'To Date'), type: 'date' }
                ]}
                initialValues={filters}
                onFilter={setFilters}
                onClear={() => setFilters({})}
                language={language}
            />
            
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col mt-4">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-[12px]">{t('در حال دریافت اطلاعات لاگ...', 'Loading logs data...')}</span>
                    </div>
                ) : (
                    <DataGrid 
                        data={filteredLogs} 
                        columns={columns} 
                        language={language}
                        selectable={false}
                        gridState={gridState}
                        onGridStateChange={setGridState}
                        actions={[
                            { 
                                icon: Eye, 
                                tooltip: t('مشاهده جزئیات دقیق', 'View Detailed Info'), 
                                onClick: (row) => { setSelectedLog(row); setIsDetailModalOpen(true); }, 
                                className: 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg' 
                            }
                        ]}
                        onRowDoubleClick={(row) => { setSelectedLog(row); setIsDetailModalOpen(true); }}
                    />
                )}
            </div>
        </div>

        <Modal 
            isOpen={isDetailModalOpen} 
            onClose={() => setIsDetailModalOpen(false)} 
            title={t('جزئیات دقیق تغییرات رکورد', 'Detailed Record Changes')} 
            language={language} 
            width="max-w-4xl"
        >
            {renderLogDetails()}
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.SystemLog = SystemLog;
})();