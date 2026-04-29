/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer, Table, BoxSelect, Search, Save, Mail, User, LayoutGrid, FileText, ChevronRight, Check, Settings } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  const { DataGrid, Button, TextField, SelectField, ToggleField, CheckboxField, Card, Badge, PageHeader, AdvancedFilter, Modal, AttachmentManager } = window.DesignSystem || {};
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [currentView, setCurrentView] = useState('list'); 
  const [mockData, setMockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const data = [];
    const departments = ['مالی', 'فروش', 'تدارکات', 'منابع انسانی', 'مدیریت'];
    const statuses = ['تایید شده', 'در حال بررسی', 'پیش‌نویس', 'رد شده'];
    const types = ['بدهکار', 'بستانکار'];

    for (let i = 1; i <= 100; i++) {
      const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
      const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '/');
      const status = statuses[i % 4];
      data.push({
        id: 1000 + i, 
        docDate: formattedDate, 
        department: departments[i % 5],
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000} مربوط به پروژه`,
        type: types[i % 2], 
        amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(), 
        status: status,
        isActive: i % 2 === 0,
        isControlled: i % 3 === 0,
        isReadOnly: status === 'تایید شده',
        attachments: i % 3 === 0 ? [{ id: 1, name: 'factor.pdf', size: 1024000 }, { id: 2, name: 'receipt.jpg', size: 512000 }] : []
      });
    }
    setMockData(data);
    setFilteredData(data);
  }, []);

  const gridColumns = [
    { field: 'id', header_fa: 'شماره سند', header_en: 'Doc ID', type: 'number', width: '90px' },
    { field: 'isActive', header_fa: 'فعال', header_en: 'Active', type: 'toggle', width: '80px' },
    { field: 'isControlled', header_fa: 'کنترل شده', header_en: 'Controlled', type: 'checkbox', width: '90px' },
    { field: 'docDate', header_fa: 'تاریخ ثبت', header_en: 'Date', type: 'date', width: '110px' },
    { field: 'department', header_fa: 'واحد سازمانی', header_en: 'Department', type: 'text', width: '130px' },
    { field: 'description', header_fa: 'شرح سند', header_en: 'Description', type: 'text', width: '250px' },
    { field: 'amount', header_fa: 'مبلغ (ریال)', header_en: 'Amount (IRR)', type: 'text', width: '130px' },
    { 
      field: 'status', header_fa: 'وضعیت', header_en: 'Status', type: 'badge', width: '110px',
      badgeColor: (val) => {
        if(val === 'تایید شده') return 'success';
        if(val === 'رد شده') return 'danger';
        if(val === 'در حال بررسی') return 'blue';
        if(val === 'پیش‌نویس') return 'orange';
        return 'gray';
      }
    },
  ];

  const handleOpenForm = (row = null) => {
    setSelectedRow(row || { id: '', docDate: '', department: '', description: '', amount: '', status: 'پیش‌نویس', isActive: true, isControlled: false });
    setCurrentView('form');
  };

  const handleSaveForm = () => {
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setCurrentView('list'); }, 1000);
  };

  const handleBulkDelete = (selectedIds) => {
    if (window.confirm(t(`آیا از حذف ${selectedIds.length} مورد انتخاب شده اطمینان دارید؟`, `Are you sure you want to delete ${selectedIds.length} selected items?`))) {
      const updated = mockData.filter(r => !selectedIds.includes(r.id));
      setMockData(updated); setFilteredData(updated);
    }
  };

  const gridActions = [
    { icon: Eye, tooltip: t('مشاهده جزئیات (مودال)', 'View Details'), onClick: (r) => { setSelectedRow(r); setViewModalOpen(true); }, className: 'hover:text-blue-600' },
    { icon: Edit, tooltip: t('ویرایش (ورود به فرم)', 'Edit'), onClick: handleOpenForm, className: 'hover:text-emerald-600' },
    { 
      icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: (r) => { setSelectedRow(r); setAttachModalOpen(true); }, 
      className: (row) => row.attachments?.length > 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'hover:text-indigo-600' 
    },
    { icon: Printer, tooltip: t('چاپ', 'Print'), onClick: (row) => alert(`${t('چاپ', 'Print')} ID: ${row.id}`), className: 'hover:text-slate-800' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'hover:text-red-600' },
  ];

  const advancedFilterFields = [
    { name: 'id', label: t('شماره سند', 'Doc ID'), type: 'number' },
    { name: 'docDate', label: t('تاریخ سند', 'Date'), type: 'date' },
    { name: 'department', label: t('واحد سازمانی', 'Department'), type: 'select', options: [{ value: 'مالی', label: t('مالی', 'Finance') }, { value: 'فروش', label: t('فروش', 'Sales') }, { value: 'تدارکات', label: t('تدارکات', 'Procurement') }]},
    { name: 'status', label: t('وضعیت', 'Status'), type: 'select', options: [{ value: 'تایید شده', label: t('تایید شده', 'Approved') }, { value: 'در حال بررسی', label: t('در حال بررسی', 'In Review') }, { value: 'رد شده', label: t('رد شده', 'Rejected') }]},
  ];

  const handleAdvancedFilter = (values) => {
    let result = [...mockData];
    Object.keys(values).forEach(key => {
      const filterVal = values[key]?.toString().toLowerCase();
      if (!filterVal) return;
      result = result.filter(row => row[key]?.toString().toLowerCase().includes(filterVal));
    });
    setFilteredData(result);
  };

  if (!DataGrid || !Button || !PageHeader || !AdvancedFilter || !Modal || !AttachmentManager) return <div className="p-8 text-slate-500 font-bold">در حال بارگذاری سیستم طراحی...</div>;

  return (
    <div className="p-6 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
      
      <PageHeader 
        title={t('کاتالوگ کامپوننت‌ها (Showcase)', 'Component Showcase')}
        icon={LayoutGrid} language={language}
        breadcrumbs={[{ label: t('میز کار', 'Workspace') }, { label: t('تنظیمات پایه', 'Base Setup') }, { label: t('سیستم طراحی', 'Design System') }]}
      />

      {currentView === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <AdvancedFilter fields={advancedFilterFields} onFilter={handleAdvancedFilter} onClear={() => setFilteredData(mockData)} language={language} />
          <div className="flex-1 min-h-0">
            <DataGrid 
              data={filteredData} 
              columns={gridColumns} 
              actions={gridActions} 
              language={language} 
              onAdd={() => handleOpenForm()}
              onRowDoubleClick={handleOpenForm}
              selectable={true}
              bulkActions={[
                { label: t('حذف همه انتخاب شده‌ها', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: handleBulkDelete },
                { label: t('تایید اسناد', 'Approve Selected'), icon: Check, variant: 'outline', onClick: () => alert('Approved') }
              ]}
            />
          </div>
        </div>
      )}

      {currentView === 'form' && selectedRow && (
        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          <Card 
            title={selectedRow.id ? `${t('ویرایش سند حسابداری شماره', 'Edit Document #')} ${selectedRow.id}` : t('ایجاد سند حسابداری جدید', 'Create New Document')}
            noPadding={true}
            className="flex-1 flex flex-col"
            headerClassName="bg-white border-b-2 border-indigo-100 h-14"
            action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" icon={Printer} onClick={() => alert('Print Preview')}>{t('چاپ', 'Print')}</Button>
                <Button size="sm" variant="outline" icon={isRtl ? ChevronRight : ChevronLeft} onClick={() => setCurrentView('list')}>{t('بازگشت به فهرست', 'Back to List')}</Button>
                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                <Button size="sm" variant="primary" icon={Save} isLoading={isSubmitting} onClick={handleSaveForm}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
              </div>
            }
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
              
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-[12px] font-black text-indigo-700 mb-4 flex items-center gap-1.5"><FileText size={16}/>{t('اطلاعات اصلی', 'General Info')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <TextField size="sm" label={t('شماره سند', 'Doc ID')} value={selectedRow.id || 'جدید'} disabled isRtl={isRtl} />
                    <TextField size="sm" label={t('تاریخ ثبت', 'Date')} value={selectedRow.docDate} isRtl={isRtl} type="date" />
                    <SelectField size="sm" label={t('واحد سازمانی', 'Department')} value={selectedRow.department} isRtl={isRtl} options={[{value:'مالی', label:'مالی'}, {value:'فروش', label:'فروش'}, {value:'تدارکات', label:'تدارکات'}]} />
                    <TextField size="sm" label={t('مبلغ کل (ریال)', 'Amount')} value={selectedRow.amount} isRtl={isRtl} dir="ltr" />
                    <TextField size="sm" label={t('شرح سند', 'Description')} value={selectedRow.description} isRtl={isRtl} wrapperClassName="md:col-span-3 lg:col-span-4" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-[12px] font-black text-indigo-700 mb-4 flex items-center gap-1.5"><Settings size={16}/>{t('تنظیمات عملیاتی', 'Operational Settings')}</h4>
                  <div className="flex flex-wrap items-center gap-8">
                    <ToggleField size="sm" label={t('وضعیت فعال بودن سند در سیستم', 'Document is Active')} checked={selectedRow.isActive} onChange={(val) => setSelectedRow({...selectedRow, isActive: val})} isRtl={isRtl} />
                    <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                    <CheckboxField size="sm" label={t('این سند کنترل مضاعف شده است', 'Controlled Document')} checked={selectedRow.isControlled} onChange={(val) => setSelectedRow({...selectedRow, isControlled: val})} isRtl={isRtl} />
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`${t('جزئیات سند حسابداری شماره', 'Document Details #')} ${selectedRow?.id || ''}`} width="max-w-5xl" language={language} showMaximize={true}>
        {selectedRow && (
          <div className="space-y-4 p-4">
            <Card title={t('اطلاعات کلی سند', 'General Information')} noPadding={true}>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white">
                <TextField size="sm" label={t('شماره سند', 'Doc ID')} value={selectedRow.id} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('تاریخ ثبت', 'Date')} value={selectedRow.docDate} disabled isRtl={isRtl} dir="ltr" />
                <TextField size="sm" label={t('مبلغ کل (ریال)', 'Amount')} value={selectedRow.amount} disabled isRtl={isRtl} dir="ltr" />
                <div className="flex flex-col gap-1.5 justify-center mt-4">
                  <span className="text-[11px] font-bold text-slate-700">{t('وضعیت:', 'Status:')}</span>
                  <div>
                    <Badge variant={selectedRow.status === 'تایید شده' ? 'success' : selectedRow.status === 'رد شده' ? 'danger' : selectedRow.status === 'در حال بررسی' ? 'blue' : selectedRow.status === 'پیش‌نویس' ? 'orange' : 'gray'}>
                      {selectedRow.status}
                    </Badge>
                  </div>
                </div>
                <TextField size="sm" label={t('شرح سند', 'Description')} value={selectedRow.description} disabled isRtl={isRtl} wrapperClassName="md:col-span-3 lg:col-span-4" />
                
                <div className="md:col-span-3 lg:col-span-4 flex items-center gap-6 pt-3 border-t border-slate-100">
                  <ToggleField size="sm" label={t('فعال', 'Active')} checked={selectedRow.isActive} disabled isRtl={isRtl} />
                  <CheckboxField size="sm" label={t('کنترل شده', 'Controlled')} checked={selectedRow.isControlled} disabled isRtl={isRtl} />
                </div>
              </div>
            </Card>

            <div>
              <h4 className="text-[12px] font-black text-slate-800 mb-2 flex items-center gap-1.5"><Table size={14} className="text-indigo-600" />{t('اقلام سند (ردیف‌ها)', 'Document Line Items')}</h4>
              <div className="h-[250px] border border-slate-200 rounded-lg overflow-hidden">
                <DataGrid 
                  data={[
                    { rowId: 1, account: 'حساب‌های دریافتنی', costCenter: 'فروش تهران', debit: selectedRow.amount, credit: '0', note: 'بابت فاکتور فروش شماره 1020' },
                    { rowId: 2, account: 'درآمد فروش محصول', costCenter: 'مرکزی', debit: '0', credit: selectedRow.amount, note: 'شناسایی درآمد' }
                  ]}
                  columns={[
                    { field: 'rowId', header_fa: 'ردیف', header_en: 'Row', width: '60px' },
                    { field: 'account', header_fa: 'حساب معین', header_en: 'Account', width: '180px' },
                    { field: 'costCenter', header_fa: 'مرکز هزینه', header_en: 'Cost Center', width: '140px' },
                    { field: 'debit', header_fa: 'بدهکار (ریال)', header_en: 'Debit', width: '120px' },
                    { field: 'credit', header_fa: 'بستانکار (ریال)', header_en: 'Credit', width: '120px' },
                    { field: 'note', header_fa: 'شرح ردیف', header_en: 'Line Note', width: '250px' }
                  ]}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={attachModalOpen} onClose={() => setAttachModalOpen(false)} title={`${t('ضمائم سند شماره', 'Attachments for Doc #')} ${selectedRow?.id || ''}`} width="max-w-xl" language={language} showMaximize={false}>
        {selectedRow && (
          <div className="p-4">
            <AttachmentManager 
              files={selectedRow.attachments} 
              onUpload={(newFiles) => {
                const uploaded = newFiles.map((f, i) => ({ id: Date.now() + i, name: f.name, size: f.size }));
                const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: [...(r.attachments || []), ...uploaded] } : r);
                setMockData(updatedData); setFilteredData(updatedData);
                setSelectedRow(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
              }} 
              onDelete={(file) => {
                const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: r.attachments.filter(a => a.id !== file.id) } : r);
                setMockData(updatedData); setFilteredData(updatedData);
                setSelectedRow(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== file.id) }));
              }} 
              onDownload={(file) => alert(`Downloading: ${file.name}`)}
              readOnly={selectedRow.isReadOnly} 
              language={language} 
            />
          </div>
        )}
      </Modal>

    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;