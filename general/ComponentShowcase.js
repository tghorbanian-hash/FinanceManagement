/* Filename: general/ComponentShowcase.js */
import React, { useState } from 'react';
import { Search, Save, Trash2, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  // دریافت امن کامپوننت‌ها از DesignSystem
  const { Button, TextField, Card, Badge, SelectField } = window.DesignSystem || {};
  
  const isRtl = language === 'fa';
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const t = (fa, en) => isRtl ? fa : en;

  // بررسی لود شدن DesignSystem برای جلوگیری از Crash
  if (!window.DesignSystem) {
    return <div className="p-10 text-center text-slate-500">در حال بارگذاری کامپوننت‌های پایه...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">
            {t('کاتالوگ کامپوننت‌ها', 'Component Showcase')}
          </h1>
          <p className="text-slate-500 text-[13px]">
            {t('مرجع استاندارد طراحی برای تمام فرم‌های سیستم (Design System)', 'Standard design reference for all system forms (Design System)')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Trash2}>{t('انصراف', 'Cancel')}</Button>
          <Button variant="primary" icon={Save} isLoading={isSubmitting} onClick={handleSimulateSubmit}>
            {t('ذخیره تغییرات', 'Save Changes')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
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
              
              <div className="flex items-center gap-3 w-full mt-2">
                <span className="text-[12px] font-bold text-slate-500 w-24 shrink-0">{t('آیکون‌دار:', 'With Icons:')}</span>
                <Button variant="outline" icon={Search}>{t('جستجو', 'Search')}</Button>
                <Button variant="secondary" icon={Save} iconPosition="left">{t('ذخیره چپ', 'Left Icon')}</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('وضعیت‌ها و نشانگرها (Badges)', 'Status & Badges')}>
          <div className="flex flex-wrap gap-4">
            <Badge variant="gray">{t('پیش‌نویس', 'Draft')}</Badge>
            <Badge variant="indigo">{t('در حال بررسی', 'In Review')}</Badge>
            <Badge variant="success">{t('تایید شده', 'Approved')}</Badge>
            <Badge variant="warning">{t('نیاز به اصلاح', 'Needs Fix')}</Badge>
            <Badge variant="danger">{t('رد شده', 'Rejected')}</Badge>
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[12px] text-slate-600 leading-relaxed">
              {t('از نشانگرها برای نمایش وضعیت اسناد در جداول (Grid) یا هدر فرم‌ها استفاده می‌شود.', 'Use badges to display document status in grids or form headers.')}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2" title={t('فیلدهای فرم (Form Controls)', 'Form Controls')}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            <TextField 
              label={t('نام کاربری', 'Username')}
              placeholder={t('مثال: admin_user', 'e.g., admin_user')}
              required
              isRtl={isRtl}
              icon={User}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />

            <TextField 
              label={t('آدرس ایمیل', 'Email Address')}
              type="email"
              placeholder="example@domain.com"
              icon={Mail}
              isRtl={isRtl}
              hint={t('لینک فعال‌سازی به این ایمیل ارسال می‌شود.', 'Activation link will be sent here.')}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            <SelectField 
              label={t('سطح دسترسی (نقش)', 'Role Level')}
              required
              isRtl={isRtl}
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
              isRtl={isRtl}
              value="123-AB"
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
              isRtl={isRtl}
              value="1403/08/15"
              disabled
            />

          </div>
        </Card>
      </div>
    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;