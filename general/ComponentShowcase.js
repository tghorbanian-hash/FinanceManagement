/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer, Table, BoxSelect, Search, Save, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  // دریافت کامپوننت‌ها از دیزاین‌سیستم
  const { DataGrid, Button, TextField, Card, Badge, SelectField } = window.DesignSystem || {};
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  // State برای تب‌های صفحه
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'forms'
  const [mockData, setMockData] = useState([]);

  // Generate 100 fake financial records for the DataGrid
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
        department: departments[i % 5],
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000} مربوط به پروژه`,
        type: types[i % 2],
        amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(),
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
    { icon: Eye, tooltip: t('مشاهده جزئیات', 'View Details'), onClick: (row) => alert(`${t('مشاهده', 'View')} ID: ${row.id}`), className: 'text-slate-400 hover:text-blue-600 hover:border-blue-200' },
    { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => alert(`${t('ویرایش', 'Edit')} ID: ${row.id}`), className: 'text-slate-400 hover:text-emerald-600 hover:border-emerald-200' },
    { icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: (row) => alert(`${t('ضمائم', 'Attachments')} ID: ${row.id}`), className: 'text-slate-400 hover:text-indigo-600 hover:border-indigo-200' },
    { icon: Printer, tooltip: t('چاپ', 'Print'), onClick: (row) => alert(`${t('چاپ', 'Print')} ID: ${row.id}`), className: 'text-slate-400 hover:text-slate-800 hover:border-slate-300' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'text-slate-400 hover:text-red-600 hover:border-red-200' },
  ];

  // State برای فرم‌های نمونه
  const [formData, setFormData] = useState({ username: '', email: '', role: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!DataGrid || !Button) return <div className="p-8 text-slate-500 font-bold">در حال بارگذاری سیستم طراحی (Design System)...</div>;

  return (
    // نکته مهم: h-full باعث می‌شود کل صفحه محدود به ارتفاع مانیتور شود و اسکرول داخلی گرید فعال گردد
    <div className="p-6 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* هدر صفحه و عنوان */}
      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">{t('کاتالوگ کامپوننت‌ها (Showcase)', 'Component Showcase')}</h1>
          <p className="text-[13px] text-slate-500">
            {t('مرجع استاندارد طراحی برای تمام فرم‌ها و گریدهای سیستم یکپارچه.', 'Standard design reference for all forms and grids.')}
          </p>
        </div>
      </div>

      {/* سیستم تب‌ها (Tabs) */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-2 px-6 py-3 text-[13px] font-black transition-all border-b-2 ${
            activeTab === 'grid' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Table size={16} />
          {t('نمونه گرید پیشرفته (DataGrid)', 'Advanced DataGrid')}
        </button>
        <button 
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-2 px-6 py-3 text-[13px] font-black transition-all border-b-2 ${
            activeTab === 'forms' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BoxSelect size={16} />
          {t('المان‌های فرم (Form Controls)', 'Form Controls')}
        </button>
      </div>

      {/* محتوای تب 1: گرید */}
      {activeTab === 'grid' && (
        <div className="flex-1 min-h-0 animate-in fade-in duration-300">
          <DataGrid 
            data={mockData} 
            columns={gridColumns} 
            actions={gridActions} 
            language={language}
          />
        </div>
      )}

      {/* محتوای تب 2: المان‌های فرم */}
      {activeTab === 'forms' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-300 space-y-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <Card title={t('انواع دکمه‌ها (Buttons)', 'Button Variants')}>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">{t('اصلی (Primary)', 'Primary')}</Button>
                  <Button variant="secondary">{t('ثانویه (Secondary)', 'Secondary')}</Button>
                  <Button variant="outline">{t('حاشیه‌دار (Outline)', 'Outline')}</Button>
                  <Button variant="danger">{t('خطر (Danger)', 'Danger')}</Button>
                  <Button variant="ghost">{t('نامرئی (Ghost)', 'Ghost')}</Button>
                </div>
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-[12px] font-bold text-slate-500 w-24 shrink-0">{t('سایزها:', 'Sizes:')}</span>
                    <Button variant="primary" size="sm">{t('کوچک', 'Small')}</Button>
                    <Button variant="primary" size="md">{t('متوسط', 'Medium')}</Button>
                    <Button variant="primary" size="lg">{t('بزرگ', 'Large')}</Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card title={t('وضعیت‌ها و نشانگرها (Badges)', 'Status & Badges')}>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge variant="gray">{t('پیش‌نویس', 'Draft')}</Badge>
                <Badge variant="indigo">{t('در حال بررسی', 'In Review')}</Badge>
                <Badge variant="success">{t('تایید شده', 'Approved')}</Badge>
                <Badge variant="warning">{t('نیاز به اصلاح', 'Needs Fix')}</Badge>
                <Badge variant="danger">{t('رد شده', 'Rejected')}</Badge>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {t('از نشانگرها برای نمایش وضعیت اسناد در هدر فرم‌ها استفاده می‌شود.', 'Use badges to display document status in form headers.')}
                </p>
              </div>
            </Card>

            <Card className="lg:col-span-2" title={t('فیلدهای فرم (Form Controls)', 'Form Controls')}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <TextField 
                  label={t('نام کاربری', 'Username')}
                  placeholder={t('مثال: admin_user', 'e.g., admin_user')}
                  required isRtl={isRtl} icon={User}
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
                <TextField 
                  label={t('آدرس ایمیل', 'Email Address')}
                  type="email" placeholder="example@domain.com"
                  icon={Mail} isRtl={isRtl}
                  hint={t('لینک فعال‌سازی به این ایمیل ارسال می‌شود.', 'Activation link will be sent here.')}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <SelectField 
                  label={t('سطح دسترسی (نقش)', 'Role Level')}
                  required isRtl={isRtl}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  options={[
                    { value: 'admin', label: t('مدیر سیستم', 'System Admin') },
                    { value: 'manager', label: t('مدیر میانی', 'Manager') },
                    { value: 'user', label: t('کاربر عادی', 'Standard User') }
                  ]}
                />
                <TextField 
                  label={t('کد پرسنلی', 'Personnel Code')}
                  isRtl={isRtl} value="123-AB"
                  error={t('کد پرسنلی فقط باید شامل اعداد باشد.', 'Personnel code must contain numbers only.')}
                />
                <SelectField 
                  label={t('واحد سازمانی', 'Department')}
                  isRtl={isRtl}
                  error={t('انتخاب واحد سازمانی الزامی است.', 'Department selection is required.')}
                  options={[]}
                />
                <TextField 
                  label={t('تاریخ ثبت (سیستمی)', 'Creation Date')}
                  isRtl={isRtl} value="1403/08/15" disabled
                />
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" icon={Trash2}>{t('انصراف', 'Cancel')}</Button>
                <Button variant="primary" icon={Save} isLoading={isSubmitting} onClick={() => {
                  setIsSubmitting(true); setTimeout(() => setIsSubmitting(false), 2000);
                }}>
                  {t('ذخیره تغییرات', 'Save Changes')}
                </Button>
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;