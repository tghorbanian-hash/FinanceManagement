/* Filename: security/UserAccess.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Lock = FallbackIcon, Save = FallbackIcon, 
    Check = FallbackIcon, AlertCircle = FallbackIcon, User = FallbackIcon,
    Zap = FallbackIcon, X = FallbackIcon, Plus = FallbackIcon
  } = LucideIcons;

  const DesignSystem = window.DesignSystem || window.DSCore || {};
  const { 
      Modal = () => null, 
      Button = () => null, 
      Tree = () => null 
  } = DesignSystem;

  const supabase = window.supabase;

  const ACTION_DICT = {
    'read': { fa: 'مشاهده اطلاعات', en: 'Read' },
    'create': { fa: 'ایجاد', en: 'Create' },
    'update': { fa: 'ویرایش', en: 'Update' },
    'delete': { fa: 'حذف', en: 'Delete' },
    'print': { fa: 'چاپ اطلاعات', en: 'Print' },
    'import': { fa: 'وارد نمودن اکسل', en: 'Excel Import' },
    'export': { fa: 'خروجی اکسل', en: 'Excel Export' },
    'approve': { fa: 'تغییر وضعیت / تایید', en: 'Approval' },
    'assign_detail': { fa: 'تخصیص کد تفصیلی', en: 'Detail Assignment' }
  };

  const SCOPE_DICT = {
    'docTypes': { fa: 'انواع سند مجاز', en: 'Allowed Document Types' },
    'branches': { fa: 'شعب مجاز', en: 'Allowed Branches' }
  };

  const UserAccess = ({ isOpen, onClose, user, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const [isLoading, setIsLoading] = useState(false);
    const [menusData, setMenusData] = useState([]);
    const [scopesData, setScopesData] = useState({ docTypes: [], branches: [] });
    
    const [allRoles, setAllRoles] = useState([]);
    const [assignedRoles, setAssignedRoles] = useState([]);
    const [globalRolePerms, setGlobalRolePerms] = useState({}); 
    const [directPerms, setDirectPerms] = useState({});
    
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [activeSource, setActiveSource] = useState('direct');

    useEffect(() => {
      if (isOpen && user) {
        fetchData();
      } else {
        setSelectedMenu(null);
        setActiveSource('direct');
        setAssignedRoles([]);
        setDirectPerms({});
      }
    }, [isOpen, user]);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const safeFetch = async (promise) => {
            try {
                const res = await promise;
                return res.error ? { data: [] } : res;
            } catch (e) {
                return { data: [] };
            }
        };

        const [
            { data: dbMenus },
            { data: dtData },
            { data: brData },
            { data: rolesData },
            { data: userRolesData },
            { data: allPerms }
        ] = await Promise.all([
            supabase.from('menus').select('*').order('display_order', { ascending: true }),
            safeFetch(supabase.from('fm_doc_types').select('id, title').eq('is_active', true)),
            safeFetch(supabase.from('fm_branches').select('id, title').eq('is_active', true)),
            supabase.from('sec_roles').select('*'),
            supabase.from('sec_user_roles').select('role_id').eq('user_id', user.id),
            supabase.from('sec_permissions').select('*')
        ]);

        if (dbMenus) setMenusData(dbMenus);
        setScopesData({
            docTypes: dtData || [],
            branches: brData || []
        });

        if (rolesData) setAllRoles(rolesData);
        
        const currentAssigned = userRolesData ? userRolesData.map(ur => ur.role_id) : [];
        setAssignedRoles(currentAssigned);

        const rPerms = {};
        const dPerms = {};

        if (allPerms) {
            allPerms.forEach(p => {
                const actions = typeof p.actions === 'string' ? JSON.parse(p.actions || '[]') : (p.actions || []);
                const scopes = typeof p.data_scopes === 'string' ? JSON.parse(p.data_scopes || '{}') : (p.data_scopes || {});
                
                if (p.role_id) {
                    if (!rPerms[p.role_id]) rPerms[p.role_id] = [];
                    rPerms[p.role_id].push({ menu_id: p.menu_id, actions, scopes });
                }
                
                if (p.user_id === user.id) {
                    dPerms[p.menu_id] = { id: p.id, actions, scopes };
                }
            });
        }
        
        setGlobalRolePerms(rPerms);
        setDirectPerms(dPerms);

      } catch (err) {
        console.error('Fetch Access Data Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const getMenuLabel = useCallback((m) => {
        if (!m) return '';
        return isRtl ? (m.label_fa || m.title || m.name) : (m.label_en || m.title || m.name);
    }, [isRtl]);

    const mappedTreeData = useMemo(() => {
        return menusData.map(m => ({
            ...m,
            displayLabel: getMenuLabel(m)
        }));
    }, [menusData, getMenuLabel]);

    const handleSavePermissions = async () => {
      setIsLoading(true);
      try {
          await supabase.from('sec_user_roles').delete().eq('user_id', user.id);
          
          if (assignedRoles.length > 0) {
              const userRolesPayload = assignedRoles.map(rId => ({ user_id: user.id, role_id: rId }));
              await supabase.from('sec_user_roles').insert(userRolesPayload);
          }

          const inserts = [];
          const updates = [];
          const deletes = [];

          Object.entries(directPerms).forEach(([menuId, data]) => {
              const hasActions = data.actions.length > 0;
              const hasScopes = Object.keys(data.scopes).some(k => data.scopes[k]?.length > 0);
              
              if (hasActions || hasScopes) {
                  if (data.id) {
                      updates.push({ id: data.id, user_id: user.id, menu_id: menuId, actions: data.actions, data_scopes: data.scopes });
                  } else {
                      inserts.push({ user_id: user.id, menu_id: menuId, actions: data.actions, data_scopes: data.scopes });
                  }
              } else if (data.id) {
                  deletes.push(data.id);
              }
          });

          if (deletes.length > 0) await supabase.from('sec_permissions').delete().in('id', deletes);
          if (inserts.length > 0) await supabase.from('sec_permissions').insert(inserts);
          if (updates.length > 0) {
              for (const u of updates) {
                  await supabase.from('sec_permissions').update({ actions: u.actions, data_scopes: u.data_scopes }).eq('id', u.id);
              }
          }
          
          onClose();
      } catch (err) {
          console.error("Save perms error:", err);
          alert(t('خطا در ذخیره دسترسی‌ها', 'Error saving permissions'));
      } finally {
          setIsLoading(false);
      }
    };

    const handleAddRole = (roleId) => {
        if (!roleId || assignedRoles.includes(roleId)) return;
        setAssignedRoles(prev => [...prev, roleId]);
    };

    const handleRemoveRole = (roleId) => {
        setAssignedRoles(prev => prev.filter(id => id !== roleId));
        if (activeSource === roleId) setActiveSource('direct');
    };

    const toggleDirectAction = (actionId) => {
        if (!selectedMenu || activeSource !== 'direct') return;
        setDirectPerms(prev => {
            const current = prev[selectedMenu.id] || { actions: [], scopes: {} };
            const hasAction = current.actions.includes(actionId);
            return {
                ...prev,
                [selectedMenu.id]: {
                    ...current,
                    actions: hasAction ? current.actions.filter(a => a !== actionId) : [...current.actions, actionId]
                }
            };
        });
    };

    const toggleDirectScope = (scopeKey, valueId) => {
        if (!selectedMenu || activeSource !== 'direct') return;
        setDirectPerms(prev => {
            const current = prev[selectedMenu.id] || { actions: [], scopes: {} };
            const scopeArr = current.scopes[scopeKey] || [];
            const hasVal = scopeArr.includes(valueId);
            return {
                ...prev,
                [selectedMenu.id]: {
                    ...current,
                    scopes: {
                        ...current.scopes,
                        [scopeKey]: hasVal ? scopeArr.filter(v => v !== valueId) : [...scopeArr, valueId]
                    }
                }
            };
        });
    };

    if (!isOpen) return null;

    const availActions = selectedMenu ? (typeof selectedMenu.available_actions === 'string' ? JSON.parse(selectedMenu.available_actions || '[]') : (selectedMenu.available_actions || [])) : [];
    const availScopes = selectedMenu ? (typeof selectedMenu.available_scopes === 'string' ? JSON.parse(selectedMenu.available_scopes || '[]') : (selectedMenu.available_scopes || [])) : [];

    const activeRolesForSelectedMenu = selectedMenu ? assignedRoles.filter(rId => {
        const perms = globalRolePerms[rId] || [];
        const menuPerm = perms.find(p => p.menu_id === selectedMenu.id);
        return menuPerm && (menuPerm.actions.length > 0 || Object.keys(menuPerm.scopes).length > 0);
    }) : [];

    let currentViewActions = [];
    let currentViewScopes = {};

    if (selectedMenu) {
        if (activeSource === 'direct') {
            const dPerm = directPerms[selectedMenu.id] || { actions: [], scopes: {} };
            currentViewActions = dPerm.actions;
            currentViewScopes = dPerm.scopes;
        } else {
            const rPerms = globalRolePerms[activeSource] || [];
            const menuPerm = rPerms.find(p => p.menu_id === selectedMenu.id);
            if (menuPerm) {
                currentViewActions = menuPerm.actions;
                currentViewScopes = menuPerm.scopes;
            }
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('مدیریت دسترسی‌های کاربر:', 'User Permissions Management:')} ${user?.username || ''}`} width="max-w-6xl" language={language}>
            <div className="flex flex-col h-[600px] bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                
                <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto w-full">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0">
                            <User size={16} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {t('نقش‌های اختصاص یافته:', 'Assigned Roles:')}
                        </span>
                        <div className="flex gap-1 flex-wrap items-center">
                            {assignedRoles.map(rId => {
                                const role = allRoles.find(r => r.id === rId);
                                return (
                                    <div key={rId} className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm">
                                        {role?.title || rId}
                                        <button onClick={() => handleRemoveRole(rId)} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                                            <X size={10} strokeWidth={3}/>
                                        </button>
                                    </div>
                                );
                            })}
                            {assignedRoles.length === 0 && <span className="text-[10px] text-slate-400 italic px-2">{t('بدون نقش', 'No roles')}</span>}
                        </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md p-1">
                        <select 
                            className="bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-300 outline-none w-48 cursor-pointer"
                            onChange={e => { if(e.target.value) handleAddRole(e.target.value); e.target.value = ''; }}
                        >
                            <option value="">{t('+ افزودن نقش جدید...', '+ Add new role...')}</option>
                            {allRoles.filter(r => !assignedRoles.includes(r.id)).map(r => (
                                <option key={r.id} value={r.id}>{r.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/3 border-r md:border-b-0 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-hidden shrink-0 p-1">
                        {menusData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <AlertCircle size={24} className="opacity-50" />
                                <span className="text-[11px]">{t('در حال دریافت یا منویی وجود ندارد.', 'Loading or no menus available.')}</span>
                            </div>
                        ) : (
                            <Tree 
                                data={mappedTreeData}
                                idField="id" 
                                parentField="parent_id" 
                                displayField="displayLabel" 
                                activeField="is_visible"
                                selectedId={selectedMenu?.id}
                                onSelect={(menu) => {
                                    setSelectedMenu(menu);
                                    setActiveSource('direct');
                                }}
                                language={language}
                            />
                        )}
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col overflow-hidden bg-white dark:bg-slate-900 relative">
                        {!selectedMenu ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 dark:bg-slate-900/50">
                                <Shield size={48} className="opacity-10 mb-4 text-indigo-500" />
                                <span className="text-[13px] font-bold text-slate-500">{t('برای بررسی یا تنظیم دسترسی، یک فرم از درخت انتخاب کنید.', 'Select a form from the tree to view or configure permissions.')}</span>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 flex flex-col gap-3 shadow-sm z-10">
                                    <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                        {getMenuLabel(selectedMenu)}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div 
                                            onClick={() => setActiveSource('direct')}
                                            className={`cursor-pointer px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5
                                            ${activeSource === 'direct' 
                                                ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                                        >
                                            <Zap size={12}/> {t('دسترسی مستقیم (قابل ویرایش)', 'Direct Access (Editable)')}
                                        </div>
                                        
                                        {activeRolesForSelectedMenu.map(rId => {
                                            const role = allRoles.find(r => r.id === rId);
                                            const isActive = activeSource === rId;
                                            return (
                                                <div 
                                                    key={rId}
                                                    onClick={() => setActiveSource(rId)}
                                                    className={`cursor-pointer px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5
                                                    ${isActive 
                                                        ? 'bg-purple-100 text-purple-700 border-purple-300 shadow-sm ring-1 ring-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                                                >
                                                    <Shield size={12}/> {t('نقش:', 'Role:')} {role?.title || rId}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30 dark:bg-slate-900/50">
                                    {activeSource !== 'direct' && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 shadow-sm font-medium">
                                            <Lock size={14} className="shrink-0"/>
                                            {t('شما در حال مشاهده دسترسی‌های به ارث رسیده از یک نقش هستید. این موارد فقط در بخش "مدیریت نقش‌ها" قابل تغییر است.', 'Viewing inherited role permissions. These can only be changed in Role Management.')}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${activeSource === 'direct' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'}`}><Shield size={14}/></div>
                                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('عملیات مجاز (Actions)', 'Allowed Actions')}</span>
                                        </div>
                                        
                                        {availActions.length === 0 ? (
                                            <div className="text-[11px] text-slate-400 italic bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                {t('هیچ عملیات خاصی برای این فرم تعریف نشده است.', 'No specific actions defined for this form.')}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {availActions.map(actionId => {
                                                    const isChecked = currentViewActions.includes(actionId);
                                                    const labelObj = ACTION_DICT[actionId];
                                                    const displayLabel = labelObj ? labelObj[isRtl ? 'fa' : 'en'] : actionId;
                                                    
                                                    if (activeSource !== 'direct') {
                                                        return (
                                                            <div key={actionId} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all select-none bg-white dark:bg-slate-800 shadow-sm ${isChecked ? 'border-purple-300 dark:border-purple-700 opacity-100' : 'border-slate-100 dark:border-slate-700 opacity-40'}`}>
                                                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-purple-500 border-purple-500 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-transparent'}`}>
                                                                    <Check size={12} strokeWidth={3}/>
                                                                </div>
                                                                <span className={`text-[12px] ${isChecked ? 'font-bold text-purple-900 dark:text-purple-300' : 'text-slate-500 font-medium'}`}>
                                                                    {displayLabel}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <label key={actionId} onClick={() => toggleDirectAction(actionId)} className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all select-none shadow-sm ${isChecked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                                                                {isChecked && <Check size={12} strokeWidth={3}/>}
                                                            </div>
                                                            <span className={`text-[12px] ${isChecked ? 'font-bold text-blue-900 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                                                                {displayLabel}
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {availScopes.length > 0 && (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center ${activeSource === 'direct' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'}`}><Lock size={14}/></div>
                                                <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('محدودیت دسترسی به داده‌ها', 'Data Scope Restrictions')}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {availScopes.map(scopeId => {
                                                    const scopeDataList = scopesData[scopeId] || [];
                                                    const labelObj = SCOPE_DICT[scopeId];
                                                    const displayLabel = labelObj ? labelObj[isRtl ? 'fa' : 'en'] : scopeId;
                                                    
                                                    return (
                                                        <div key={scopeId} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
                                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300 flex justify-between items-center">
                                                                <span>{displayLabel}</span>
                                                                {activeSource !== 'direct' && <Shield size={12} className="text-purple-400 opacity-50"/>}
                                                            </div>
                                                            <div className="p-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                                {scopeDataList.length > 0 ? scopeDataList.map(item => {
                                                                    const isSelected = currentViewScopes[scopeId]?.includes(item.id);
                                                                    
                                                                    if (activeSource !== 'direct') {
                                                                        if (!isSelected) return null; 
                                                                        return (
                                                                            <div key={item.id} className="px-2.5 py-1 text-[11px] rounded-full border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300 select-none flex items-center gap-1.5 font-bold shadow-sm">
                                                                                <Check size={10} strokeWidth={3}/> {item.title}
                                                                            </div>
                                                                        )
                                                                    }

                                                                    return (
                                                                        <div key={item.id} onClick={() => toggleDirectScope(scopeId, item.id)} className={`px-2.5 py-1 text-[11px] rounded-full border cursor-pointer select-none transition-all flex items-center gap-1.5 ${isSelected ? 'bg-blue-500 border-blue-500 text-white font-bold shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}>
                                                                            {isSelected && <Check size={10} strokeWidth={3}/>}
                                                                            {item.title}
                                                                        </div>
                                                                    )
                                                                }) : (
                                                                    <span className="text-[10px] text-slate-400 italic">{t('داده‌ای یافت نشد.', 'No data found.')}</span>
                                                                )}
                                                                {activeSource !== 'direct' && (!currentViewScopes[scopeId] || currentViewScopes[scopeId].length === 0) && (
                                                                    <span className="text-[10px] text-slate-400 italic">{t('محدودیتی اعمال نشده است.', 'No restrictions applied.')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                    <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                        {t('تمامی دسترسی‌های مستقیم و نقش‌های اختصاص یافته پس از ذخیره، برای کاربر فعال می‌شوند.', 'All direct permissions and role assignments will be applied upon saving.')}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onClose}>{t('انصراف', 'Cancel')}</Button>
                        <Button variant="primary" size="sm" className="flex-1 sm:flex-none" icon={Save} onClick={handleSavePermissions} isLoading={isLoading}>{t('ذخیره تغییرات', 'Save Changes')}</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
  };

  window.UserAccess = UserAccess;
})();