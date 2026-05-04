/* Filename: general/CurrencySettings.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  const { 
    DollarSign, Plus, Edit, Trash2, RefreshCw, History, Check, X,
    Calculator, Save, Globe, Lock, Unlock, ArrowRightLeft, AlertTriangle 
  } = window.LucideIcons || {};

  const CurrencySettings = ({ language = 'fa' }) => {
    const { 
      DataGrid, Button, TextField, SelectField, ToggleField, Card, Badge, PageHeader, 
      AdvancedFilter, Modal, Tabs, CurrencyField, DatePicker, Toast 
    } = window.DesignSystem || {};

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const [activeTab, setActiveTab] = useState('list');
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    
    // States: Currencies
    const [currencies, setCurrencies] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [tempTarget, setTempTarget] = useState('');

    // States: Rates & History Modal
    const [rates, setRates] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyCurrencyCode, setHistoryCurrencyCode] = useState(null);
    
    // States: Converter Modal
    const [isConverterOpen, setIsConverterOpen] = useState(false);
    const [convAmount, setConvAmount] = useState('1');
    const [convFrom, setConvFrom] = useState('');
    const [convTo, setConvTo] = useState('');

    // States: Delete Confirmation Modal (Avoiding browser alerts)
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });

    const supabase = window.supabase;

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
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
        const { data, error } = await supabase.from('fm_currency_rates').select('*').order('rate_date', { ascending: false });
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

    // Logic: Save Currency
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

    // Logic: Delete Currency
    const executeDelete = async () => {
      try {
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from('fm_currencies').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from('fm_currencies').delete().in('id', selectedRows);
          if (error) throw error;
          setSelectedRows([]);
        }
        showToast(t('عملیات حذف با موفقیت انجام شد', 'Deletion successful'));
        setDeleteConfirm({ isOpen: false, type: null, data: null });
        fetchCurrencies();
      } catch (err) {
        console.error("Delete error:", err);
        showToast(t('امکان حذف ارز دارای گردش وجود ندارد', 'Cannot delete currency with relations'), 'error');
        setDeleteConfirm({ isOpen: false, type: null, data: null });
      }
    };

    // Logic: Bulk Actions
    const handleBulkAction = async (actionType) => {
      if (!selectedRows.length) return;
      try {
        let updatePayload = {};
        if (actionType === 'activate') updatePayload = { is_active: true };
        if (actionType === 'deactivate') updatePayload = { is_active: false };
        if (actionType === 'setAuto') updatePayload = { fetch_type: 'auto' };
        if (actionType === 'setManual') updatePayload = { fetch_type: 'manual' };

        const { error } = await supabase.from('fm_currencies').update(updatePayload).in('id', selectedRows);
        if (error) throw error;
        
        showToast(t('عملیات گروهی با موفقیت انجام شد', 'Bulk action successful'));
        setSelectedRows([]);
        fetchCurrencies();
      } catch (err) {
        console.error("Bulk action error:", err);
        showToast(t('خطا در اجرای عملیات گروهی', 'Error executing bulk action'), 'error');
      }
    };

    // Logic: Cross-Rate
    const getRateValue = (baseCode, targetCode) => {
      if (baseCode === targetCode) return 1;
      let direct = rates.find(r => r.base_currency === baseCode && r.target_currency === targetCode);
      if (direct) return direct.rate;
      let inverse = rates.find(r => r.base_currency === targetCode && r.target_currency === baseCode);
      if (inverse) return 1 / inverse.rate;
      return null; // Note: For real two-layer cross rate, we iterate intermediate targets recursively. Simplified for scope.
    };

    const convResult = useMemo(() => {
      if (!convAmount || !convFrom || !convTo) return null;
      const amount = parseFloat(String(convAmount).replace(/,/g, ''));
      if (isNaN(amount)) return null;
      const rate = getRateValue(convFrom, convTo);
      if (rate === null) return t('نرخ یافت نشد', 'Rate not found');
      return (amount * rate).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }, [convAmount, convFrom, convTo, rates]);

    const tabs = [
      { id: 'list', label: t('فهرست ارزها', 'Currency List'), icon: Globe },
      { id: 'rates', label: t('نرخ‌های روزانه', 'Daily Rates'), icon: RefreshCw },
    ];

    const currencyColumns = [
      { field: 'code', header_fa: 'کد ارز', header_en: 'Code', width: '100px', render: (v) => <span className="font-bold">{v}</span> },
      { field: 'title', header_fa: 'عنوان', header_en: 'Title', width: '180px' },
      { field: 'symbol', header_fa: 'نماد', header_en: 'Symbol', width: '80px' },
      { 
        field: 'targets', header_fa: 'ارزهای مبنا', header_en: 'Targets', width: '250px',
        render: (val) => (
          <div className="flex gap-1 flex-wrap">
            {Array.isArray(val) && val.map(c => <Badge key={c} variant="indigo" size="sm">{c}</Badge>)}
            {(!val || val.length === 0) && <span className="text-slate-300 text-[10px]">{t('بدون وابستگی', 'No targets')}</span>}
          </div>
        )
      },
      { 
        field: 'fetch_type', header_fa: 'نوع دریافت', header_en: 'Fetch Type', width: '120px',
        render: (v) => <Badge variant={v === 'auto' ? 'emerald' : 'slate'}>{v === 'auto' ? t('اتوماتیک', 'Auto') : t('دستی', 'Manual')}</Badge>
      },
      { field: 'decimal_places', header_fa: 'اعشار', header_en: 'Decimals', width: '80px' },
      { field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', type: 'toggle', width: '100px' },
    ];

    const currencyRowActions = [
      { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => { setSelectedCurrency({...row}); setIsCurrencyModalOpen(true); }, className: 'text-slate-600 hover:text-indigo-600' },
      { icon: History, tooltip: t('تاریخچه نرخ', 'Rate History'), onClick: (row) => { setHistoryCurrencyCode(row.code); setIsHistoryModalOpen(true); }, className: 'text-slate-600 hover:text-blue-600' },
      { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row }), className: 'text-slate-600 hover:text-red-600' }
    ];

    const gridBulkActions = [
      { label: t('فعال‌سازی', 'Activate'), icon: Check, onClick: () => handleBulkAction('activate'), variant: 'outline', className: 'text-emerald-600' },
      { label: t('غیرفعال‌سازی', 'Deactivate'), icon: X, onClick: () => handleBulkAction('deactivate'), variant: 'outline', className: 'text-slate-600' },
      { label: t('تنظیم دریافت اتوماتیک', 'Set Auto Fetch'), icon: RefreshCw, onClick: () => handleBulkAction('setAuto'), variant: 'outline', className: 'text-blue-600' },
      { label: t('حذف دسته‌جمعی', 'Delete Selected'), icon: Trash2, onClick: () => setDeleteConfirm({ isOpen: true, type: 'bulk', data: null }), variant: 'outline', className: 'text-red-600 hover:bg-red-50 border-red-200' },
    ];

    const historyColumns = [
      { field: 'rate_date', header_fa: 'تاریخ', header_en: 'Date', width: '120px', type: 'date' },
      { field: 'base_currency', header_fa: 'ارز پایه', header_en: 'Base', width: '100px' },
      { field: 'target_currency', header_fa: 'ارز هدف', header_en: 'Target', width: '100px' },
      { field: 'rate', header_fa: 'نرخ', header_en: 'Rate', width: '150px', render: (v) => v.toLocaleString() },
      { field: 'source', header_fa: 'منبع', header_en: 'Source', width: '100px' }
    ];

    const historyDataFiltered = useMemo(() => {
      if (!historyCurrencyCode) return [];
      return rates.filter(r => r.base_currency === historyCurrencyCode || r.target_currency === historyCurrencyCode)
                  .sort((a, b) => new Date(b.rate_date) - new Date(a.rate_date));
    }, [rates, historyCurrencyCode]);

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('تنظیمات و مدیریت نرخ ارزها', 'Currency & Exchange Management')}
          icon={DollarSign} language={language}
          breadcrumbs={[{ label: t('تنظیمات پایه', 'Base Setup') }, { label: t('ارزها', 'Currencies') }]}
          actions={
             <Button variant="primary" icon={Calculator} onClick={() => { setConvFrom(currencies[0]?.code); setConvTo(currencies[1]?.code); setIsConverterOpen(true); }} className="bg-indigo-600">
               {t('تبدیل‌گر نرخ', 'Rate Converter')}
             </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in duration-500">
          
          {/* TAB 1: Currency List */}
          {activeTab === 'list' && (
            <>
              <AdvancedFilter fields={[{ name: 'code', label: t('کد ارز', 'Code'), type: 'text' }]} language={language} />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={currencies} 
                  columns={currencyColumns} 
                  language={language}
                  actions={currencyRowActions}
                  selectable={true}
                  onSelectionChange={setSelectedRows}
                  bulkActions={selectedRows.length > 0 ? gridBulkActions : undefined}
                  onAdd={() => { setSelectedCurrency({ code: '', title: '', symbol: '', is_active: true, fetch_type: 'manual', decimal_places: 0, targets: [] }); setIsCurrencyModalOpen(true); }}
                />
              </div>
            </>
          )}

          {/* TAB 2: Daily Rates (Placeholder layout as requested for next phase) */}
          {activeTab === 'rates' && (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
               <p className="text-slate-400 font-bold">{t('تب نرخ‌های روزانه - فاز بعدی توسعه', 'Daily Rates Tab - Next Development Phase')}</p>
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Currency */}
        <Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title={selectedCurrency?.id ? t('ویرایش ارز', 'Edit Currency') : t('تعریف ارز جدید', 'New Currency')} language={language} width="max-w-2xl">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <TextField label={t('کد ارز', 'Currency Code')} value={selectedCurrency?.code || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, code: e.target.value.toUpperCase()})} isRtl={isRtl} required />
            <TextField label={t('عنوان', 'Title')} value={selectedCurrency?.title || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, title: e.target.value})} isRtl={isRtl} required />
            <TextField label={t('نماد', 'Symbol')} value={selectedCurrency?.symbol || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, symbol: e.target.value})} isRtl={isRtl} />
            
            <SelectField 
              label={t('نوع دریافت نرخ', 'Rate Fetch Type')} value={selectedCurrency?.fetch_type || 'manual'} onChange={(e) => setSelectedCurrency({...selectedCurrency, fetch_type: e.target.value})} isRtl={isRtl} 
              options={[{value: 'manual', label: t('دستی', 'Manual')}, {value: 'auto', label: t('اتوماتیک (API)', 'Automatic')}]} 
            />
            <TextField label={t('تعداد اعشار', 'Decimal Places')} type="number" value={selectedCurrency?.decimal_places ?? 0} onChange={(e) => setSelectedCurrency({...selectedCurrency, decimal_places: e.target.value})} isRtl={isRtl} />
            <ToggleField label={t('وضعیت فعالیت', 'Active Status')} checked={selectedCurrency?.is_active ?? true} onChange={(val) => setSelectedCurrency({...selectedCurrency, is_active: val})} isRtl={isRtl} wrapperClassName="flex items-center pt-6" />
            
            <div className="col-span-full border-t border-slate-100 pt-4 mt-2">
               <label className="text-[12px] font-bold text-slate-700 mb-2 block">{t('ارزهای هدف (مبنای تعیین نرخ):', 'Target Currencies:')}</label>
               <div className="flex flex-col gap-3">
                 <div className="flex items-end gap-2 max-w-sm">
                   <SelectField 
                      value={tempTarget} onChange={(e) => setTempTarget(e.target.value)} isRtl={isRtl} wrapperClassName="flex-1"
                      options={[
                        { value: '', label: t('انتخاب کنید...', 'Select...') },
                        ...currencies.filter(c => c.code !== selectedCurrency?.code && !(selectedCurrency?.targets || []).includes(c.code)).map(c => ({value: c.code, label: `${c.title} (${c.code})`}))
                      ]} 
                   />
                   <Button variant="outline" icon={Plus} onClick={() => { if(tempTarget) { setSelectedCurrency({...selectedCurrency, targets: [...(selectedCurrency.targets || []), tempTarget]}); setTempTarget(''); } }} disabled={!tempTarget}>
                     {t('افزودن', 'Add')}
                   </Button>
                 </div>
                 <div className="flex flex-wrap gap-2 p-3 min-h-[50px] bg-slate-50 rounded-lg border border-slate-200">
                    {(selectedCurrency?.targets || []).map(tcode => (
                      <Badge key={tcode} variant="indigo" className="flex items-center gap-1 pl-1">
                        {tcode}
                        <X size={14} className="cursor-pointer text-indigo-400 hover:text-red-500 transition-colors" onClick={() => setSelectedCurrency({...selectedCurrency, targets: selectedCurrency.targets.filter(x => x !== tcode)})} />
                      </Badge>
                    ))}
                    {(!selectedCurrency?.targets || selectedCurrency.targets.length === 0) && <span className="text-slate-400 text-sm">{t('ارز هدفی انتخاب نشده است.', 'No target selected.')}</span>}
                 </div>
               </div>
            </div>

            <div className="col-span-full flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsCurrencyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" icon={Save} onClick={handleSaveCurrency}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Rate History */}
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={t(`تاریخچه نرخ‌های ${historyCurrencyCode}`, `Rate History for ${historyCurrencyCode}`)} language={language} width="max-w-4xl">
           <div className="p-4 h-[400px] flex flex-col">
              <DataGrid data={historyDataFiltered} columns={historyColumns} language={language} />
           </div>
        </Modal>

        {/* Modal: Converter */}
        <Modal isOpen={isConverterOpen} onClose={() => setIsConverterOpen(false)} title={t('تبدیل‌گر نرخ ارز', 'Currency Converter')} language={language} width="max-w-xl">
           <div className="p-6 flex flex-col items-center">
              <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                 <CurrencyField label={t('مبلغ', 'Amount')} value={convAmount} onChange={setConvAmount} isRtl={isRtl} wrapperClassName="flex-1" />
                 <SelectField label={t('از ارز', 'From')} value={convFrom} onChange={(e) => setConvFrom(e.target.value)} isRtl={isRtl} wrapperClassName="w-32" options={currencies.map(c => ({value: c.code, label: c.code}))} />
                 
                 <Button variant="outline" className="px-3 text-slate-500 border-slate-300" onClick={() => { const temp = convFrom; setConvFrom(convTo); setConvTo(temp); }}>
                    <ArrowRightLeft size={18} className={isRtl ? '' : 'rotate-180'} />
                 </Button>
                 
                 <SelectField label={t('به ارز', 'To')} value={convTo} onChange={(e) => setConvTo(e.target.value)} isRtl={isRtl} wrapperClassName="w-32" options={currencies.map(c => ({value: c.code, label: c.code}))} />
              </div>
              <div className="mt-8 w-full p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                 <span className="text-[12px] font-bold text-slate-500">{t('نتیجه تبدیل', 'Converted Amount')}</span>
                 <div className="text-3xl font-black text-indigo-700 tracking-tight" dir="ltr">
                    {convResult} <span className="text-lg text-slate-400 ml-1">{convTo}</span>
                 </div>
              </div>
           </div>
        </Modal>

        {/* Modal: Delete Confirmation (Compliance: No standard confirm() allowed) */}
        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null })} title={t('تایید حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-4 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
               <AlertTriangle size={24} />
            </div>
            {/* Compliance: Status/Warning messages at the top of the form */}
            <div className="bg-amber-50 text-amber-800 p-2 rounded w-full text-sm font-bold mb-2">
               {t('هشدار: این عملیات غیرقابل بازگشت است.', 'Warning: This action cannot be undone.')}
            </div>
            <p className="text-slate-600">
              {deleteConfirm.type === 'bulk' 
                ? t(`آیا از حذف ${selectedRows.length} رکورد انتخاب شده اطمینان دارید؟`, `Are you sure you want to delete ${selectedRows.length} selected records?`)
                : t(`آیا از حذف ارز ${deleteConfirm.data?.code} اطمینان دارید؟`, `Are you sure you want to delete currency ${deleteConfirm.data?.code}?`)
              }
            </p>
            <div className="flex gap-2 mt-4 w-full justify-center">
              <Button variant="outline" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" onClick={executeDelete} className="bg-red-600 hover:bg-red-700">{t('بله، حذف شود', 'Yes, Delete')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.CurrencySettings = CurrencySettings;
})();