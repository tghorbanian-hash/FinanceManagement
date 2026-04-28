/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  const { DataGrid } = window.DesignSystem;
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [mockData, setMockData] = useState([]);

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
        id: 1000 + i,
        docDate: formattedDate,
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000}`,
        amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(),
        type: types[i % 2],
        department: departments[i % 5],
        status: statuses[i % 4],
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
    { icon: Eye, tooltip: t('مشاهده جزئیات', 'View Details'), onClick: (row) => alert(`${t('مشاهده', 'View')} ID: ${row.id}`), className: 'hover:text-blue-600' },
    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => alert(`${t('ویرایش', 'Edit')} ID: ${row.id}`), className: 'hover:text-emerald-600' },
    { icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: (row) => alert(`${t('ضمائم', 'Attachments')} ID: ${row.id}`), className: 'hover:text-indigo-600' },
    { icon: Printer, tooltip: t('چاپ', 'Print'), onClick: (row) => alert(`${t('چاپ', 'Print')} ID: ${row.id}`), className: 'hover:text-slate-700' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'hover:text-red-600' },
  ];

  if (!DataGrid) return <div className="p-8">Loading Grid System...</div>;

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-black text-slate-800 mb-1">{t('کاتالوگ کامپوننت‌ها - نمای گرید (DataGrid)', 'Component Showcase - DataGrid')}</h1>
        <p className="text-[12px] text-slate-500">
          {t('در این بخش پیش‌نمایش گرید جامع سیستم با قابلیت‌های گروه‌بندی، فیلتر، صفحه‌بندی، جابجایی و سنجاق ستون‌ها نمایش داده می‌شود.', 
             'This section previews the comprehensive system grid with grouping, filtering, pagination, reordering, and column pinning capabilities.')}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <DataGrid 
          data={mockData} 
          columns={gridColumns} 
          actions={gridActions} 
          language={language}
        />
      </div>
    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;