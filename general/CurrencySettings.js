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
      DataGrid, Button, TextField, SelectField, ToggleField, CheckboxField, Card, Badge, PageHeader, 
      AdvancedFilter, Modal, Tabs, CurrencyField, DatePicker, Toast 
    } = window.DesignSystem || {};

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const [activeTab, setActiveTab] = useState('list');
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    
    // States: Currencies
    const [currencies, setCurrencies] = useState([]);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);

    // States: Rates & History Modal
    const [rates, setRates] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyCurrencyCode, setHistoryCurrencyCode] = useState(null);
    
    // States: Converter Modal
    const [isConverterOpen, setIsConverterOpen] = useState(false);
    const [convAmount, setConvAmount] = useState('1');
    const [convFrom, setConvFrom] = useState('');
    const [convTo, setConvTo] = useState('');

    // States: Delete Confirmation Modal
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

    const executeDelete = async () => {
      try {
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from('fm_currencies').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          // در حالت حذف گروهی، شناسه رکوردها در deleteConfirm.data قرار دارد
          const { error } = await supabase.from('fm_currencies').delete().in('id', deleteConfirm.data);
          if (error) throw error;
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

    const getRateValue = (baseCode, targetCode) => {
      if (baseCode === targetCode) return 1;
      let direct = rates.find(r => r.base_currency === baseCode && r.target_currency === targetCode);
      if (direct) return direct.rate;
      let inverse = rates.find(r => r.base_currency === targetCode && r.target_currency === baseCode);
      if (inverse) return 1 / inverse.rate;
      return null;
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

    const currencyRowActions = [
      { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => { setSelectedCurrency({...row}); setIsCurrencyModalOpen(true); }, className: 'text-slate-400 hover:text-indigo-600' },
      { icon: History, tooltip: t('تاریخچه نرخ', 'Rate History'), onClick: (row) => { setHistoryCurrencyCode(row.code); setIsHistoryModalOpen(true); }, className: 'text-slate-400 hover:text-blue-600' },
      { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row }), className: 'text-slate-400 hover:text-red-600' }
    ];

    const gridBulkActions = [
      { label: t('فعال‌سازی', 'Activate'), icon: Check, onClick: (ids) => handleBulkAction('activate', ids), variant: 'outline', className: 'text-emerald-600' },
      { label: t('غیرفعال‌سازی', 'Deactivate'), icon: X, onClick: (ids) => handleBulkAction('deactivate', ids), variant: 'outline', className: 'text-slate-600' },
      { label: t('دریافت اتوماتیک', 'Set Auto'), icon: RefreshCw, onClick: (ids) => handleBulkAction('setAuto', ids), variant: 'outline', className: 'text-blue-600' },
      { label: t('دریافت دستی', 'Set Manual'), icon: Lock, onClick: (ids) => handleBulkAction('setManual', ids), variant: 'outline', className: 'text-amber-600' },
      { label: t('حذف گروهی', 'Delete'), icon: Trash2, onClick: (ids) => setDeleteConfirm({ isOpen: true, type: 'bulk', data: ids }), variant: 'outline', className: 'text-red-600 border-red-100 bg-red-50/30' },
    ];

    const historyColumns = [
      { field: 'rate_date', header_fa: 'تاریخ', header_en: 'Date', width: '120px', type: 'date' },
      { field: 'base_currency', header_fa: 'ارز پایه', header_en: 'Base', width: '100px' },
      { field: 'target_currency', header_fa: 'ارز هدف', header_en: 'Target', width: '100px' },
      { field: 'rate', header_fa: 'نرخ', header_en: 'Rate', width: '150px', render: (v) => v.toLocaleString() },
      { field: 'source', header_fa: 'منبع', header_en: 'Source', width: '100px', render: (v) => <Badge variant="blue" size="sm">{v}</Badge> }
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
             <Button variant="primary" icon={Calculator} onClick={() => { setConvFrom(currencies[0]?.code); setConvTo(currencies[1]?.code); setIsConverterOpen(true); }} className="bg-indigo-600 shadow-lg shadow-indigo-200">
               {t('تبدیل‌گر نرخ', 'Rate Converter')}
             </Button>
          }
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
                  actions={currencyRowActions}
                  selectable={true}
                  onRowDoubleClick={(row) => { setSelectedCurrency({...row}); setIsCurrencyModalOpen(true); }}
                  bulkActions={gridBulkActions}
                  onAdd={() => { setSelectedCurrency({ code: '', title: '', symbol: '', is_active: true, fetch_type: 'manual', decimal_places: 0, targets: [] }); setIsCurrencyModalOpen(true); }}
                />
              </div>
            </>
          )}

          {activeTab === 'rates' && (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
               <div className="text-center">
                 <RefreshCw size={40} className="mx-auto text-slate-200 mb-4 animate-spin-slow" />
                 <p className="text-slate-400 font-bold">{t('تب نرخ‌های روزانه - در حال پیاده‌سازی منطق دیتابیس', 'Daily Rates Tab - Implementing Database Logic')}</p>
               </div>
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Currency - Compact Refined Layout */}
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
            
            {/* Target Currencies: Auto-add Refined UX */}
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

        {/* Modal: History */}
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={t(`تاریخچه نرخ‌های ${historyCurrencyCode}`, `Rate History for ${historyCurrencyCode}`)} language={language} width="max-w-3xl">
           <div className="p-3 h-[350px]">
              <DataGrid data={historyDataFiltered} columns={historyColumns} language={language} density="compact" />
           </div>
        </Modal>

        {/* Modal: Converter */}
        <Modal isOpen={isConverterOpen} onClose={() => setIsConverterOpen(false)} title={t('تبدیل‌گر نرخ ارز', 'Currency Converter')} language={language} width="max-w-lg">
           <div className="p-5 flex flex-col items-center">
              <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
                 <CurrencyField label={t('مبلغ', 'Amount')} value={convAmount} onChange={setConvAmount} isRtl={isRtl} size="sm" wrapperClassName="flex-1" />
                 <SelectField label={t('از', 'From')} value={convFrom} onChange={(e) => setConvFrom(e.target.value)} isRtl={isRtl} size="sm" wrapperClassName="w-24" options={currencies.map(c => ({value: c.code, label: c.code}))} />
                 
                 <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors mb-1" onClick={() => { const temp = convFrom; setConvFrom(convTo); setConvTo(temp); }}>
                    <ArrowRightLeft size={16} className={isRtl ? '' : 'rotate-180'} />
                 </div>
                 
                 <SelectField label={t('به', 'To')} value={convTo} onChange={(e) => setConvTo(e.target.value)} isRtl={isRtl} size="sm" wrapperClassName="w-24" options={currencies.map(c => ({value: c.code, label: c.code}))} />
              </div>
              <div className="mt-6 w-full p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('حاصل تبدیل با آخرین نرخ موجود', 'Conversion Result')}</span>
                 <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight" dir="ltr">
                    {convResult} <span className="text-sm text-slate-400 font-sans ml-1">{convTo}</span>
                 </div>
              </div>
           </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1">
               <AlertTriangle size={22} />
            </div>
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1">
               <Lock size={12}/> {t('هشدار: غیرقابل بازگشت', 'WARNING: IRREVERSIBLE')}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {deleteConfirm.type === 'bulk' 
                ? t(`آیا از حذف ${deleteConfirm.data?.length} ارز انتخاب شده اطمینان دارید؟`, `Delete ${deleteConfirm.data?.length} selected currencies?`)
                : t(`آیا از حذف ارز ${deleteConfirm.data?.code} و تمام سوابق آن اطمینان دارید؟`, `Delete currency ${deleteConfirm.data?.code} and its history?`)
              }
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null })}>{t('انصراف', 'Cancel')}</Button>
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