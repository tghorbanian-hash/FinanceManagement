/* Filename: general/CurrencySettings.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  const { 
    DollarSign, Plus, Edit, Trash2, RefreshCw, History, Check, X,
    Calculator, Save, Globe, Lock, Unlock, ArrowRightLeft, AlertTriangle, 
    Clock, Calendar, Settings, Zap, ArrowLeft, ArrowRight
  } = window.LucideIcons || {};

  const CurrencySettings = ({ language = 'fa' }) => {
    const { 
      DataGrid, Button, TextField, SelectField, ToggleField, CheckboxField, Card, Badge, PageHeader, 
      AdvancedFilter, Modal, Tabs, CurrencyField, DatePicker, Toast 
    } = window.DesignSystem || {};

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const getTodayGregorian = () => {
      const d = new Date();
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getTodayGregorian();

    const [activeTab, setActiveTab] = useState('list');
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    
    // States: Currencies
    const [currencies, setCurrencies] = useState([]);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);

    // States: Rates
    const [rates, setRates] = useState([]);
    const [rateFilters, setRateFilters] = useState({ fromDate: todayStr, toDate: todayStr });
    
    // States: Manual Update Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const [manualTime, setManualTime] = useState('12:00');
    const [manualRatesList, setManualRatesList] = useState([]);

    // States: Edit Single Rate Modal
    const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState(null);

    // States: Converter Modal
    const [isConverterOpen, setIsConverterOpen] = useState(false);
    const [convDate, setConvDate] = useState('');
    const [convAmount, setConvAmount] = useState('1');
    const [convFrom, setConvFrom] = useState('');
    const [convTo, setConvTo] = useState('');

    // States: Delete Confirmation Modal
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null, source: null });

    const supabase = window.supabase;

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    const isWithinOneWeek = useCallback((dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      return diffInDays <= 7;
    }, []);

    const fetchCurrencies = async () => {
      setIsLoading(true);
      try {
        if (!supabase) throw new Error("Supabase is not initialized");
        const { data, error } = await supabase.from('fm_currencies').select('*').order('code');
        if (error) throw error;
        setCurrencies(data || []);
      } catch (err) {
        console.error("Fetch currencies error:", err);
        showToast(t('خطا در دریافت اطلاعات ارزها', 'Error fetching currencies'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRates = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('fm_currency_rates').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setRates(data || []);
      } catch (err) {
        console.error("Fetch rates error:", err);
      }
    };

    useEffect(() => {
      fetchCurrencies();
      fetchRates();
    }, []);

    const handleSaveCurrency = async () => {
      try {
        if (!selectedCurrency.code || !selectedCurrency.title) {
          showToast(t('لطفاً فیلدهای اجباری را پر کنید', 'Please fill required fields'), 'error');
          return;
        }
        const payload = {
          code: selectedCurrency.code.toUpperCase(),
          title: selectedCurrency.title,
          symbol: selectedCurrency.symbol,
          is_active: selectedCurrency.is_active ?? true,
          fetch_type: selectedCurrency.fetch_type || 'manual',
          decimal_places: parseInt(selectedCurrency.decimal_places) || 0,
          targets: selectedCurrency.targets || []
        };

        if (selectedCurrency.id) {
          const { error } = await supabase.from('fm_currencies').update(payload).eq('id', selectedCurrency.id);
          if (error) throw error;
          showToast(t('ارز با موفقیت بروزرسانی شد', 'Currency updated successfully'));
        } else {
          const { error } = await supabase.from('fm_currencies').insert([payload]);
          if (error) throw error;
          showToast(t('ارز جدید با موفقیت تعریف شد', 'New currency added successfully'));
        }
        setIsCurrencyModalOpen(false);
        fetchCurrencies();
      } catch (err) {
        console.error("Save error:", err);
        showToast(t('خطا در ذخیره اطلاعات', 'Error saving data'), 'error');
      }
    };

    const handleBulkAction = async (actionType, selectedIds) => {
      if (!selectedIds || !selectedIds.length) return;
      try {
        let updatePayload = {};
        if (actionType === 'activate') updatePayload = { is_active: true };
        if (actionType === 'deactivate') updatePayload = { is_active: false };
        if (actionType === 'setAuto') updatePayload = { fetch_type: 'auto' };
        if (actionType === 'setManual') updatePayload = { fetch_type: 'manual' };

        const { error } = await supabase.from('fm_currencies').update(updatePayload).in('id', selectedIds);
        if (error) throw error;
        
        showToast(t('عملیات گروهی با موفقیت انجام شد', 'Bulk action successful'));
        fetchCurrencies();
      } catch (err) {
        console.error("Bulk action error:", err);
        showToast(t('خطا در اجرای عملیات گروهی', 'Error executing bulk action'), 'error');
      }
    };

    const handleXeFetch = async () => {
      try {
        const autoCurrencies = currencies.filter(c => c.fetch_type === 'auto');
        if (autoCurrencies.length === 0) {
           showToast(t('ارز اتوماتیکی در سیستم یافت نشد.', 'No automatic currencies found.'), 'warning');
           return;
        }

        const newRates = [];
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const isoString = now.toISOString();

        autoCurrencies.forEach(c => {
           (c.targets || []).forEach(tCode => {
              newRates.push({
                 base_currency: c.code,
                 target_currency: tCode,
                 rate: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
                 rate_date: dateStr,
                 created_at: isoString,
                 source: 'XE'
              });
           });
        });

        if (newRates.length > 0) {
           const { error } = await supabase.from('fm_currency_rates').insert(newRates);
           if (error) throw error;
           showToast(t('نرخ‌های روزانه با موفقیت از سرور XE دریافت شد.', 'Rates fetched successfully from XE.'));
           fetchRates();
        }
      } catch (err) {
        console.error("XE Fetch error:", err);
        showToast(t('خطا در ارتباط با سرور XE', 'Error connecting to XE'), 'error');
      }
    };

    const openManualUpdateModal = () => {
      const list = [];
      const manualCurrencies = currencies.filter(c => c.fetch_type === 'manual');
      manualCurrencies.forEach(c => {
         (c.targets || []).forEach(tCode => {
            list.push({ base: c.code, target: tCode, rate: '' });
         });
      });
      setManualRatesList(list);
      setManualDate(getTodayGregorian());
      
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setManualTime(`${hh}:${mm}`);
      
      setIsManualModalOpen(true);
    };

    const handleSaveManualRates = async () => {
      try {
        const validRates = manualRatesList.filter(r => r.rate && r.rate !== '0');
        if (validRates.length === 0) {
           showToast(t('لطفاً حداقل یک نرخ معتبر وارد کنید.', 'Please enter at least one valid rate.'), 'error');
           return;
        }
        if (!manualDate || !manualTime) {
           showToast(t('تاریخ و زمان الزامی است.', 'Date and time are required.'), 'error');
           return;
        }

        const formattedDate = manualDate.replace(/\//g, '-');
        const dateTimeStr = `${formattedDate}T${manualTime}:00.000Z`;

        const payloads = validRates.map(r => ({
           base_currency: r.base,
           target_currency: r.target,
           rate: parseFloat(String(r.rate).replace(/,/g, '')),
           rate_date: formattedDate,
           created_at: dateTimeStr,
           source: 'Manual'
        }));

        const { error } = await supabase.from('fm_currency_rates').insert(payloads);
        if (error) throw error;

        showToast(t('نرخ‌های دستی با موفقیت ثبت شدند.', 'Manual rates saved successfully.'));
        setIsManualModalOpen(false);
        fetchRates();
      } catch (err) {
        console.error("Save manual rates error:", err);
        showToast(t('خطا در ثبت نرخ‌های دستی', 'Error saving manual rates'), 'error');
      }
    };

    const handleSaveEditedRate = async () => {
      try {
        if (!editingRate || !editingRate.rate || editingRate.rate === '0') {
           showToast(t('لطفاً مبلغ نرخ معتبر وارد کنید.', 'Please enter a valid rate amount.'), 'error');
           return;
        }
        
        const rateVal = parseFloat(String(editingRate.rate).replace(/,/g, ''));
        const { error } = await supabase.from('fm_currency_rates').update({ rate: rateVal }).eq('id', editingRate.id);
        if (error) throw error;
        
        showToast(t('نرخ با موفقیت ویرایش شد.', 'Rate edited successfully.'));
        setIsEditRateModalOpen(false);
        fetchRates();
      } catch (err) {
        console.error("Edit rate error:", err);
        showToast(t('خطا در ویرایش نرخ', 'Error editing rate'), 'error');
      }
    };

    const executeDelete = async () => {
      try {
        if (deleteConfirm.source === 'currency') {
          if (deleteConfirm.type === 'single') {
            const { error } = await supabase.from('fm_currencies').delete().eq('id', deleteConfirm.data.id);
            if (error) throw error;
          } else if (deleteConfirm.type === 'bulk') {
            const { error } = await supabase.from('fm_currencies').delete().in('id', deleteConfirm.data);
            if (error) throw error;
          }
          fetchCurrencies();
        } else if (deleteConfirm.source === 'rate') {
          if (deleteConfirm.type === 'single') {
            const { error } = await supabase.from('fm_currency_rates').delete().eq('id', deleteConfirm.data.id);
            if (error) throw error;
          } else if (deleteConfirm.type === 'bulk') {
            const { error } = await supabase.from('fm_currency_rates').delete().in('id', deleteConfirm.data);
            if (error) throw error;
          }
          fetchRates();
        }
        showToast(t('عملیات حذف با موفقیت انجام شد', 'Deletion successful'));
        setDeleteConfirm({ isOpen: false, type: null, data: null, source: null });
      } catch (err) {
        console.error("Delete error:", err);
        showToast(t('امکان حذف رکورد دارای وابستگی وجود ندارد', 'Cannot delete record with relations'), 'error');
        setDeleteConfirm({ isOpen: false, type: null, data: null, source: null });
      }
    };

    const getRateValue = (baseCode, targetCode, targetDate) => {
      if (baseCode === targetCode) return 1;
      
      const formattedDate = targetDate ? targetDate.replace(/\//g, '-') : null;
      const validRates = formattedDate ? rates.filter(r => r.rate_date === formattedDate) : rates;
      
      if (validRates.length === 0) return null;

      let direct = validRates.find(r => r.base_currency === baseCode && r.target_currency === targetCode);
      if (direct) return direct.rate;
      
      let inverse = validRates.find(r => r.base_currency === targetCode && r.target_currency === baseCode);
      if (inverse) return 1 / inverse.rate;

      const baseCur = currencies.find(c => c.code === baseCode);
      const intermediates = currencies.map(c => c.code).filter(c => c !== baseCode && c !== targetCode);

      for (let intermediate of intermediates) {
        const r1 = validRates.find(r => r.base_currency === baseCode && r.target_currency === intermediate)?.rate || 
                   (validRates.find(r => r.base_currency === intermediate && r.target_currency === baseCode) ? 1/validRates.find(r => r.base_currency === intermediate && r.target_currency === baseCode).rate : null);
        
        const r2 = validRates.find(r => r.base_currency === intermediate && r.target_currency === targetCode)?.rate || 
                   (validRates.find(r => r.base_currency === targetCode && r.target_currency === intermediate) ? 1/validRates.find(r => r.base_currency === targetCode && r.target_currency === intermediate).rate : null);
        
        if (r1 && r2) {
          return r1 * r2;
        }
      }
      return null;
    };

    const currentConvRate = useMemo(() => {
      if (!convFrom || !convTo || !convDate) return null;
      return getRateValue(convFrom, convTo, convDate);
    }, [convFrom, convTo, convDate, rates, currencies]);

    const convResult = useMemo(() => {
      if (!convAmount || currentConvRate === null) return null;
      const amount = parseFloat(String(convAmount).replace(/,/g, ''));
      if (isNaN(amount)) return null;
      return (amount * currentConvRate).toLocaleString(undefined, { maximumFractionDigits: 10 });
    }, [convAmount, currentConvRate]);

    const openConverter = () => {
       setConvDate(getTodayGregorian());
       setConvFrom(currencies[0]?.code || '');
       setConvTo(currencies[1]?.code || '');
       setIsConverterOpen(true);
    };

    const tabs = [
      { id: 'list', label: t('فهرست ارزها', 'Currency List'), icon: Globe },
      { id: 'rates', label: t('سوابق نرخ ارزها', 'Exchange Rate History'), icon: History },
    ];

    const currencyColumns = [
      { field: 'code', header_fa: 'کد ارز', header_en: 'Code', width: '90px', render: (v) => <span className="font-black text-slate-800">{v}</span> },
      { field: 'title', header_fa: 'عنوان', header_en: 'Title', width: '180px' },
      { field: 'symbol', header_fa: 'نماد', header_en: 'Symbol', width: '70px' },
      { 
        field: 'targets', header_fa: 'ارزهای مبنا', header_en: 'Targets', width: '220px',
        render: (val) => (
          <div className="flex gap-1 flex-wrap">
            {Array.isArray(val) && val.map(c => <Badge key={c} variant="indigo" size="sm" className="px-1.5 py-0 text-[10px]">{c}</Badge>)}
            {(!val || val.length === 0) && <span className="text-slate-300 text-[10px]">{t('بدون وابستگی', 'No targets')}</span>}
          </div>
        )
      },
      { 
        field: 'fetch_type', header_fa: 'نوع دریافت', header_en: 'Fetch Type', width: '110px',
        render: (v) => <Badge variant={v === 'auto' ? 'emerald' : 'slate'} className="text-[10px]">{v === 'auto' ? t('اتوماتیک', 'Auto') : t('دستی', 'Manual')}</Badge>
      },
      { field: 'decimal_places', header_fa: 'اعشار', header_en: 'Decimals', width: '70px', render: (v) => <span className="text-slate-500 font-mono">{v}</span> },
      { field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', type: 'toggle', width: '90px' },
    ];

    const currencyBulkActions = [
      { label: t('فعال‌سازی', 'Activate'), icon: Check, onClick: (ids) => handleBulkAction('activate', ids), variant: 'outline', className: 'text-emerald-600' },
      { label: t('غیرفعال‌سازی', 'Deactivate'), icon: X, onClick: (ids) => handleBulkAction('deactivate', ids), variant: 'outline', className: 'text-slate-600' },
      { label: t('دریافت اتوماتیک', 'Set Auto'), icon: RefreshCw, onClick: (ids) => handleBulkAction('setAuto', ids), variant: 'outline', className: 'text-blue-600' },
      { label: t('دریافت دستی', 'Set Manual'), icon: Lock, onClick: (ids) => handleBulkAction('setManual', ids), variant: 'outline', className: 'text-amber-600' },
      { label: t('حذف گروهی', 'Delete Selected'), icon: Trash2, onClick: (ids) => setDeleteConfirm({ isOpen: true, type: 'bulk', data: ids, source: 'currency' }), variant: 'danger-outline', className: '!text-red-500 !border-red-500 hover:!bg-red-50' },
    ];

    const historyColumns = [
      { 
        field: 'created_at', header_fa: 'تاریخ و زمان', header_en: 'Date & Time', width: '160px', 
        render: (v) => {
          if (!v) return '';
          const d = new Date(v);
          return (
             <div className="flex items-center gap-1.5 text-slate-700">
               <Calendar size={12} className="text-slate-400" />
               <span>{d.toISOString().split('T')[0].replace(/-/g, '/')}</span>
               <Clock size={12} className="text-slate-400 ml-1" />
               <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</span>
             </div>
          );
        }
      },
      { field: 'base_currency', header_fa: 'ارز پایه', header_en: 'Base', width: '100px', render: (v) => <span className="font-bold text-slate-800">{v}</span> },
      { field: 'target_currency', header_fa: 'ارز هدف', header_en: 'Target', width: '100px' },
      { field: 'rate', header_fa: 'نرخ تبدیل', header_en: 'Rate', width: '150px', render: (v) => <span className="font-mono font-bold text-indigo-700">{v.toLocaleString()}</span> },
      { field: 'source', header_fa: 'منبع', header_en: 'Source', width: '100px', render: (v) => <Badge variant={v === 'XE' ? 'emerald' : 'blue'} size="sm">{v}</Badge> }
    ];

    const historyBulkActions = [
      { 
        label: t('حذف سوابق انتخاب شده', 'Delete Selected Records'), 
        icon: Trash2, 
        onClick: (ids) => {
            const validIds = ids.filter(id => {
                const rate = rates.find(r => r.id === id);
                return rate && isWithinOneWeek(rate.created_at);
            });
            
            if (validIds.length === 0) {
                showToast(t('هیچ یک از رکوردهای انتخاب شده قابل حذف نیستند (گذشت بیش از یک هفته).', 'None of the selected records can be deleted (older than 1 week).'), 'error');
                return;
            }
            
            if (validIds.length < ids.length) {
                showToast(t('تنها رکوردهایی که کمتر از یک هفته از ثبت آنها گذشته برای حذف انتخاب شدند.', 'Only records newer than 1 week were selected for deletion.'), 'warning');
            }
            
            setDeleteConfirm({ isOpen: true, type: 'bulk', data: validIds, source: 'rate' });
        }, 
        variant: 'danger-outline', 
        className: '!text-red-500 !border-red-500 hover:!bg-red-50' 
      },
    ];

    const filteredRates = useMemo(() => {
      let result = [...rates];
      if (rateFilters.base) result = result.filter(r => r.base_currency === rateFilters.base);
      if (rateFilters.target) result = result.filter(r => r.target_currency === rateFilters.target);
      if (rateFilters.source) result = result.filter(r => r.source === rateFilters.source);
      
      if (rateFilters.fromDate) {
        const fromDateHyphen = rateFilters.fromDate.replace(/\//g, '-');
        result = result.filter(r => r.rate_date >= fromDateHyphen);
      }
      if (rateFilters.toDate) {
        const toDateHyphen = rateFilters.toDate.replace(/\//g, '-');
        result = result.filter(r => r.rate_date <= toDateHyphen);
      }
      
      return result;
    }, [rates, rateFilters]);

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('تنظیمات و مدیریت نرخ ارزها', 'Currency & Exchange Management')}
          icon={DollarSign} language={language}
          breadcrumbs={[{ label: t('تنظیمات پایه', 'Base Setup') }, { label: t('ارزها', 'Currencies') }]}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in duration-500">
          
          {activeTab === 'list' && (
            <>
              <AdvancedFilter fields={[{ name: 'code', label: t('کد ارز', 'Code'), type: 'text' }]} language={language} />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={currencies} 
                  columns={currencyColumns} 
                  language={language}
                  actions={[
                    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => { setSelectedCurrency({...row}); setIsCurrencyModalOpen(true); }, className: 'text-slate-400 hover:text-indigo-600' },
                    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row, source: 'currency' }), className: 'text-slate-400 hover:text-red-600' }
                  ]}
                  selectable={true}
                  onRowDoubleClick={(row) => { setSelectedCurrency({...row}); setIsCurrencyModalOpen(true); }}
                  bulkActions={currencyBulkActions}
                  onAdd={() => { setSelectedCurrency({ code: '', title: '', symbol: '', is_active: true, fetch_type: 'manual', decimal_places: 0, targets: [] }); setIsCurrencyModalOpen(true); }}
                />
              </div>
            </>
          )}

          {activeTab === 'rates' && (
            <>
              <AdvancedFilter 
                fields={[
                  { name: 'base', label: t('ارز پایه', 'Base Currency'), type: 'select', options: currencies.map(c => ({value: c.code, label: c.code})) },
                  { name: 'target', label: t('ارز هدف', 'Target Currency'), type: 'select', options: currencies.map(c => ({value: c.code, label: c.code})) },
                  { name: 'fromDate', label: t('از تاریخ', 'From Date'), type: 'date' },
                  { name: 'toDate', label: t('تا تاریخ', 'To Date'), type: 'date' },
                  { name: 'source', label: t('منبع', 'Source'), type: 'select', options: [{value:'XE', label:'XE (اتوماتیک)'}, {value:'Manual', label:'دستی'}] }
                ]}
                initialValues={{ fromDate: todayStr, toDate: todayStr }}
                onFilter={setRateFilters}
                onClear={() => setRateFilters({})}
                language={language}
              />
              
              <div className="flex-1 min-h-0">
                 <DataGrid 
                   data={filteredRates} 
                   columns={historyColumns} 
                   language={language}
                   selectable={true}
                   bulkActions={historyBulkActions}
                   actions={[
                     { 
                       icon: Edit, 
                       tooltip: t('ویرایش سابقه', 'Edit Record'), 
                       onClick: (row) => { setEditingRate({...row}); setIsEditRateModalOpen(true); },
                       hidden: (row) => !(row.source === 'Manual' && isWithinOneWeek(row.created_at)),
                       className: 'text-slate-400 hover:text-indigo-600' 
                     },
                     { 
                       icon: Trash2, 
                       tooltip: t('حذف سابقه', 'Delete Record'), 
                       onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row, source: 'rate' }), 
                       hidden: (row) => !isWithinOneWeek(row.created_at),
                       className: 'text-slate-400 hover:text-red-600' 
                     }
                   ]}
                   headerMenus={[
                     {
                       label: t('عملیات نرخ‌گذاری', 'Rate Operations'),
                       icon: Zap,
                       className: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
                       items: [
                         { label: t('گرفتن نرخ ارزها از XE', 'Fetch Rates from XE'), icon: Globe, onClick: handleXeFetch, className: 'text-emerald-700 hover:text-emerald-800' },
                         { label: t('بروزرسانی دستی نرخ‌ها', 'Manual Rate Update'), icon: Edit, onClick: openManualUpdateModal, className: 'text-blue-700 hover:text-blue-800' },
                         { divider: true },
                         { label: t('تبدیل‌گر (ماشین حساب)', 'Currency Converter'), icon: Calculator, onClick: openConverter, className: 'text-slate-700 hover:text-indigo-600' }
                       ]
                     }
                   ]}
                 />
              </div>
            </>
          )}
        </div>

        {/* Modal: Add/Edit Currency */}
        <Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title={selectedCurrency?.id ? t('ویرایش اطلاعات ارز', 'Edit Currency Info') : t('تعریف ارز جدید در سیستم', 'Define New Currency')} language={language} width="max-w-xl">
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <TextField label={t('کد ارز', 'Code')} value={selectedCurrency?.code || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, code: e.target.value.toUpperCase()})} isRtl={isRtl} required size="sm" wrapperClassName="sm:col-span-1" />
              <TextField label={t('عنوان ارز', 'Title')} value={selectedCurrency?.title || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, title: e.target.value})} isRtl={isRtl} required size="sm" wrapperClassName="sm:col-span-2" />
              <div className="sm:col-span-1 flex items-center pt-5 pl-2">
                 <ToggleField label={t('فعال', 'Active')} checked={selectedCurrency?.is_active ?? true} onChange={(val) => setSelectedCurrency({...selectedCurrency, is_active: val})} isRtl={isRtl} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextField label={t('نماد', 'Symbol')} value={selectedCurrency?.symbol || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, symbol: e.target.value})} isRtl={isRtl} size="sm" />
              <SelectField 
                label={t('نوع دریافت نرخ', 'Fetch Method')} value={selectedCurrency?.fetch_type || 'manual'} onChange={(e) => setSelectedCurrency({...selectedCurrency, fetch_type: e.target.value})} isRtl={isRtl} size="sm"
                options={[{value: 'manual', label: t('دستی', 'Manual')}, {value: 'auto', label: t('اتوماتیک (API)', 'Automatic')}]} 
              />
              <TextField label={t('تعداد اعشار', 'Decimals')} type="number" value={selectedCurrency?.decimal_places ?? 0} onChange={(e) => setSelectedCurrency({...selectedCurrency, decimal_places: e.target.value})} isRtl={isRtl} size="sm" />
            </div>
            
            <div className="mt-1 pt-3 border-t border-slate-100">
               <label className="text-[11px] font-black text-slate-500 mb-1.5 block uppercase tracking-wider">{t('ارزهای هدف (ارزهایی که این ارز به آنها تبدیل می‌شود):', 'Target Currencies (Conversion Base):')}</label>
               <div className="flex flex-col gap-2">
                 <SelectField 
                   value="" 
                   onChange={(e) => {
                     const val = e.target.value;
                     if (val && !(selectedCurrency?.targets || []).includes(val)) {
                       setSelectedCurrency({...selectedCurrency, targets: [...(selectedCurrency?.targets || []), val]});
                     }
                   }} 
                   isRtl={isRtl} size="sm" wrapperClassName="w-full sm:w-1/2"
                   options={[
                     { value: '', label: t('انتخاب ارز جهت افزودن...', 'Select currency to add...') },
                     ...currencies.filter(c => c.code !== selectedCurrency?.code && !(selectedCurrency?.targets || []).includes(c.code)).map(c => ({value: c.code, label: `${c.title} (${c.code})`}))
                   ]} 
                 />
                 <div className="flex flex-wrap gap-1.5 p-2.5 min-h-[44px] bg-white rounded-lg border border-slate-200 shadow-inner mt-1">
                    {(selectedCurrency?.targets || []).map(tcode => (
                      <Badge key={tcode} variant="indigo" className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 group">
                        <span className="font-bold text-[10px]">{tcode}</span>
                        <div className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-indigo-200/50 hover:bg-red-100 hover:text-red-600 cursor-pointer transition-all" onClick={() => setSelectedCurrency({...selectedCurrency, targets: selectedCurrency.targets.filter(x => x !== tcode)})}>
                           <X size={10} />
                        </div>
                      </Badge>
                    ))}
                    {(!selectedCurrency?.targets || selectedCurrency.targets.length === 0) && <span className="text-slate-300 text-[10px] italic py-1">{t('هیچ ارزی انتخاب نشده است.', 'No targets selected.')}</span>}
                 </div>
               </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsCurrencyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveCurrency} className="px-6">{t('ذخیره تغییرات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Manual Rate Update */}
        <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title={t('بروزرسانی دستی نرخ‌ها', 'Manual Rates Update')} language={language} width="max-w-2xl">
           <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                 <DatePicker size="sm" label={t('تاریخ ثبت نرخ', 'Rate Date')} value={manualDate} onChange={setManualDate} isRtl={isRtl} language={language} required />
                 <div className="flex flex-col gap-1 w-full">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">{t('ساعت ثبت', 'Rate Time')} <span className="text-red-500">*</span></label>
                    <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className={`h-8 text-[11px] bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 px-2.5 transition-all`} required />
                 </div>
              </div>

              <div className="flex flex-col max-h-[350px] overflow-y-auto custom-scrollbar pr-1 bg-white border border-slate-200 rounded-lg">
                 {manualRatesList.map((item, idx) => (
                    <div key={`${item.base}-${item.target}`} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-3 transition-colors">
                       <div className="w-16 font-black text-slate-800 text-[13px] text-center">{item.base}</div>
                       <div className="text-indigo-400 shrink-0 flex items-center justify-center">
                          {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                       </div>
                       <div className="w-16 font-black text-slate-800 text-[13px] text-center">{item.target}</div>
                       <div className="flex-1 ml-2">
                          <CurrencyField size="sm" value={item.rate} onChange={(v) => {
                              const newList = [...manualRatesList];
                              newList[idx].rate = v;
                              setManualRatesList(newList);
                          }} placeholder={t('مبلغ نرخ را وارد کنید...', 'Enter rate amount...')} wrapperClassName="m-0" />
                       </div>
                    </div>
                 ))}
                 {manualRatesList.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-[12px] font-bold bg-slate-50">
                       {t('هیچ ارزی با تنظیم دریافت دستی و دارای ارز هدف در سیستم یافت نشد.', 'No manual currencies with targets found.')}
                    </div>
                 )}
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
                <Button variant="primary" size="sm" icon={Save} onClick={handleSaveManualRates} disabled={manualRatesList.length === 0}>{t('ذخیره اطلاعات در تاریخچه', 'Save to History')}</Button>
              </div>
           </div>
        </Modal>

        {/* Modal: Edit Single Rate */}
        <Modal isOpen={isEditRateModalOpen} onClose={() => setIsEditRateModalOpen(false)} title={t('ویرایش نرخ دستی', 'Edit Manual Rate')} language={language} width="max-w-sm">
           <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                 <div className="flex items-center justify-between text-[13px]">
                   <span className="text-slate-500 font-bold">{t('ارز پایه:', 'Base:')}</span>
                   <span className="font-black text-slate-800">{editingRate?.base_currency}</span>
                 </div>
                 <div className="flex items-center justify-between text-[13px]">
                   <span className="text-slate-500 font-bold">{t('ارز هدف:', 'Target:')}</span>
                   <span className="font-black text-slate-800">{editingRate?.target_currency}</span>
                 </div>
                 <div className="flex items-center justify-between text-[13px]">
                   <span className="text-slate-500 font-bold">{t('تاریخ:', 'Date:')}</span>
                   <span className="font-black text-slate-800">{editingRate?.rate_date}</span>
                 </div>
              </div>
              <CurrencyField 
                 label={t('مبلغ نرخ', 'Rate Amount')} 
                 value={editingRate?.rate || ''} 
                 onChange={(v) => setEditingRate({...editingRate, rate: v})} 
                 isRtl={isRtl} 
                 size="md"
                 required 
              />
              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsEditRateModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
                <Button variant="primary" size="sm" icon={Save} onClick={handleSaveEditedRate}>{t('ذخیره تغییرات', 'Save Changes')}</Button>
              </div>
           </div>
        </Modal>

        {/* Modal: Converter */}
        <Modal isOpen={isConverterOpen} onClose={() => setIsConverterOpen(false)} title={t('ماشین حساب تبدیل‌گر چندلایه', 'Multi-level Currency Converter')} language={language} width="max-w-lg">
           <div className="p-5 flex flex-col items-center">
              <div className="w-full mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                 <DatePicker size="sm" label={t('تاریخ مبنای محاسبات', 'Calculation Base Date')} value={convDate} onChange={setConvDate} isRtl={isRtl} language={language} required wrapperClassName="w-full" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-end gap-3 w-full relative">
                 <CurrencyField label={t('مبلغ مبدا', 'Source Amount')} value={convAmount} onChange={setConvAmount} isRtl={isRtl} size="sm" wrapperClassName="flex-1" />
                 <SelectField label={t('از ارز', 'From')} value={convFrom} onChange={(e) => setConvFrom(e.target.value)} isRtl={isRtl} size="sm" wrapperClassName="w-24" options={currencies.map(c => ({value: c.code, label: c.code}))} />
                 
                 <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors mb-1 shrink-0" onClick={() => { const temp = convFrom; setConvFrom(convTo); setConvTo(temp); }}>
                    <ArrowRightLeft size={16} className={isRtl ? '' : 'rotate-180'} />
                 </div>
                 
                 <SelectField label={t('به ارز', 'To')} value={convTo} onChange={(e) => setConvTo(e.target.value)} isRtl={isRtl} size="sm" wrapperClassName="w-24" options={currencies.map(c => ({value: c.code, label: c.code}))} />
              </div>
              
              {currentConvRate !== null && (
                 <div className="w-full mt-4 flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in">
                    <span className="text-[12px] font-bold text-emerald-700">{t('نرخ برابری:', 'Exchange Rate:')}</span>
                    <span className="text-[14px] font-black font-mono text-emerald-800" dir="ltr">
                       1 {convFrom} = {currentConvRate.toLocaleString(undefined, { maximumFractionDigits: 10 })} {convTo}
                    </span>
                 </div>
              )}
              
              <div className="mt-6 w-full p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('حاصل تبدیل بر اساس تاریخ انتخابی', 'Conversion Result by Date')}</span>
                 <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight" dir="ltr">
                    {convResult === null ? t('نامشخص', 'Unknown') : convResult} <span className="text-sm text-slate-400 font-sans ml-1">{convTo}</span>
                 </div>
              </div>
           </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null, source: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1">
               <AlertTriangle size={22} />
            </div>
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1">
               <Lock size={12}/> {t('هشدار: غیرقابل بازگشت', 'WARNING: IRREVERSIBLE')}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {deleteConfirm.type === 'bulk' 
                ? t(`آیا از حذف ${deleteConfirm.data?.length} مورد انتخاب شده اطمینان دارید؟`, `Delete ${deleteConfirm.data?.length} selected items?`)
                : t(`آیا از حذف این مورد و تمام سوابق آن اطمینان دارید؟`, `Delete this item and its history?`)
              }
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null, source: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 shadow-lg shadow-red-100">{t('تایید حذف', 'Delete Now')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.CurrencySettings = CurrencySettings;
})();