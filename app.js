/* Filename: app.js */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  // یک متغیر وضعیت برای بررسی آماده بودن کامپوننت منو
  const [NavigationComponent, setNavigationComponent] = useState(() => window.NavigationSystem);

  useEffect(() => {
    // اگر کامپوننت هنوز آماده نبود، هر ۱۰۰ میلی‌ثانیه بررسی می‌کند
    if (!NavigationComponent) {
      const timer = setInterval(() => {
        if (window.NavigationSystem) {
          setNavigationComponent(() => window.NavigationSystem);
          clearInterval(timer); // توقف جستجو به محض پیدا کردن
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [NavigationComponent]);

  // نمایش یک لودینگ زیبا تا زمان ترجمه کامل فایل‌های سیستم
  if (!NavigationComponent) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="font-bold text-slate-500 text-sm animate-pulse">در حال آماده‌سازی رابط کاربری...</div>
        </div>
      </div>
    );
  }

  // نمایش منوی اصلی به محض آماده شدن
  return (
    <NavigationComponent 
      isAdmin={true} 
      language="fa" 
    />
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
