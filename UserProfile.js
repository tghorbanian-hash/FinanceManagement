/* Filename: UserProfile.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useRef } = React;
  
  const { 
    Button, PageHeader, 
    TextField, SelectField, 
    Toast, Alert
  } = window.DesignSystem || window.DSCore || window.DSForms || {};
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className, style: { display: 'inline-block', width: size, height: size } });
  const { 
    User = FallbackIcon, Settings = FallbackIcon, Shield = FallbackIcon, CreditCard = FallbackIcon, Save = FallbackIcon, 
    Key = FallbackIcon, Palette = FallbackIcon, Globe = FallbackIcon, CalendarDays = FallbackIcon, Building2 = FallbackIcon, 
    Tags = FallbackIcon, Fingerprint = FallbackIcon, Lock = FallbackIcon, Camera = FallbackIcon, Loader2 = FallbackIcon, Upload = FallbackIcon,
    Sun = FallbackIcon, Moon = FallbackIcon, Monitor = FallbackIcon, Check = FallbackIcon
  } = window.LucideIcons || {};
  
  const supabase = window.supabase;

  const UserProfile = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);
    
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    const [profileInfo, setProfileInfo] = useState({
      fullName: 'در حال بارگذاری...',
      username: 'در حال بارگذاری...',
      partyRoles: [],
      userRoles: [],
      department: '---',
      avatarUrl: null
    });

    const [preferences, setPreferences] = useState({
      theme: 'system',
      language: 'fa',
      calendarType: 'jalali',
      defaultCostTypeId: ''
    });

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [costTypes, setCostTypes] = useState([]);
    
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    useEffect(() => {
      const initProfile = async () => {
         try {
             let uId = window.NavigationSystem?.currentUser?.id;
             if (!uId && supabase) {
                const { data } = await supabase.auth.getSession();
                uId = data?.session?.user?.id;
             }
             
             if (uId) {
                setCurrentUserId(uId);
                fetchUserData(uId);
                fetchPreferences(uId);
                fetchCostTypes();
             } else {
                setProfileInfo(prev => ({ ...prev, fullName: 'کاربر یافت نشد', username: '-' }));
             }
         } catch (err) {
             console.error("Auth init error:", err);
             setProfileInfo(prev => ({ ...prev, fullName: 'خطای دسترسی', username: '-' }));
         }
      };
      initProfile();
    }, []);

    const fetchUserData = async (userId) => {
      if (!supabase || !userId) return;
      try {
        let userResult = null;
        if (typeof supabase.schema === 'function') {
            userResult = await supabase.schema('sec').from('users').select('id, username, full_name, party_id, avatar_url').eq('id', userId).single();
        }
        
        if (!userResult || userResult.error) {
            userResult = await supabase.from('sec_users').select('id, username, full_name, party_id, avatar_url').eq('id', userId).single();
        }
        
        if (!userResult || userResult.error) {
            userResult = await supabase.from('users').select('id, username, full_name, party_id, avatar_url').eq('id', userId).single();
        }

        if (userResult.error) throw userResult.error;
        
        const userData = userResult.data;
        let partyRoles = [];
        let fetchedFullName = userData?.full_name || '';
        let departmentName = '---';

        if (userData?.party_id) {
          const { data: partyData, error: partyErr } = await supabase
            .from('parties')
            .select('id, first_name, last_name, company_name, party_type, roles')
            .eq('id', userData.party_id)
            .single();
          
          if (!partyErr && partyData) {
            partyRoles = Array.isArray(partyData.roles) ? partyData.roles : (typeof partyData.roles === 'string' ? JSON.parse(partyData.roles) : []);
            if (partyData.party_type === 'legal') {
                fetchedFullName = partyData.company_name || fetchedFullName;
            } else {
                fetchedFullName = `${partyData.first_name || ''} ${partyData.last_name || ''}`.trim() || fetchedFullName;
            }
          }

          const { data: personnelData, error: persErr } = await supabase
            .from('fm_org_chart_personnel')
            .select('node_id, from_date, to_date')
            .eq('person_id', userData.party_id);
            
          if (!persErr && personnelData && personnelData.length > 0) {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
            const todayDash = new Date().toISOString().split('T')[0];
            let activeNodeId = null;
            
            for (const p of personnelData) {
               const fDate = p.from_date || '1000-01-01';
               const tDate = p.to_date || '9999-12-31';
               if ((today >= fDate || todayDash >= fDate) && (today <= tDate || todayDash <= tDate)) {
                   activeNodeId = p.node_id;
                   break;
               }
            }

            if (activeNodeId) {
               const { data: nodeData } = await supabase
                 .from('fm_org_chart_nodes')
                 .select('title, is_active')
                 .eq('id', activeNodeId)
                 .single();
                 
               if (nodeData && nodeData.is_active) {
                  departmentName = nodeData.title;
               }
            }
          }
        }

        let userRoles = [];
        const { data: sysRolesData } = await supabase
          .from('sec_user_roles')
          .select('role_id')
          .eq('user_id', userId);
          
        if (sysRolesData && sysRolesData.length > 0) {
            const roleIds = sysRolesData.map(r => r.role_id);
            const { data: rolesRows } = await supabase
                .from('sec_roles')
                .select('title')
                .in('id', roleIds);
                
            if (rolesRows) {
                userRoles = rolesRows.map(r => r.title).filter(Boolean);
            }
        }

        setProfileInfo(prev => ({
          ...prev,
          fullName: fetchedFullName || '---',
          username: userData?.username || '---',
          partyRoles,
          userRoles,
          department: departmentName,
          avatarUrl: userData?.avatar_url || null
        }));
      } catch (err) {
        console.error('Error in fetchUserData:', err);
        setProfileInfo(prev => ({
          ...prev,
          fullName: 'خطا در دریافت اطلاعات',
          username: 'خطا'
        }));
      }
    };

    const fetchPreferences = async (userId) => {
      if (!supabase || !userId) return;
      try {
        const { data } = await supabase
          .from('fm_user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data) {
          setPreferences({
            theme: data.theme || 'system',
            language: data.language || 'fa',
            calendarType: data.calendar_type || 'jalali',
            defaultCostTypeId: data.default_cost_type_id || ''
          });
        }
      } catch (err) {}
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
      } catch (err) {}
    };

    const handleAvatarUpload = async (event) => {
      if (!currentUserId) return;
      try {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        setIsUploadingAvatar(true);

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) {
             console.error("Storage upload error:", uploadError);
             throw new Error(isRtl ? 'خطا در آپلود عکس. آیا باکت avatars در Storage وجود دارد و public است؟' : 'Storage upload failed.');
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        let updateResult = null;
        if (typeof supabase.schema === 'function') {
             updateResult = await supabase.schema('sec').from('users').update({ avatar_url: publicUrl }).eq('id', currentUserId);
        }
        if (!updateResult || updateResult.error) {
             updateResult = await supabase.from('sec_users').update({ avatar_url: publicUrl }).eq('id', currentUserId);
        }
        if (!updateResult || updateResult.error) {
             updateResult = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', currentUserId);
        }

        if (updateResult && updateResult.error) {
             console.error("Database update error:", updateResult.error);
             throw new Error(isRtl ? 'خطا در ذخیره آدرس عکس در دیتابیس.' : 'Database update failed.');
        }

        setProfileInfo(prev => ({ ...prev, avatarUrl: publicUrl }));
        showToast(t('تصویر پروفایل با موفقیت بروزرسانی شد.', 'Profile picture updated successfully.'));
      } catch (error) {
        showToast(error.message || t('خطا در آپلود تصویر.', 'Error uploading image.'), 'error');
      } finally {
        setIsUploadingAvatar(false);
      }
    };

    const handleSavePreferences = async () => {
      if (!supabase || !currentUserId) return;
      setIsLoading(true);
      try {
        const payload = {
          user_id: currentUserId,
          theme: preferences.theme,
          language: preferences.language,
          calendar_type: preferences.calendarType,
          default_cost_type_id: preferences.defaultCostTypeId || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('fm_user_preferences').upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        
        if (preferences.theme === 'dark') document.documentElement.classList.add('dark');
        else if (preferences.theme === 'light') document.documentElement.classList.remove('dark');
        else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        }

        showToast(t('تنظیمات با موفقیت ذخیره شد.', 'Preferences saved successfully.'));
      } catch (err) {
        showToast(t('خطا در ذخیره تنظیمات.', 'Error saving preferences.'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleChangePassword = async () => {
      if (!passwords.new || !passwords.confirm) return showToast(t('رمز عبور جدید را وارد کنید.', 'Enter new password.'), 'error');
      if (passwords.new !== passwords.confirm) return showToast(t('تکرار رمز عبور تطابق ندارد.', 'Passwords do not match.'), 'error');
      
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        if (error) throw error;
        showToast(t('رمز عبور با موفقیت تغییر کرد.', 'Password changed successfully.'));
        setPasswords({ current: '', new: '', confirm: '' });
      } catch (err) {
        showToast(t('خطا در تغییر رمز عبور. با مدیر سیستم تماس بگیرید.', 'Error changing password.'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const tabs = [
      { id: 'personal', label: t('اطلاعات کاربری', 'User Info'), icon: User },
      { id: 'preferences', label: t('تنظیمات پایه', 'Basic Preferences'), icon: Settings },
      { id: 'financial', label: t('تنظیمات مالی', 'Financial Prefs'), icon: CreditCard },
      { id: 'security', label: t('امنیت و رمز', 'Security'), icon: Shield }
    ];

    const formatRoleFa = (role) => {
        const rolesMap = { 'system_user': 'کاربر سیستم', 'vendor': 'تامین‌کننده', 'supplier': 'تامین‌کننده', 'customer': 'مشتری', 'employee': 'کارمند', 'broker': 'بروکر', 'shareholder': 'سهامدار', 'exchange': 'صرافی' };
        return rolesMap[role.toLowerCase()] || role;
    };

    const SelectionCard = ({ id, icon: Icon, label, selected, onClick }) => (
        <button 
            type="button"
            onClick={() => onClick(id)}
            className={`relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                selected 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm scale-[1.02]' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
        >
            <Icon size={26} strokeWidth={selected ? 2.5 : 2} className={selected ? 'text-indigo-600 dark:text-indigo-400' : ''} />
            <span className="text-[12px] font-bold">{label}</span>
            {selected && (
                <div className="absolute top-2.5 right-2.5 text-indigo-500 animate-in zoom-in">
                    <Check size={16} strokeWidth={3} />
                </div>
            )}
        </button>
    );

    return (
      <div className="flex flex-col h-full p-2 md:p-3 bg-slate-100 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('پروفایل کاربری', 'User Profile')} 
          icon={User}
          description={t('مدیریت اطلاعات و تنظیمات سیستم', 'Manage info and system preferences')}
          language={language}
          breadcrumbs={[{ label: t('داشبورد', 'Dashboard') }, { label: t('پروفایل من', 'My Profile') }]}
        />

        <div className="flex-1 flex flex-col md:flex-row gap-2 mt-2 min-h-0">
          
          <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center text-center shadow-sm shrink-0">
                <div className="relative group w-20 h-20 mb-3">
                  <div className="w-full h-full rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                      {isUploadingAvatar ? (
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                      ) : profileInfo.avatarUrl ? (
                        <img src={profileInfo.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} strokeWidth={1.5} />
                      )}
                  </div>
                  <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                      <Camera size={18} className="mb-1" />
                      <span className="text-[9px] font-bold">{t('تغییر تصویر', 'Change')}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} ref={fileInputRef} disabled={isUploadingAvatar} />
                  </label>
                </div>
                <h2 className="text-[14px] font-black text-slate-800 dark:text-white mb-0.5">{profileInfo.fullName}</h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 dir-ltr mb-3 truncate w-full">{profileInfo.username}</p>
                <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{profileInfo.department}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 flex flex-col gap-1 shadow-sm shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        {tab.label}
                    </button>
                ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
                <h3 className="text-[13px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                    {React.createElement(tabs.find(t => t.id === activeTab)?.icon || User, { size: 16, className: 'text-indigo-500' })}
                    {tabs.find(t => t.id === activeTab)?.label}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                
                {activeTab === 'personal' && (
                    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('نام کامل', 'Full Name')}</label>
                                <div className="h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center text-[12px] font-bold text-slate-800 dark:text-slate-200">
                                    {profileInfo.fullName}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('نام کاربری', 'Username')}</label>
                                <div className="h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center text-[12px] font-bold text-slate-800 dark:text-slate-200 dir-ltr justify-end">
                                    {profileInfo.username}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full my-1"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Fingerprint size={16} className="text-blue-500" /> {t('نقش‌های شخص (حقیقی/حقوقی)', 'Party Roles')}
                              </label>
                              <div className="min-h-[42px] p-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg flex flex-wrap gap-1.5 items-center">
                                  {profileInfo.partyRoles.length > 0 ? profileInfo.partyRoles.map((role, idx) => (
                                      <span key={idx} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-md shadow-sm border border-blue-200 dark:border-blue-800/50">
                                          {isRtl ? formatRoleFa(role) : role}
                                      </span>
                                  )) : <span className="text-[11px] text-slate-400 px-1">{t('ندارد', 'None')}</span>}
                              </div>
                          </div>

                          <div className="flex flex-col gap-2">
                              <label className="text-[12px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Shield size={16} className="text-emerald-500" /> {t('دسترسی‌های سیستمی', 'System Roles')}
                              </label>
                              <div className="min-h-[42px] p-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-lg flex flex-wrap gap-1.5 items-center">
                                  {profileInfo.userRoles.length > 0 ? profileInfo.userRoles.map((role, idx) => (
                                      <span key={idx} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-md shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                                          {role}
                                      </span>
                                  )) : <span className="text-[11px] text-slate-400 px-1">{t('ندارد', 'None')}</span>}
                              </div>
                          </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="flex flex-col gap-6 max-w-4xl animate-in fade-in duration-300">
                        <Alert type="info" message={t('تنظیمات پایه‌ای مختص به حساب کاربری شما که در تمامی بخش‌های نرم‌افزار اعمال می‌شود.', 'Basic settings applied to your account across the entire software.')} className="mb-2" />
                        
                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Palette size={18} className="text-indigo-500" /> {t('تم رنگی سیستم', 'System Theme')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <SelectionCard id="light" icon={Sun} label={t('روشن', 'Light')} selected={preferences.theme === 'light'} onClick={(id) => setPreferences({...preferences, theme: id})} />
                                <SelectionCard id="dark" icon={Moon} label={t('تاریک', 'Dark')} selected={preferences.theme === 'dark'} onClick={(id) => setPreferences({...preferences, theme: id})} />
                                <SelectionCard id="system" icon={Monitor} label={t('خودکار (سیستم)', 'System Default')} selected={preferences.theme === 'system'} onClick={(id) => setPreferences({...preferences, theme: id})} />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full"></div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Globe size={18} className="text-indigo-500" /> {t('زبان پیش‌فرض', 'Default Language')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SelectionCard id="fa" icon={Globe} label="فارسی (Persian)" selected={preferences.language === 'fa'} onClick={(id) => setPreferences({...preferences, language: id})} />
                                <SelectionCard id="en" icon={Globe} label="English" selected={preferences.language === 'en'} onClick={(id) => setPreferences({...preferences, language: id})} />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full"></div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <CalendarDays size={18} className="text-indigo-500" /> {t('تقویم پیش‌فرض', 'Default Calendar')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SelectionCard id="jalali" icon={CalendarDays} label={t('شمسی (Jalali)', 'Jalali')} selected={preferences.calendarType === 'jalali'} onClick={(id) => setPreferences({...preferences, calendarType: id})} />
                                <SelectionCard id="gregorian" icon={CalendarDays} label={t('میلادی (Gregorian)', 'Gregorian')} selected={preferences.calendarType === 'gregorian'} onClick={(id) => setPreferences({...preferences, calendarType: id})} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300 max-w-xl">
                        <Alert type="info" message={t('این تنظیمات در ثبت اسناد مالی به عنوان مقادیر پیش‌فرض استفاده می‌شوند.', 'These settings are used as default values in financial documents.')} className="mb-2" />
                        <SelectField 
                            size="md" 
                            label={t('نوع هزینه پیش‌فرض', 'Default Cost Type')}
                            value={preferences.defaultCostTypeId} 
                            onChange={e => setPreferences({...preferences, defaultCostTypeId: e.target.value})} 
                            options={[{value: '', label: t('انتخاب نشده...', 'Not Selected...')}, ...costTypes]}
                            isRtl={isRtl} 
                        />
                    </div>
                )}

                {activeTab === 'security' && (
                    <form autoComplete="off" onSubmit={e => e.preventDefault()} className="flex flex-col gap-4 max-w-sm animate-in fade-in duration-300">
                        <input type="text" name="hidden_username" autoComplete="off" style={{ display: 'none' }} />
                        <input type="password" name="hidden_password" autoComplete="new-password" style={{ display: 'none' }} />
                        
                        <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-3.5 rounded-xl mb-2 shadow-sm">
                          <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed text-justify">
                             {t('راهنما: رمز عبور باید بین ۸ تا ۱۴ کاراکتر باشد و شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک علامت (مانند @, #, $) باشد.', 'Hint: Password must be 8-14 chars, including uppercase, lowercase, number, and symbol.')}
                          </p>
                        </div>

                        <TextField 
                            size="md" type="password"
                            label={t('رمز عبور فعلی', 'Current Password')} 
                            value={passwords.current} 
                            onChange={e => setPasswords({...passwords, current: e.target.value})} 
                            isRtl={isRtl} dir="ltr"
                            autoComplete="new-password"
                        />
                        <TextField 
                            size="md" type="password"
                            label={t('رمز عبور جدید', 'New Password')} 
                            value={passwords.new} 
                            onChange={e => setPasswords({...passwords, new: e.target.value})} 
                            isRtl={isRtl} dir="ltr"
                            autoComplete="new-password"
                        />
                        <TextField 
                            size="md" type="password"
                            label={t('تکرار رمز جدید', 'Confirm Password')} 
                            value={passwords.confirm} 
                            onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                            isRtl={isRtl} dir="ltr"
                            autoComplete="new-password"
                        />
                    </form>
                )}

            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end items-center shrink-0 rounded-b-xl gap-2 h-[60px]">
                {activeTab === 'personal' && (
                    <span className="text-[11px] text-slate-500 font-bold ml-auto">{t('اطلاعات شخصی فقط جهت نمایش است.', 'Personal info is read-only.')}</span>
                )}
                {(activeTab === 'preferences' || activeTab === 'financial') && (
                    <Button variant="primary" size="md" icon={Save} onClick={handleSavePreferences} isLoading={isLoading}>
                        {t('ذخیره تغییرات', 'Save Changes')}
                    </Button>
                )}
                {activeTab === 'security' && (
                    <Button variant="primary" size="md" icon={Key} onClick={handleChangePassword} isLoading={isLoading}>
                        {t('تغییر رمز عبور', 'Update Password')}
                    </Button>
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