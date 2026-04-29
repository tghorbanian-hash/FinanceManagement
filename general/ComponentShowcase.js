/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer, Table, BoxSelect, Search, Save, Mail, User, LayoutGrid, FileText } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  const { DataGrid, Button, TextField, Card, Badge, SelectField, PageHeader, AdvancedFilter, Modal, AttachmentManager } = window.DesignSystem || {};
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [activeTab, setActiveTab] = useState('grid'); 
  const [mockData, setMockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formData, setFormData] = useState({ username: '', email: '', role: '' });
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

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
        id: 1000 + i, docDate: formattedDate, department: departments[i % 5],
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000} مربوط به پروژه`,
        type: types[i % 2], amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(), status: status,
        isReadOnly: status === 'تایید شده',
        attachments: i % 3 === 0 ? [{ id: 1, name: 'factor.pdf', size: 1024000 }, { id: 2, name: 'receipt.jpg', size: 512000 }] : []
      });
    }
    setMockData(data);
    setFilteredData(data);
  }, []);

  const gridColumns = [
    { field: 'id', header_fa: 'شماره سند', header_en: 'Doc ID', type: 'number', width: '90px' },
    { field: 'docDate', header_fa: 'تاریخ ثبت', header_en: 'Date', type: 'date', width: '110px' },
    { field: 'department', header_fa: 'واحد سازمانی', header_en: 'Department', type: 'text', width: '130px' },
    { field: 'description', header_fa: 'شرح سند', header_en: 'Description', type: 'text', width: '300px' },
    { field: 'type', header_fa: 'ماهیت', header_en: 'Type', type: 'text', width: '100px' },
    { field: 'amount', header_fa: 'مبلغ (ریال)', header_en: 'Amount (IRR)', type: 'text', width: '130px' },
    { field: 'status', header_fa: 'وضعیت', header_en: 'Status', type: 'text', width: '110px' },
  ];

  const handleViewDetails = (row) => { setSelectedRow(row); setViewModalOpen(true); };
  const handleAttachments = (row) => { setSelectedRow(row); setAttachModalOpen(true); };

  const handleUploadAttachment = (newFiles) => {
    const uploaded = newFiles.map((f, i) => ({ id: Date.now() + i, name: f.name, size: f.size }));
    const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: [...(r.attachments || []), ...uploaded] } : r);
    setMockData(updatedData); setFilteredData(updatedData);
    setSelectedRow(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
  };

  const handleDeleteAttachment = (file) => {
    const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: r.attachments.filter(a => a.id !== file.id) } : r);
    setMockData(updatedData); setFilteredData(updatedData);
    setSelectedRow(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== file.id) }));
  };

  const gridActions = [
    { icon: Eye, tooltip: t('مشاهده جزئیات', 'View Details'), onClick: handleViewDetails, className: 'hover:text-blue-600' },
    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => alert(`${t('ویرایش', 'Edit')} ID: ${row.id}`), className: 'hover:text-emerald-600' },
    { 
      icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: handleAttachments, 
      className: (row) => row.attachments?.length > 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'hover:text-indigo-600' 
    },
    { icon: Printer, tooltip: t('چاپ', 'Print'), onClick: (row) => alert(`${t('چاپ', 'Print')} ID: ${row.id}`), className: 'hover:text-slate-800' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'hover:text-red-600' },
  ];

  const advancedFilterFields = [
    { name: 'id', label: t('شماره سند', 'Doc ID'), type: 'number' },
    { name: 'docDate', label: t('تاریخ سند', 'Date'), type: 'date' },
    { name: 'department', label: t('واحد سازمانی', 'Department'), type: 'select', options: [
      { value: 'مالی', label: t('مالی', 'Finance') }, { value: 'فروش', label: t('فروش', 'Sales') }, { value: 'تدارکات', label: t('تدارکات', 'Procurement') }
    ]},
    { name: 'status', label: t('وضعیت', 'Status'), type: 'select', options: [
      { value: 'تایید شده', label: t('تایید شده', 'Approved') }, { value: 'در حال بررسی', label: t('در حال بررسی', 'In Review') }, { value: 'رد شده', label: t('رد شده', 'Rejected') }
    ]},
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
        title={t('کاتالوگ کامپوننت‌ها', 'Component Showcase')}
        icon={LayoutGrid} language={language}
        breadcrumbs={[{ label: t('میز کار', 'Workspace') }, { label: t('تنظیمات پایه', 'Base Setup') }, { label: t('سیستم طراحی', 'Design System') }]}
      />

      <div className="flex items-center gap-1 border-b border-slate-200 mb-4 shrink-0">
        <button onClick={() => setActiveTab('grid')} className={`flex items-center gap-2 px-6 py-2.5 text-[12px] font-black transition-all border-b-2 ${activeTab === 'grid' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Table size={16} />{t('نمونه گرید پیشرفته', 'Advanced DataGrid')}
        </button>
        <button onClick={() => setActiveTab('forms')} className={`flex items-center gap-2 px-6 py-2.5 text-[12px] font-black transition-all border-b-2 ${activeTab === 'forms' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <BoxSelect size={16} />{t('المان‌های فرم', 'Form Controls')}
        </button>
      </div>

      {activeTab === 'grid' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <AdvancedFilter fields={advancedFilterFields} onFilter={handleAdvancedFilter} onClear={() => setFilteredData(mockData)} language={language} />
          <div className="flex-1 min-h-0">
            <DataGrid data={filteredData} columns={gridColumns} actions={gridActions} language={language} onAdd={() => alert(t('دکمه ایجاد رکورد جدید کلیک شد', 'New item clicked'))} />
          </div>
        </div>
      )}

      {activeTab === 'forms' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-300 space-y-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={t('انواع دکمه‌ها (Buttons)', 'Button Variants')}>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">اصلی</Button> <Button variant="secondary">ثانویه</Button> <Button variant="outline">حاشیه‌دار</Button> <Button variant="danger">خطر</Button> <Button variant="ghost">نامرئی</Button>
                </div>
              </div>
            </Card>
            <Card title={t('وضعیت‌ها (Badges)', 'Badges')}>
              <div className="flex flex-wrap gap-4">
                <Badge variant="gray">پیش‌نویس</Badge> <Badge variant="indigo">در حال بررسی</Badge> <Badge variant="success">تایید شده</Badge> <Badge variant="warning">نیاز به اصلاح</Badge> <Badge variant="danger">رد شده</Badge>
              </div>
            </Card>
            <Card className="lg:col-span-2" title={t('فیلدهای فرم (Form Controls)', 'Form Controls')}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <TextField label={t('نام کاربری', 'Username')} required isRtl={isRtl} icon={User} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                <TextField label={t('آدرس ایمیل', 'Email')} type="email" icon={Mail} isRtl={isRtl} hint={t('لینک فعال‌سازی به این ایمیل ارسال می‌شود.', 'Hint text')} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <SelectField label={t('سطح دسترسی', 'Role')} required isRtl={isRtl} value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} options={[{ value: 'admin', label: 'مدیر' }, { value: 'user', label: 'کاربر' }]} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`${t('جزئیات سند حسابداری شماره', 'Document Details #')} ${selectedRow?.id || ''}`} width="max-w-5xl" language={language} showMaximize={true}>
        {selectedRow && (
          <div className="space-y-4 p-4">
            <Card title={t('اطلاعات کلی سند', 'General Information')} noPadding={true}>
              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white">
                <TextField size="sm" label={t('شماره سند', 'Doc ID')} value={selectedRow.id} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('تاریخ ثبت', 'Date')} value={selectedRow.docDate} disabled isRtl={isRtl} dir="ltr" />
                <TextField size="sm" label={t('واحد سازمانی', 'Department')} value={selectedRow.department} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('مبلغ کل (ریال)', 'Amount')} value={selectedRow.amount} disabled isRtl={isRtl} dir="ltr" />
                <TextField size="sm" label={t('ماهیت', 'Type')} value={selectedRow.type} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('وضعیت', 'Status')} value={selectedRow.status} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('شرح سند', 'Description')} value={selectedRow.description} disabled isRtl={isRtl} wrapperClassName="md:col-span-3" />
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
                    { field: 'rowId', header_fa: 'ردیف', header_en: 'Row', width: '60px' }, { field: 'account', header_fa: 'حساب معین', header_en: 'Account', width: '180px' }, { field: 'costCenter', header_fa: 'مرکز هزینه', header_en: 'Cost Center', width: '140px' }, { field: 'debit', header_fa: 'بدهکار (ریال)', header_en: 'Debit', width: '120px' }, { field: 'credit', header_fa: 'بستانکار (ریال)', header_en: 'Credit', width: '120px' }, { field: 'note', header_fa: 'شرح ردیف', header_en: 'Line Note', width: '250px' }
                  ]}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Attachments Modal */}
      <Modal isOpen={attachModalOpen} onClose={() => setAttachModalOpen(false)} title={`${t('ضمائم سند شماره', 'Attachments for Doc #')} ${selectedRow?.id || ''}`} width="max-w-xl" language={language} showMaximize={false}>
        {selectedRow && (
          <div className="p-4">
            <AttachmentManager 
              files={selectedRow.attachments} 
              onUpload={handleUploadAttachment} 
              onDelete={handleDeleteAttachment} 
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