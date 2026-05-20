/* Filename: general/UserProfile.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  
  const { 
    Button, PageHeader, Card, 
    TextField, SelectField, ToggleField, 
    Toast, Alert
  } = window.DesignSystem || window.DSCore || window.DSForms || {};
  
  const { 
    User, Settings, Shield, CreditCard, Save, 
    Key, Palette, Globe, CalendarDays, Building2, 
    Tags, Fingerprint, Lock, Briefcase
  } = window.LucideIcons || {};
  
  const supabase = window.supabase;

  const UserProfile = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);
    
    // دریافت اطلاعات کاربر لاگین شده از سیستم
    const currentUser = window.NavigationSystem?.currentUser || { id: null, name: 'کاربر سیستم', email: '' };

    const [activeTab, setActiveTab] = useState('personal');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    // --- State های اطلاعات نمایشی ---
    const [profileInfo, setProfileInfo] = useState({
      fullName: currentUser.name,
      username: currentUser.email || currentUser.username || '',
      partyRoles: [],
      userRoles: [],
      department: '---'
    });

    // --- State های تنظیمات ---
    const [preferences, setPreferences] = useState({
      theme: 'system',
      language: 'fa',
      calendarType: 'jalali',
      defaultCostTypeId: ''
    });

    // --- State های رمز عبور ---
    const [passwords, setPasswords] = useState({
      current: '',
      new: '',
      confirm: ''
    });

    // --- State دیتای پایه ---
    const [costTypes, setCostTypes] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    useEffect(() => {
      if (currentUser?.id) {
        fetchUserData();
        fetchPreferences();
        fetchCostTypes();
      }
    }, [currentUser?.id]);

    const fetchUserData = async () => {
      if (!supabase || !currentUser.id) return;
      try {
        // ۱. دریافت اطلاعات شخص مرتبط و نقش‌های شخصی
        const { data: userPartyData } = await supabase
          .from('users') // با فرض اینکه جدول users ارتباطی با parties دارد
          .select(`
            party_id,
            parties ( id, first_name, last_name, roles )
          `)
          .eq('id', currentUser.id)
          .single();

        let partyRoles = [];
        let partyId = null;
        if (userPartyData?.parties) {
          partyRoles = userPartyData.parties.roles || [];
          partyId = userPartyData.parties.id;
        }

        // ۲. دریافت نقش‌های سیستمی کاربر
        const { data: systemRolesData } = await supabase
          .from('fm_user_roles')
          .select('fm_roles(id, title_fa, title_en)')
          .eq('user_id', currentUser.id);
          
        const userRoles = systemRolesData?.map(ur => isRtl ? ur.fm_roles.title_fa : ur.fm_roles.title_en) || [];

        // ۳. پیدا کردن دپارتمان از چارت سازمانی (با فرض وجود جدول fm_org_members)
        let departmentName = '---';
        if (partyId) {
          const { data: orgData } = await supabase
            .from('fm_org_members')
            .select('fm_org_chart(title_fa, title_en)')
            .eq('party_id', partyId)
            .limit(1)
            .single();
            
          if (orgData?.fm_org_chart) {
            departmentName = isRtl ? orgData.fm_org_chart.title_fa : orgData.fm_org_chart.title_en;
          }
        }

        setProfileInfo(prev => ({
          ...prev,
          partyRoles,
          userRoles,
          department: departmentName
        }));

      } catch (err) {
        console.error('Error fetching user profile data:', err);
      }
    };

    const fetchPreferences = async () => {
      if (!supabase || !currentUser.id) return;
      try {
        const { data, error } = await supabase
          .from('fm_user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (data) {
          setPreferences({
            theme: data.theme || 'system',
            language: data.language || 'fa',
            calendarType: data.calendar_type || 'jalali',
            defaultCostTypeId: data.default_cost_type_id || ''
          });
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      }
    };

    const fetchCostTypes = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('fm_cost_types')
          .select('id, title_fa, title_en, code')
          .eq('is_active', true)
          .order('title_fa');
        
        if (data) {
          setCostTypes(data.map(c => ({
            value: c.id,
            label: `[${c.code}] ${isRtl ? c.title_fa : (c.title_en || c.title_fa)}`
          })));
        }
      } catch (err) {
        console.error('Error fetching cost types:', err);
      }
    };

    const handleSavePreferences = async () => {
      if (!supabase || !currentUser.id) return;
      setIsLoading(true);
      try {
        const payload = {
          user_id: currentUser.id,
          theme: preferences.theme,
          language: preferences.language,
          calendar_type: preferences.calendarType,
          default_cost_type_id: preferences.defaultCostTypeId || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('fm_user_preferences')
          .upsert(payload, { onConflict: 'user_id' });

        if (error) throw error;
        
        // اعمال تم به صورت آنی
        if (preferences.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (preferences.theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        showToast(t('تنظیمات با موفقیت ذخیره شد.', 'Preferences saved successfully.'));
      } catch (err) {
        console.error('Save preferences error:', err);
        showToast(t('خطا در ذخیره تنظیمات.', 'Error saving preferences.'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleChangePassword = async () => {
      if (!passwords.new || !passwords.confirm) {
        return showToast(t('لطفاً رمز عبور جدید را وارد کنید.', 'Please enter new password.'), 'error');
      }
      if (passwords.new !== passwords.confirm) {
        return showToast(t('تکرار رمز عبور تطابق ندارد.', 'Passwords do not match.'), 'error');
      }
      
      setIsLoading(true);
      try {
        // در Supabase برای تغییر رمز عبور کاربر لاگین شده
        const { error } = await supabase.auth.updateUser({
          password: passwords.new
        });

        if (error) throw error;

        showToast(t('رمز عبور با موفقیت تغییر کرد.', 'Password changed successfully.'));
        setPasswords({ current: '', new: '', confirm: '' });
      } catch (err) {
        console.error('Password change error:', err);
        showToast(t('خطا در تغییر رمز عبور. ممکن است نیاز به ورود مجدد داشته باشید.', 'Error changing password. You may need to login again.'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const tabs = [
      { id: 'personal', label: t('اطلاعات کاربری', 'User Info'), icon: User },
      { id: 'preferences', label: t('تنظیمات پایه', 'Basic Preferences'), icon: Settings },
      { id: 'financial', label: t('تنظیمات مالی', 'Financial Prefs'), icon: CreditCard },
      { id: 'security', label: t('امنیت و رمز عبور', 'Security'), icon: Shield }
    ];

    const themeOptions = [
      { value: 'light', label: t('روشن (Light)', 'Light') },
      { value: 'dark', label: t('تاریک (Dark)', 'Dark') },
      { value: 'system', label: t('خودکار (پیرو سیستم)', 'System Default') }
    ];

    const languageOptions = [
      { value: 'fa', label: 'فارسی' },
      { value: 'en', label: 'English' }
    ];

    const calendarOptions = [
      { value: 'jalali', label: t('شمسی (Jalali)', 'Jalali') },
      { value: 'gregorian', label: t('میلادی (Gregorian)', 'Gregorian') }
    ];

    const formatRoleFa = (role) => {
        const rolesMap = { 'vendor': 'تامین‌کننده', 'customer': 'مشتری', 'employee': 'کارمند', 'broker': 'بروکر', 'shareholder': 'سهامدار', 'exchange': 'صرافی' };
        return rolesMap[role.toLowerCase()] || role;
    };

    return (
      <div className="flex flex-col h-full p-4 md:p-6 bg-[#f8fafc] dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('پروفایل کاربری و تنظیمات', 'User Profile & Settings')} 
          icon={User}
          description={t('مدیریت اطلاعات شخصی، تغییر رمز عبور و شخصی‌سازی تنظیمات سیستم', 'Manage personal info, change password, and customize system preferences')}
          language={language}
          breadcrumbs={[{ label: t('داشبورد', 'Dashboard') }, { label: t('پروفایل من', 'My Profile') }]}
        />

        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 mt-6 animate-in fade-in duration-300">
          
          {/* ستون راست: کارت خلاصه پروفایل (Bento Style) */}
          <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border-4 border-white dark:border-slate-800 shadow-md">
                    <User size={40} strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white mb-1">{profileInfo.fullName}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dir-ltr mb-4">{profileInfo.username}</p>
                
                <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                        {profileInfo.department}
                    </span>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                            activeTab === tab.id 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        {tab.label}
                    </button>
                ))}
            </div>
          </div>

          {/* ستون چپ: محتوای تب‌ها */}
          <div className="flex-1 min-h-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    {React.createElement(tabs.find(t => t.id === activeTab)?.icon || User, { size: 20, className: 'text-indigo-500' })}
                    {tabs.find(t => t.id === activeTab)?.label}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                
                {/* تب اطلاعات کاربری */}
                {activeTab === 'personal' && (
                    <div className="flex flex-col gap-6 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('نام و نام خانوادگی', 'Full Name')}</label>
                                <div className="h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center text-[13px] font-bold text-slate-800 dark:text-slate-200">
                                    {profileInfo.fullName}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('نام کاربری / ایمیل', 'Username / Email')}</label>
                                <div className="h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center text-[13px] font-bold text-slate-800 dark:text-slate-200 dir-ltr justify-end">
                                    {profileInfo.username}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Fingerprint size={14} /> {t('نقش‌های اختصاص یافته به شخص (حقیقی/حقوقی)', 'Assigned Party Roles')}
                            </label>
                            <div className="min-h-[48px] p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-wrap gap-2 items-center">
                                {profileInfo.partyRoles.length > 0 ? profileInfo.partyRoles.map((role, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-md">
                                        {isRtl ? formatRoleFa(role) : role}
                                    </span>
                                )) : <span className="text-[12px] text-slate-400 px-2">{t('نقشی یافت نشد', 'No roles found')}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield size={14} /> {t('سطوح دسترسی سیستمی (کاربر)', 'System Access Roles')}
                            </label>
                            <div className="min-h-[48px] p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-wrap gap-2 items-center">
                                {profileInfo.userRoles.length > 0 ? profileInfo.userRoles.map((role, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-md">
                                        {role}
                                    </span>
                                )) : <span className="text-[12px] text-slate-400 px-2">{t('دسترسی خاصی تخصیص نیافته', 'No specific access assigned')}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* تب تنظیمات پایه */}
                {activeTab === 'preferences' && (
                    <div className="flex flex-col gap-6 max-w-xl">
                        <Alert 
                            type="info" 
                            message={t('این تنظیمات تنها برای حساب کاربری شما اعمال می‌شود و در تمامی دستگاه‌ها همگام‌سازی می‌گردد.', 'These settings apply only to your account and sync across all devices.')} 
                            className="mb-2"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SelectField 
                                size="sm" 
                                label={<span className="flex items-center gap-1.5"><Palette size={14}/> {t('تم رنگی سیستم', 'System Theme')}</span>}
                                value={preferences.theme} 
                                onChange={e => setPreferences({...preferences, theme: e.target.value})} 
                                options={themeOptions}
                                isRtl={isRtl} 
                            />
                            
                            <SelectField 
                                size="sm" 
                                label={<span className="flex items-center gap-1.5"><Globe size={14}/> {t('زبان پیش‌فرض', 'Default Language')}</span>}
                                value={preferences.language} 
                                onChange={e => setPreferences({...preferences, language: e.target.value})} 
                                options={languageOptions}
                                isRtl={isRtl} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SelectField 
                                size="sm" 
                                label={<span className="flex items-center gap-1.5"><CalendarDays size={14}/> {t('تقویم پیش‌فرض', 'Default Calendar')}</span>}
                                value={preferences.calendarType} 
                                onChange={e => setPreferences({...preferences, calendarType: e.target.value})} 
                                options={calendarOptions}
                                isRtl={isRtl} 
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                            <Button variant="primary" size="md" icon={Save} onClick={handleSavePreferences} isLoading={isLoading}>
                                {t('ذخیره تنظیمات', 'Save Preferences')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* تب تنظیمات مالی */}
                {activeTab === 'financial' && (
                    <div className="flex flex-col gap-6 max-w-xl">
                        <Alert 
                            type="info" 
                            message={t('تنظیم مقادیر پیش‌فرض در این بخش، باعث تسریع در ورود اطلاعات فرم‌های عملیاتی حوزه مالی می‌گردد.', 'Setting default values here will speed up data entry in financial operational forms.')} 
                            className="mb-2"
                        />
                        
                        <div className="grid grid-cols-1 gap-5">
                            <SelectField 
                                size="sm" 
                                label={<span className="flex items-center gap-1.5"><Tags size={14}/> {t('نوع هزینه پیش‌فرض (در ثبت تراکنش‌ها)', 'Default Cost Type')}</span>}
                                value={preferences.defaultCostTypeId} 
                                onChange={e => setPreferences({...preferences, defaultCostTypeId: e.target.value})} 
                                options={[{value: '', label: t('--- انتخاب نشده ---', '--- Not Selected ---')}, ...costTypes]}
                                isRtl={isRtl} 
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                            <Button variant="primary" size="md" icon={Save} onClick={handleSavePreferences} isLoading={isLoading}>
                                {t('ذخیره تنظیمات مالی', 'Save Financial Prefs')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* تب امنیت و رمز عبور */}
                {activeTab === 'security' && (
                    <div className="flex flex-col gap-6 max-w-md">
                        <div className="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <Lock size={16} className="text-amber-500" />
                                {t('تغییر رمز عبور', 'Change Password')}
                            </h4>
                            
                            {/* فیلد رمز فعلی معمولاً در Supabase نیاز نیست (در صورت لاگین بودن)، اما برای UI گذاشته شده */}
                            <TextField 
                                size="sm" 
                                type="password"
                                label={t('رمز عبور فعلی', 'Current Password')} 
                                value={passwords.current} 
                                onChange={e => setPasswords({...passwords, current: e.target.value})} 
                                isRtl={isRtl} 
                                dir="ltr"
                            />
                            
                            <TextField 
                                size="sm" 
                                type="password"
                                label={t('رمز عبور جدید', 'New Password')} 
                                value={passwords.new} 
                                onChange={e => setPasswords({...passwords, new: e.target.value})} 
                                isRtl={isRtl} 
                                dir="ltr"
                            />

                            <TextField 
                                size="sm" 
                                type="password"
                                label={t('تکرار رمز عبور جدید', 'Confirm New Password')} 
                                value={passwords.confirm} 
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                                isRtl={isRtl} 
                                dir="ltr"
                            />

                            <div className="pt-2 flex justify-end">
                                <Button variant="primary" size="sm" icon={Key} onClick={handleChangePassword} isLoading={isLoading}>
                                    {t('بروزرسانی رمز عبور', 'Update Password')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
          </div>

        </div>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.UserProfile = UserProfile;
})();