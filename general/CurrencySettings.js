/* Filename: general/CurrencySettings.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  const { 
    DollarSign, Plus, Edit, Trash2, RefreshCw, History, 
    Calculator, Save, Search, X, Globe, Lock, Unlock, TrendingUp 
  } = window.LucideIcons || {};

  const CurrencySettings = ({ language = 'fa' }) => {
    const { 
      DataGrid, Button, TextField, SelectField, ToggleField, Card, Badge, PageHeader, 
      AdvancedFilter, Modal, Tabs, LineChart, StatCard, Toast, Dialog, LOVField
    } = window.DesignSystem || {};

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const [activeTab, setActiveTab] = useState('list');
    const [currencies, setCurrencies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    // Mock Data - در فاز بعد به Supabase متصل می‌شود
    useEffect(() => {
      setCurrencies([
        { id: 1, code: 'USD', title: 'دلار آمریکا', symbol: '$', isActive: true, targets: ['IRR'] },
        { id: 2, code: 'EUR', title: 'یورو', symbol: '€', isActive: true, targets: ['USD', 'IRR'] },
        { id: 3, code: 'GBP', title: 'پوند انگلیس', symbol: '£', isActive: true, targets: ['USD'] },
        { id: 4, code: 'IRR', title: 'ریال ایران', symbol: '﷼', isActive: true, targets: [] },
      ]);
    }, []);

    const showToast = (message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    };

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
        field: 'targets', 
        header_fa: 'ارزهای مبنای نرخ', 
        header_en: 'Target Currencies', 
        width: '250px',
        render: (val) => (
          <div className="flex gap-1 flex-wrap">
            {val.map(c => <Badge key={c} variant="indigo">{c}</Badge>)}
            {val.length === 0 && <span className="text-slate-300 text-[10px]">{t('بدون وابستگی', 'No targets')}</span>}
          </div>
        )
      },
      { field: 'isActive', header_fa: 'وضعیت', header_en: 'Status', type: 'toggle', width: '100px' },
    ];

    const actions = [
      { 
        icon: Edit, 
        tooltip: t('ویرایش', 'Edit'), 
        onClick: (row) => { setSelectedCurrency(row); setIsModalOpen(true); },
        className: 'hover:text-indigo-600'
      },
      { 
        icon: Trash2, 
        tooltip: t('حذف', 'Delete'), 
        onClick: (row) => showToast(t('امکان حذف ارز پایه وجود ندارد', 'Cannot delete base currency'), 'error'),
        className: 'hover:text-red-600'
      }
    ];

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('تنظیمات و مدیریت نرخ ارزها', 'Currency & Exchange Management')}
          icon={DollarSign} 
          language={language}
          breadcrumbs={[{ label: t('تنظیمات پایه', 'Base Setup') }, { label: t('ارزها', 'Currencies') }]}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col animate-in fade-in duration-500">
          {activeTab === 'list' && (
            <>
              <AdvancedFilter 
                fields={[
                  { name: 'code', label: t('کد ارز', 'Code'), type: 'text' },
                  { name: 'title', label: t('عنوان ارز', 'Title'), type: 'text' },
                  { name: 'status', label: t('وضعیت', 'Status'), type: 'select', options: [{value: 'true', label: t('فعال', 'Active')}, {value: 'false', label: t('غیرفعال', 'Inactive')}]}
                ]}
                onFilter={(vals) => console.log('Filter:', vals)}
                language={language}
              />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={currencies} 
                  columns={currencyColumns} 
                  actions={actions}
                  language={language}
                  onAdd={() => { setSelectedCurrency({ code: '', title: '', symbol: '', isActive: true, targets: [] }); setIsModalOpen(true); }}
                  selectable={true}
                />
              </div>
            </>
          )}

          {activeTab === 'rates' && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <RefreshCw size={48} className="mb-4 opacity-20" />
                <p className="font-bold">{t('بخش مدیریت نرخ‌های روزانه در حال بارگذاری...', 'Daily rates management loading...')}</p>
             </div>
          )}
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={selectedCurrency?.id ? t('ویرایش ارز', 'Edit Currency') : t('تعریف ارز جدید', 'New Currency')}
          language={language}
        >
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label={t('کد ارز (مثلاً USD)', 'Currency Code')} value={selectedCurrency?.code} onChange={(e) => setSelectedCurrency({...selectedCurrency, code: e.target.value})} isRtl={isRtl} required />
            <TextField label={t('عنوان فارسی', 'Title (FA)')} value={selectedCurrency?.title} onChange={(e) => setSelectedCurrency({...selectedCurrency, title: e.target.value})} isRtl={isRtl} required />
            <TextField label={t('نماد ارز', 'Symbol')} value={selectedCurrency?.symbol} onChange={(e) => setSelectedCurrency({...selectedCurrency, symbol: e.target.value})} isRtl={isRtl} />
            <ToggleField label={t('وضعیت فعال بودن', 'Active Status')} checked={selectedCurrency?.isActive} onChange={(val) => setSelectedCurrency({...selectedCurrency, isActive: val})} isRtl={isRtl} wrapperClassName="mt-6" />
            
            <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
               <label className="text-[11px] font-black text-slate-700 mb-2 block">{t('ارزهای هدف برای تعیین نرخ:', 'Target Currencies for Rates:')}</label>
               <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {currencies.filter(c => c.code !== selectedCurrency?.code).map(c => (
                    <CheckboxField 
                      key={c.code} 
                      label={`${c.title} (${c.code})`} 
                      checked={selectedCurrency?.targets?.includes(c.code)}
                      onChange={(checked) => {
                        const newTargets = checked 
                          ? [...(selectedCurrency.targets || []), c.code]
                          : (selectedCurrency.targets || []).filter(t => t !== c.code);
                        setSelectedCurrency({...selectedCurrency, targets: newTargets});
                      }}
                    />
                  ))}
               </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" icon={Save} onClick={() => { showToast(t('تغییرات ذخیره شد', 'Changes saved')); setIsModalOpen(false); }}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.CurrencySettings = CurrencySettings;
})();