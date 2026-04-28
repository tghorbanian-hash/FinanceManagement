/* Filename: app.js */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // هر ۱۰۰ میلی‌ثانیه چک می‌کند که آیا هم کامپوننت منو و هم دیتابیس آماده هستند یا خیر
    const timer = setInterval(() => {
      if (window.NavigationSystem && window.supabase) {
        setIsReady(true);
        clearInterval(timer); // به محض پیدا کردن، جستجو متوقف می‌شود
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

  // نمایش لودینگ تا زمان آماده شدن کامل زیرساخت‌ها
  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f5f8]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="font-bold text-slate-500 text-sm animate-pulse">در حال برقراری ارتباط امن با پایگاه داده...</div>
        </div>
      </div>
    );
  }

  // وقتی همه‌چیز آماده بود، سیستم را رندر می‌کند
  const NavigationComponent = window.NavigationSystem;

  return (
    <NavigationComponent 
      isAdmin={true} 
      language="fa" 
    />
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
