
(() => {
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
        <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300" dir="rtl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="font-bold text-slate-500 dark:text-slate-400 text-sm animate-pulse">در حال برقراری ارتباط امن با پایگاه داده...</div>
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
  root.render(<App />)
})();