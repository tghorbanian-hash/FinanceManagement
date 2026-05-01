/* Filename: app.js */
// حق کاملاً با شماست. کد قدیمی شما برای این معماری (Babel Standalone) بسیار هوشمندانه‌تر بود.
// به دلیل لود ناهمگام اسکریپت‌ها در مرورگر، استفاده از setInterval برای اطمینان از بارگذاری کامل کامپوننت‌ها کاملاً ضروری است.
// این کد همان منطق پایدار و دقیق شماست که برگردانده شد.

const React = window.React;
const { useState, useEffect } = React;
const { createRoot } = window.ReactDOM;

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (window.NavigationSystem && window.supabase) {
        setIsReady(true);
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

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