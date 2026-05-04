/* Filename: general/CurrencySettings.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  const { 
    DollarSign, Plus, Edit, Trash2, RefreshCw, History, 
    Calculator, Save, Search, X, Globe, Lock, Unlock, ArrowRightLeft, TrendingUp 
  } = window.LucideIcons || {};

  const CurrencySettings = ({ language = 'fa' }) => {
    const { 
      DataGrid, Button, TextField, SelectField, ToggleField, CheckboxField, Card, Badge, PageHeader, 
      AdvancedFilter, Modal, Tabs, LineChart, CurrencyField, DatePicker, Toast, Dialog 
    } = window.DesignSystem || {};

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const [activeTab, setActiveTab] = useState('list');
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    
    // ================= STATES =================
    // 1. Currencies
    const [currencies, setCurrencies] = useState([]);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);

    // 2. Rates
    const [rates, setRates] = useState([]);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [selectedRate, setSelectedRate] = useState(null);
    const [isXeLoading, setIsXeLoading] = useState(false);
    const [rateFilters, setRateFilters] = useState({});

    // 3. Converter
    const [convAmount, setConvAmount] = useState('1');
    const [convFrom, setConvFrom] = useState('EUR');
    const [convTo, setConvTo] = useState('IRR');

    // ================= MOCK DATA =================
    useEffect(() => {
      setCurrencies([
        { id: 1, code: 'USD', title: 'دلار آمریکا', symbol: '$', isActive: true, targets: ['IRR'] },
        { id: 2, code: 'EUR', title: 'یورو', symbol: '€', isActive: true, targets: ['USD', 'IRR'] },
        { id: 3, code: 'GBP', title: 'پوند انگلیس', symbol: '£', isActive: true, targets: ['USD'] },
        { id: 4, code: 'IRR', title: 'ریال ایران', symbol: '﷼', isActive: true, targets: [] },
      ]);

      // isLocked: true simulates rates older than 7 days that cannot be edited
      setRates([
        { id: 101, base: 'USD', target: 'IRR', date: '2026/05/04', rate: 1900000, source: 'Manual', isLocked: false },
        { id: 102, base: 'EUR', target: 'USD', date: '2026/05/04', rate: 1.08, source: 'XE', isLocked: false },
        { id: 103, base: 'GBP', target: 'USD', date: '2026/05/04', rate: 1.25, source: 'XE', isLocked: false },
        { id: 104, base: 'USD', target: 'IRR', date: '2026/04/20', rate: 1850000, source: 'Manual', isLocked: true },
        { id: 105, base: 'USD', target: 'IRR', date: '2026/04/25', rate: 1880000, source: 'Manual', isLocked: true },
      ]);
    }, []);

    const showToast = (message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    };

    // ================= LOGIC: CROSS-RATE =================
    const getRateValue = (baseCode, targetCode) => {
      if (baseCode === targetCode) return 1;
      
      // Direct Rate
      let direct = rates.find(r => r.base === baseCode && r.target === targetCode);
      if (direct) return direct.rate;
      
      // Inverse Rate (e.g., Target to Base)
      let inverse = rates.find(r => r.base === targetCode && r.target === baseCode);
      if (inverse) return 1 / inverse.rate;

      // Two-layer Cross Rate
      const baseCur = currencies.find(c => c.code === baseCode);
      const intermediateTargets = baseCur?.targets || [];
      
      for (let intermediate of intermediateTargets) {
        const rate1 = rates.find(r => r.base === baseCode && r.target === intermediate)?.rate || 
                      (rates.find(r => r.base === intermediate && r.target === baseCode) ? 1/rates.find(r => r.base === intermediate && r.target === baseCode).rate : null);
        
        const rate2 = rates.find(r => r.base === intermediate && r.target === targetCode)?.rate || 
                      (rates.find(r => r.base === targetCode && r.target === intermediate) ? 1/rates.find(r => r.base === targetCode && r.target === intermediate).rate : null);
        
        if (rate1 && rate2) {
          return rate1 * rate2;
        }
      }
      return null;
    };

    const convResult = useMemo(() => {
      if (!convAmount || !convFrom || !convTo) return null;
      const amount = parseFloat(String(convAmount).replace(/,/g, ''));
      if (isNaN(amount)) return null;
      
      const rate = getRateValue(convFrom, convTo);
      if (rate === null) return t('نرخ مستقیم یا واسط یافت نشد', 'Rate not found');
      return (amount * rate).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }, [convAmount, convFrom, convTo, rates, currencies]);

    // ================= TABS & GRIDS =================
    const tabs = [
      { id: 'list', label: t('فهرست ارزها', 'Currency List'), icon: Globe },
      { id: 'rates', label: t('نرخ‌های روزانه', 'Daily Rates'), icon: RefreshCw },
      { id: 'history', label: t('تاریخچه نرخ', 'Rate History'), icon: History },
      { id: 'converter', label: t('تبدیل‌گر', 'Converter'), icon: Calculator },
    ];

    const currencyColumns = [
      { field: 'code', header_fa: 'کد ارز', header_en: 'Code', width: '100px' },
      { field: 'title', header_fa: 'عنوان', header_en: 'Title', width: '180px' },
      { field: 'symbol', header_fa: 'نماد', header_en: 'Symbol', width: '80px' },
      { 
        field: 'targets', header_fa: 'ارزهای مبنای نرخ', header_en: 'Target Currencies', width: '250px',
        render: (val) => (
          <div className="flex gap-1 flex-wrap">
            {val.map(c => <Badge key={c} variant="indigo">{c}</Badge>)}
            {val.length === 0 && <span className="text-slate-300 text-[10px]">{t('بدون وابستگی', 'No targets')}</span>}
          </div>
        )
      },
      { field: 'isActive', header_fa: 'وضعیت', header_en: 'Status', type: 'toggle', width: '100px' },
    ];

    const rateColumns = [
      { field: 'base', header_fa: 'ارز پایه', header_en: 'Base', width: '120px', render: (val) => <span className="font-bold text-slate-800">{val}</span> },
      { field: 'target', header_fa: 'ارز هدف', header_en: 'Target', width: '120px' },
      { field: 'rate', header_fa: 'نرخ تسعیر', header_en: 'Rate', width: '150px', render: (val) => val.toLocaleString() },
      { field: 'date', header_fa: 'تاریخ ثبت', header_en: 'Date', width: '120px', type: 'date' },
      { 
        field: 'source', header_fa: 'منبع', header_en: 'Source', width: '100px',
        render: (val) => <Badge variant={val === 'XE' ? 'emerald' : 'blue'}>{val}</Badge>
      },
      { 
        field: 'isLocked', header_fa: 'وضعیت قفل', header_en: 'Lock Status', width: '100px',
        render: (val) => val ? <span className="text-slate-400 flex items-center gap-1"><Lock size={12}/>{t('قفل شده', 'Locked')}</span> : <span className="text-emerald-500 flex items-center gap-1"><Unlock size={12}/>{t('آزاد', 'Unlocked')}</span>
      }
    ];

    const filteredRates = useMemo(() => {
      let filtered = [...rates];
      if (rateFilters.base) filtered = filtered.filter(r => r.base === rateFilters.base);
      if (rateFilters.date) filtered = filtered.filter(r => r.date === rateFilters.date);
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [rates, rateFilters]);

    // Data for LineChart in History Tab
    const chartData = useMemo(() => {
      const historyForChart = rates.filter(r => r.base === 'USD' && r.target === 'IRR').sort((a, b) => new Date(a.date) - new Date(b.date));
      return historyForChart.map(r => ({ label: r.date, value: r.rate }));
    }, [rates]);

    const handleXeFetch = () => {
      setIsXeLoading(true);
      setTimeout(() => {
        setIsXeLoading(false);
        showToast(t('نرخ‌های روزانه با موفقیت از سرور XE دریافت شد.', 'Rates successfully fetched from XE server.'), 'success');
        // Add a mock XE rate
        setRates([{ id: Date.now(), base: 'EUR', target: 'IRR', date: '2026/05/04', rate: 2050000, source: 'XE', isLocked: false }, ...rates]);
      }, 1500);
    };

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('تنظیمات و مدیریت نرخ ارزها', 'Currency & Exchange Management')}
          icon={DollarSign} language={language}
          breadcrumbs={[{ label: t('تنظیمات پایه', 'Base Setup') }, { label: t('ارزها', 'Currencies') }]}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in duration-500">
          
          {/* TAB 1: Currency List */}
          {activeTab === 'list' && (
            <>
              <AdvancedFilter fields={[{ name: 'code', label: t('کد ارز', 'Code'), type: 'text' }]} language={language} />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={currencies} columns={currencyColumns} language={language}
                  actions={[
                    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => { setSelectedCurrency(row); setIsCurrencyModalOpen(true); }, className: 'hover:text-indigo-600' },
                    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: () => showToast(t('امکان حذف ارز پایه وجود ندارد', 'Cannot delete base currency'), 'error'), className: 'hover:text-red-600' }
                  ]}
                  onAdd={() => { setSelectedCurrency({ code: '', title: '', symbol: '', isActive: true, targets: [] }); setIsCurrencyModalOpen(true); }}
                />
              </div>
            </>
          )}

          {/* TAB 2: Daily Rates */}
          {activeTab === 'rates' && (
            <div className="flex-1 flex flex-col min-h-0">
              <AdvancedFilter 
                fields={[
                  { name: 'base', label: t('ارز پایه', 'Base Currency'), type: 'select', options: currencies.map(c => ({value: c.code, label: c.code})) },
                  { name: 'date', label: t('تاریخ', 'Date'), type: 'date' }
                ]}
                onFilter={setRateFilters}
                onClear={() => setRateFilters({})}
                language={language}
              >
                {/* XE Fetch Button injected inside the filter area */}
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleXeFetch} isLoading={isXeLoading} className="text-emerald-600 hover:bg-emerald-50 border-emerald-200">
                  {t('بروزرسانی از سایت XE', 'Fetch from XE')}
                </Button>
              </AdvancedFilter>
              
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={filteredRates} columns={rateColumns} language={language}
                  actions={[
                    { icon: Edit, tooltip: t('ویرایش', 'Edit'), hidden: (r) => r.isLocked, onClick: (row) => { setSelectedRate(row); setIsRateModalOpen(true); }, className: 'hover:text-indigo-600' },
                    { icon: Trash2, tooltip: t('حذف', 'Delete'), hidden: (r) => r.isLocked, onClick: () => showToast(t('نرخ حذف شد', 'Rate deleted'), 'success'), className: 'hover:text-red-600' },
                    { icon: Lock, tooltip: t('قفل شده - مهلت ویرایش تمام شده', 'Locked - Edit period expired'), hidden: (r) => !r.isLocked, className: 'text-slate-300 cursor-not-allowed', onClick: () => showToast(t('مهلت ویرایش ۷ روزه این نرخ به پایان رسیده است.', 'The 7-day edit period for this rate has expired.'), 'warning') }
                  ]}
                  onAdd={() => { setSelectedRate({ base: '', target: '', rate: '', date: '', source: 'Manual' }); setIsRateModalOpen(true); }}
                />
              </div>
            </div>
          )}
          
          {/* TAB 3: History & Trends */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto custom-scrollbar p-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2">
                    <LineChart 
                      title={t('نمودار نوسانات نرخ (USD به IRR)', 'Rate Volatility Trend (USD to IRR)')} 
                      data={chartData} 
                      color="indigo" 
                      height={280} 
                      language={language} 
                    />
                 </div>
                 <div className="flex flex-col gap-4">
                    <StatCard label={t('بالاترین نرخ (بازه انتخابی)', 'Highest Rate')} value="1,900,000" icon={TrendingUp} trend="up" trendValue="+2.5%" color="emerald" language={language} />
                    <StatCard label={t('تعداد ثبت‌های روزانه', 'Total Records')} value="124" icon={History} color="blue" language={language} />
                 </div>
              </div>
              
              <Card title={t('گزارش سوابق نرخ‌ها', 'Rates Log Report')} className="flex-1 min-h-[300px]" noPadding headerClassName="h-10 bg-white">
                <DataGrid data={rates} columns={rateColumns} language={language} />
              </Card>
            </div>
          )}
          
          {/* TAB 4: Converter (Two-Layer Logic) */}
          {activeTab === 'converter' && (
             <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-2xl border-none shadow-[0_10px_40px_rgba(0,0,0,0.08)] !overflow-visible">
                   <div className="p-8 flex flex-col items-center">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
                         <ArrowRightLeft size={28} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 mb-2">{t('تبدیل‌گر نرخ ارز (Cross-Rate)', 'Currency Converter')}</h2>
                      <p className="text-[12px] text-slate-500 mb-8 text-center">{t('سیستم به‌صورت خودکار در صورت نبود نرخ مستقیم، از ارزهای واسط (مانند تبدیل یورو به ریال از طریق دلار) استفاده می‌کند.', 'System automatically uses intermediate currencies (e.g., EUR to IRR via USD) if direct rate is unavailable.')}</p>

                      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                         <CurrencyField label={t('مبلغ', 'Amount')} value={convAmount} onChange={setConvAmount} isRtl={isRtl} wrapperClassName="flex-1" size="lg" />
                         <SelectField 
                            label={t('از ارز', 'From')} value={convFrom} onChange={(e) => setConvFrom(e.target.value)} isRtl={isRtl} wrapperClassName="md:w-32" size="lg"
                            options={currencies.map(c => ({value: c.code, label: c.code}))} 
                         />
                         <div className="p-2 bg-slate-50 rounded-full text-slate-400 mt-4 shrink-0 shadow-sm border border-slate-200">
                            <ArrowRightLeft size={18} className={isRtl ? '' : 'rotate-180'} />
                         </div>
                         <SelectField 
                            label={t('به ارز', 'To')} value={convTo} onChange={(e) => setConvTo(e.target.value)} isRtl={isRtl} wrapperClassName="md:w-32" size="lg"
                            options={currencies.map(c => ({value: c.code, label: c.code}))} 
                         />
                      </div>

                      <div className="mt-10 w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                         <span className="text-[12px] font-bold text-slate-500">{t('نتیجه تبدیل', 'Converted Amount')}</span>
                         <div className="text-3xl font-black text-indigo-700 tracking-tight" dir="ltr">
                            {convResult} <span className="text-lg text-slate-400">{convTo}</span>
                         </div>
                      </div>
                   </div>
                </Card>
             </div>
          )}
        </div>

        {/* Modal: Add/Edit Currency */}
        <Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title={selectedCurrency?.id ? t('ویرایش ارز', 'Edit Currency') : t('تعریف ارز جدید', 'New Currency')} language={language}>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label={t('کد ارز (مثلاً USD)', 'Currency Code')} value={selectedCurrency?.code || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, code: e.target.value.toUpperCase()})} isRtl={isRtl} required />
            <TextField label={t('عنوان فارسی', 'Title (FA)')} value={selectedCurrency?.title || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, title: e.target.value})} isRtl={isRtl} required />
            <TextField label={t('نماد ارز', 'Symbol')} value={selectedCurrency?.symbol || ''} onChange={(e) => setSelectedCurrency({...selectedCurrency, symbol: e.target.value})} isRtl={isRtl} />
            <ToggleField label={t('وضعیت فعال بودن', 'Active Status')} checked={selectedCurrency?.isActive ?? true} onChange={(val) => setSelectedCurrency({...selectedCurrency, isActive: val})} isRtl={isRtl} wrapperClassName="mt-6" />
            
            <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
               <label className="text-[11px] font-black text-slate-700 mb-2 block">{t('ارزهای هدف برای تعیین نرخ:', 'Target Currencies for Rates:')}</label>
               <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {currencies.filter(c => c.code !== selectedCurrency?.code).map(c => (
                    <CheckboxField 
                      key={c.code} label={`${c.title} (${c.code})`} 
                      checked={(selectedCurrency?.targets || []).includes(c.code)}
                      onChange={(checked) => {
                        const newTargets = checked ? [...(selectedCurrency?.targets || []), c.code] : (selectedCurrency?.targets || []).filter(t => t !== c.code);
                        setSelectedCurrency({...selectedCurrency, targets: newTargets});
                      }}
                    />
                  ))}
               </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCurrencyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" icon={Save} onClick={() => { showToast(t('تغییرات ذخیره شد', 'Changes saved')); setIsCurrencyModalOpen(false); }}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Add/Edit Daily Rate */}
        <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title={selectedRate?.id ? t('ویرایش نرخ', 'Edit Rate') : t('ثبت نرخ جدید', 'New Rate')} language={language} width="max-w-md">
          <div className="p-4 flex flex-col gap-4">
            <SelectField 
              label={t('ارز پایه', 'Base Currency')} value={selectedRate?.base || ''} onChange={(e) => setSelectedRate({...selectedRate, base: e.target.value})} isRtl={isRtl} required
              options={currencies.map(c => ({value: c.code, label: `${c.title} (${c.code})`}))} 
            />
            <SelectField 
              label={t('ارز هدف', 'Target Currency')} value={selectedRate?.target || ''} onChange={(e) => setSelectedRate({...selectedRate, target: e.target.value})} isRtl={isRtl} required
              options={currencies.map(c => ({value: c.code, label: `${c.title} (${c.code})`}))} 
            />
            <CurrencyField label={t('نرخ تبدیل', 'Exchange Rate')} value={selectedRate?.rate || ''} onChange={(v) => setSelectedRate({...selectedRate, rate: v})} isRtl={isRtl} required />
            <DatePicker label={t('تاریخ اعمال نرخ', 'Date')} value={selectedRate?.date || ''} onChange={(v) => setSelectedRate({...selectedRate, date: v})} isRtl={isRtl} language={language} required />
            
            <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setIsRateModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" icon={Save} onClick={() => { showToast(t('نرخ با موفقیت ثبت شد', 'Rate saved successfully')); setIsRateModalOpen(false); }}>{t('ثبت نرخ', 'Save Rate')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.CurrencySettings = CurrencySettings;
})();