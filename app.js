/* Filename: app.js */
(() => {
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const { useState, useEffect } = React;

  const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [loginMethod, setLoginMethod] = useState('standard');
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('fa');
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
      const checkSession = async () => {
        const sessionStr = localStorage.getItem('fm_user_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (window.AccessManager) {
              await window.AccessManager.init(session.id, session.username);
            }
            setIsAuthenticated(true);
          } catch (e) {
            localStorage.removeItem('fm_user_session');
          }
        }
        setIsCheckingSession(false);
      };
      checkSession();
    }, []);

    const hashPassword = async (pass) => {
      const msgBuffer = new TextEncoder().encode(pass);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      setError(null);
      
      if (!loginData.identifier || !loginData.password) {
         setError(language === 'fa' ? 'لطفاً نام کاربری و کلمه عبور را وارد کنید.' : 'Please enter username and password.');
         return;
      }

      try {
        const hashedInput = await hashPassword(loginData.password);
        
        const { data, error: dbError } = await window.supabase
          .from('sec_users')
          .select('*')
          .eq('username', loginData.identifier)
          .single();

        if (dbError || !data) {
           setError(language === 'fa' ? 'نام کاربری در سیستم یافت نشد.' : 'Username not found.');
           return;
        }

        if (!data.is_active) {
           setError(language === 'fa' ? 'حساب کاربری شما غیرفعال شده است.' : 'Your account is disabled.');
           return;
        }

        if (data.password_hash !== hashedInput) {
           setError(language === 'fa' ? 'کلمه عبور اشتباه است.' : 'Incorrect password.');
           return;
        }

        await window.supabase.from('sec_users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

        const sessionData = { 
            id: data.id, 
            username: data.username, 
            type: data.user_type 
        };
        
        localStorage.setItem('fm_user_session', JSON.stringify(sessionData));
        
        if (window.AccessManager) {
           await window.AccessManager.init(data.id, data.username);
        }
        
        setIsAuthenticated(true);
        
      } catch (err) {
        console.error('Login Error:', err);
        setError(language === 'fa' ? 'خطا در ارتباط با دیتابیس.' : 'Database connection error.');
      }
    };

    const toggleLanguage = () => {
      setLanguage(prev => prev === 'fa' ? 'en' : 'fa');
    };

    if (isCheckingSession) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      const UserLoginComponent = window.UserLogin;
      if (!UserLoginComponent) return <div className="p-4 text-center">کامپوننت UserLogin در index.html فراخوانی نشده است.</div>;
      
      return (
        <UserLoginComponent 
          t={{}} 
          isRtl={language === 'fa'} 
          authView={authView} 
          setAuthView={setAuthView}
          loginMethod={loginMethod} 
          setLoginMethod={setLoginMethod}
          loginData={loginData} 
          setLoginData={setLoginData}
          error={error} 
          handleLogin={handleLogin} 
          toggleLanguage={toggleLanguage} 
        />
      );
    }

    const NavigationSystemComponent = window.NavigationSystem;
    if (!NavigationSystemComponent) return <div className="p-4 text-center">کامپوننت NavigationSystem در index.html فراخوانی نشده است.</div>;

    const isAdminCheck = () => {
        const sessionStr = localStorage.getItem('fm_user_session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                return session.username === 'admin' || session.username === 'superadmin';
            } catch(e) {}
        }
        return false;
    };

    return <NavigationSystemComponent isAdmin={isAdminCheck()} initialLanguage={language} />;
  };

  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
})();