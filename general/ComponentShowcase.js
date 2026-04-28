/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer, Table, BoxSelect, Search, Save, Mail, User, AlertCircle, LayoutGrid } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  const { DataGrid, Button, TextField, Card, Badge, SelectField, PageHeader } = window.DesignSystem || {};
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [activeTab, setActiveTab] = useState('grid'); 
  const [mockData, setMockData] = useState([]);
  const [formData, setFormData] = useState({ username: '', email: '', role: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate 100 fake financial records
  useEffect(() => {
    const data = [];
    const departments = ['مالی', 'فروش', 'تدارکات', 'منابع انسانی', 'مدیریت'];
    const statuses = ['تایید شده', 'در حال بررسی', 'پیش‌نویس', 'رد شده'];
    const types = ['بدهکار', 'بستانکار'];

    for (let i = 1; i <= 100; i++) {
      const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
      const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '/');
      data.push({
        id: 1000 + i, docDate: formattedDate, department: departments[i % 5],
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000} مربوط به پروژه`,
        type: types[i % 2], amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(), status: statuses[i % 4],
      });
    }
    setMockData(data);
  }, []);

  const gridColumns = [
    { field: 'id', header_fa: 'شماره سند', header_en: 'Doc ID', type: 'number', width: '90px' },
    { field: 'docDate', header_fa: 'تاریخ ثبت', header_en: 'Date', type: 'date', width: '100px' },
    { field: 'department', header_fa: 'واحد سازمانی', header_en: 'Department', type: 'text', width: '130px' },
    { field: 'description', header_fa: 'شرح سند', header_en: 'Description', type: 'text', width: '300px' },
    { field: 'type', header_fa: 'ماهیت', header_en: 'Type', type: 'text', width: '100px' },
    { field: 'amount', header_fa: 'مبلغ (ریال)', header_en: 'Amount (IRR)', type: 'text', width: '130px' },
    { field: 'status', header_fa: 'وضعیت', header_en: 'Status', type: 'text', width: '110px' },
  ];

  const gridActions = [
    { icon: Eye, tooltip: t('مشاهده جزئیات', 'View Details'), onClick: (row) => alert(`${t('مشاهده', 'View')} ID: ${row.id}`), className: 'text-slate-400 hover:text-blue-600 hover:border-blue-200' },
    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => alert(`${t('ویرایش', 'Edit')} ID: ${row.id}`), className: 'text-slate-400 hover:text-emerald-600 hover:border-emerald-200' },
    { icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: (row) => alert(`${t('ضمائم', 'Attachments')} ID: ${row.id}`), className: 'text-slate-400 hover:text-indigo-600 hover:border-indigo-200' },
    { icon: Printer, tooltip: t('چاپ', 'Print'), onClick: (row) => alert(`${t('چاپ', 'Print')} ID: ${row.id}`), className: 'text-slate-400 hover:text-slate-800 hover:border-slate-300' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'text-slate-400 hover:text-red-600 hover:border-red-200' },
  ];

  if (!DataGrid || !Button || !PageHeader) return <div className="p-8 text-slate-500 font-bold">در حال بارگذاری سیستم طراحی...</div>;

  return (
    <div className="p-6 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Header & Breadcrumbs (Standard Component) */}
      <PageHeader 
        title={t('کاتالوگ کامپوننت‌ها', 'Component Showcase')}
        icon={LayoutGrid}
        language={language}
        breadcrumbs={[
          { label: t('میز کار', 'Workspace') },
          { label: t('تنظیمات پایه', 'Base Setup') },
          { label: t('سیستم طراحی', 'Design System') }
        ]}
      />

      {/* 2. Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-4 shrink-0">
        <button onClick={() => setActiveTab('grid')} className={`flex items-center gap-2 px-6 py-2.5 text-[12px] font-black transition-all border-b-2 ${activeTab === 'grid' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Table size={16} />{t('نمونه گرید پیشرفته', 'Advanced DataGrid')}
        </button>
        <button onClick={() => setActiveTab('forms')} className={`flex items-center gap-2 px-6 py-2.5 text-[12px] font-black transition-all border-b-2 ${activeTab === 'forms' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <BoxSelect size={16} />{t('المان‌های فرم', 'Form Controls')}
        </button>
      </div>

      {/* 3. Content Area */}
      {activeTab === 'grid' && (
        <div className="flex-1 min-h-0 animate-in fade-in duration-300">
          <DataGrid 
            data={mockData} 
            columns={gridColumns} 
            actions={gridActions} 
            language={language}
            onAdd={() => alert(t('دکمه ایجاد رکورد جدید کلیک شد', 'New item clicked'))}
          />
        </div>
      )}

      {activeTab === 'forms' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-300 space-y-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={t('انواع دکمه‌ها (Buttons)', 'Button Variants')}>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">اصلی</Button>
                  <Button variant="secondary">ثانویه</Button>
                  <Button variant="outline">حاشیه‌دار</Button>
                  <Button variant="danger">خطر</Button>
                  <Button variant="ghost">نامرئی</Button>
                </div>
              </div>
            </Card>

            <Card title={t('وضعیت‌ها (Badges)', 'Badges')}>
              <div className="flex flex-wrap gap-4">
                <Badge variant="gray">پیش‌نویس</Badge>
                <Badge variant="indigo">در حال بررسی</Badge>
                <Badge variant="success">تایید شده</Badge>
                <Badge variant="warning">نیاز به اصلاح</Badge>
                <Badge variant="danger">رد شده</Badge>
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
    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;