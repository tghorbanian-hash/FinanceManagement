/* Filename: security/UserAccess.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Lock = FallbackIcon, Save = FallbackIcon, 
    Check = FallbackIcon, AlertCircle = FallbackIcon, User = FallbackIcon,
    Zap = FallbackIcon, X = FallbackIcon, Plus = FallbackIcon, ChevronLeft = FallbackIcon,
    FileText = FallbackIcon, Info = FallbackIcon, Search = FallbackIcon
  } = LucideIcons;

  const DesignSystem = window.DesignSystem || window.DSCore || {};
  const { 
      Modal = () => null, 
      Button = () => null,
      DataGrid = () => null
  } = DesignSystem;

  const supabase = window.supabase;

  const AVAILABLE_ACTIONS = [
    { id: 'read', label: { fa: 'مشاهده اطلاعات', en: 'Read' } },
    { id: 'create', label: { fa: 'ایجاد', en: 'Create' } },
    { id: 'update', label: { fa: 'ویرایش', en: 'Update' } },
    { id: 'delete', label: { fa: 'حذف', en: 'Delete' } },
    { id: 'print', label: { fa: 'چاپ اطلاعات', en: 'Print' } },
    { id: 'import', label: { fa: 'وارد نمودن اکسل', en: 'Excel Import' } },
    { id: 'export', label: { fa: 'خروجی اکسل', en: 'Excel Export' } },
    { id: 'approve', label: { fa: 'تغییر وضعیت / تایید', en: 'Approval' } },
    { id: 'assign_detail', label: { fa: 'تخصیص کد تفصیلی', en: 'Detail Assignment' } }
  ];

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
    
    const [selectedPermDetail, setSelectedPermDetail] = useState(null);
    const [activeSourceId, setActiveSourceId] = useState(null);

    const [formSearchTerm, setFormSearchTerm] = useState('');
    const [showFormResults, setShowFormResults] = useState(false);

    useEffect(() => {
      if (isOpen && user) {
        fetchData();
      } else {
        setSelectedPermDetail(null);
        setActiveSourceId(null);
        setAssignedRoles([]);
        setDirectPerms({});
        setFormSearchTerm('');
        setShowFormResults(false);
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

    const getMenuFullPath = useCallback((menuId) => {
        const pathParts = [];
        let current = menusData.find(m => m.id === menuId);
        while (current) {
            pathParts.unshift(getMenuLabel(current));
            current = menusData.find(m => m.id === current.parent_id);
        }
        return pathParts.join(' / ');
    }, [menusData, getMenuLabel]);

    const allSystemForms = useMemo(() => {
        return menusData
            .map(m => ({
                id: m.id,
                label: getMenuLabel(m),
                fullPath: getMenuFullPath(m.id),
                available_actions: typeof m.available_actions === 'string' ? JSON.parse(m.available_actions || '[]') : (m.available_actions || []),
                available_scopes: typeof m.available_scopes === 'string' ? JSON.parse(m.available_scopes || '[]') : (m.available_scopes || [])
            }));
    }, [menusData, getMenuLabel, getMenuFullPath]);

    const effectivePermissions = useMemo(() => {
        const map = new Map();

        assignedRoles.forEach(roleId => {
            const rolePerms = globalRolePerms[roleId] || [];
            const roleInfo = allRoles.find(r => r.id === roleId);
            
            rolePerms.forEach(p => {
                const formInfo = allSystemForms.find(f => f.id === p.menu_id);
                if (!formInfo) return; 
                if (!map.has(p.menu_id)) {
                    map.set(p.menu_id, { id: p.menu_id, path: formInfo.fullPath, name: formInfo.label, breakdown: [] });
                }
                map.get(p.menu_id).breakdown.push({ 
                    sourceId: `role_${roleId}`, 
                    type: 'role', 
                    label: roleInfo?.title || roleId, 
                    actions: p.actions, 
                    scopes: p.scopes 
                });
            });
        });

        Object.entries(directPerms).forEach(([menuId, p]) => {
            const formInfo = allSystemForms.find(f => f.id === menuId);
            if (!formInfo) return;
            if (!map.has(menuId)) {
                map.set(menuId, { id: menuId, path: formInfo.fullPath, name: formInfo.label, breakdown: [] });
            }
            const existing = map.get(menuId).breakdown.find(b => b.type === 'direct');
            if (existing) {
                existing.actions = p.actions || []; 
                existing.scopes = p.scopes || {};
            } else {
                map.get(menuId).breakdown.push({ 
                    sourceId: 'direct', 
                    type: 'direct', 
                    label: t('دسترسی مستقیم', 'Direct Access'), 
                    actions: p.actions || [], 
                    scopes: p.scopes || {} 
                });
            }
        });

        return Array.from(map.values());
    }, [assignedRoles, directPerms, allSystemForms, globalRolePerms, allRoles, t]);

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
                      updates.push({ 
                          id: data.id, 
                          user_id: user.id, 
                          menu_id: menuId, 
                          actions: data.actions, 
                          data_scopes: data.scopes 
                      });
                  } else {
                      inserts.push({ 
                          user_id: user.id, 
                          menu_id: menuId, 
                          actions: data.actions, 
                          data_scopes: data.scopes 
                      });
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
    };

    const handleAddDirectForm = (form) => {
        if (directPerms[form.id]) {
            alert(t('این فرم قبلاً در لیست دسترسی‌های مستقیم وجود دارد.', 'This form is already in direct permissions list.'));
            return;
        }
        setDirectPerms(prev => ({
            ...prev,
            [form.id]: { id: null, actions: [], scopes: {} }
        }));
        setFormSearchTerm('');
        setShowFormResults(false);
        
        const newRow = { id: form.id, path: form.fullPath, name: form.label, breakdown: [{ sourceId: 'direct', type: 'direct', label: t('دسترسی مستقیم', 'Direct Access'), actions: [], scopes: {} }] };
        setSelectedPermDetail(newRow);
        setActiveSourceId('direct');
    };

    const handleUpdateDirectPermission = (formId, type, key, value) => {
        setDirectPerms(prev => {
            const current = prev[formId] || { id: null, actions: [], scopes: {} };
            let updatedActions = [...current.actions];
            let updatedScopes = { ...current.scopes };

            if (type === 'action') {
                if (updatedActions.includes(key)) {
                    updatedActions = updatedActions.filter(a => a !== key);
                } else {
                    updatedActions.push(key);
                }
            } else if (type === 'scope') {
                let currentScopeArr = updatedScopes[key] || [];
                if (currentScopeArr.includes(value)) {
                    currentScopeArr = currentScopeArr.filter(v => v !== value);
                } else {
                    currentScopeArr.push(value);
                }
                updatedScopes[key] = currentScopeArr;
            }

            return {
                ...prev,
                [formId]: {
                    ...current,
                    actions: updatedActions,
                    scopes: updatedScopes
                }
            };
        });

        setSelectedPermDetail(prev => {
            if (!prev || prev.id !== formId) return prev;
            return {
                ...prev,
                breakdown: prev.breakdown.map(b => {
                    if (b.sourceId !== 'direct') return b;
                    let nextActions = [...b.actions];
                    let nextScopes = { ...b.scopes };

                    if (type === 'action') {
                        if (nextActions.includes(key)) {
                            nextActions = nextActions.filter(a => a !== key);
                        } else {
                            nextActions.push(key);
                        }
                    } else if (type === 'scope') {
                        let arr = nextScopes[key] || [];
                        if (arr.includes(value)) {
                            arr = arr.filter(v => v !== value);
                        } else {
                            arr.push(value);
                        }
                        nextScopes[key] = arr;
                    }
                    return { ...b, actions: nextActions, scopes: nextScopes };
                })
            };
        });
    };

    const formSearchResults = useMemo(() => {
        if (!formSearchTerm) return [];
        return allSystemForms.filter(f => f.fullPath.toLowerCase().includes(formSearchTerm.toLowerCase()));
    }, [formSearchTerm, allSystemForms]);

    const columns = [
      { 
        field: 'path', 
        header_fa: 'مسیر و نام فرم', 
        header_en: 'Form Path & Name', 
        width: '45%',
        render: (val, row) => (
            <div className="flex flex-col py-0.5">
                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{row.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{row.path}</span>
            </div>
        )
      },
      { 
        field: 'source', 
        header_fa: 'منابع دسترسی (برای جزییات کلیک کنید)', 
        header_en: 'Access Sources (Click for details)', 
        width: '55%',
        render: (val, row) => (
           <div className="flex flex-wrap gap-1">
              {row.breakdown.map((s, idx) => {
                 const isActive = selectedPermDetail?.id === row.id && activeSourceId === s.sourceId;
                 return (
                     <div 
                        key={idx} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedPermDetail(row);
                            setActiveSourceId(s.sourceId);
                        }}
                        className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 select-none
                            ${isActive 
                               ? (s.type === 'role' ? 'bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600' : 'bg-blue-100 text-blue-700 border-blue-300 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600')
                               : (s.type === 'role' ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 dark:bg-slate-800 dark:border-slate-700 dark:text-purple-400' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400')}`}
                     >
                        {s.type === 'role' ? <Shield size={10}/> : <Zap size={10}/>} {s.label}
                     </div>
                 )
              })}
           </div>
        )
      }
    ];

    if (!isOpen) return null;

    const activeMenuInfo = selectedPermDetail ? allSystemForms.find(f => f.id === selectedPermDetail.id) : null;
    const availActions = activeMenuInfo ? activeMenuInfo.available_actions : [];
    const availScopes = activeMenuInfo ? activeMenuInfo.available_scopes : [];
    const activeSource = selectedPermDetail ? selectedPermDetail.breakdown.find(b => b.sourceId === activeSourceId) : null;
    const isReadOnly = activeSource ? activeSource.type === 'role' : true;

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
                    
                    <div className={`flex flex-col bg-white dark:bg-slate-900 overflow-hidden shrink-0 border-r dark:border-slate-800 ${selectedPermDetail ? 'w-full md:w-7/12' : 'w-full'}`}>
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-[50]">
                            <div className="relative">
                                <input 
                                    value={formSearchTerm} 
                                    onChange={(e) => { setFormSearchTerm(e.target.value); setShowFormResults(true); }} 
                                    placeholder={t('افزودن دسترسی مستقیم (نام فرم را جستجو کنید)...', 'Add direct perm (search form name)...')} 
                                    className={`w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all ${isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2'}`} 
                                />
                                <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`}/>
                                {showFormResults && formSearchTerm && (
                                   <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl max-h-48 overflow-y-auto z-[100]">
                                      {formSearchResults.length > 0 ? formSearchResults.map(f => (
                                         <div key={f.id} onClick={() => handleAddDirectForm(f)} className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer text-xs border-b border-slate-50 dark:border-slate-700 last:border-0">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{f.label}</div>
                                            <div className="text-[10px] text-slate-400">{f.fullPath}</div>
                                         </div>
                                      )) : <div className="p-2 text-xs text-slate-400 text-center">{t('موردی یافت نشد.', 'No items found.')}</div>}
                                   </div>
                                )}
                                {showFormResults && formSearchTerm && <div className="fixed inset-0 z-[-1]" onClick={() => setShowFormResults(false)}></div>}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <DataGrid 
                                data={effectivePermissions}
                                columns={columns}
                                language={language}
                                selectable={false}
                                onRowDoubleClick={(row) => {
                                    setSelectedPermDetail(row);
                                    if (row.breakdown.length > 0) setActiveSourceId(row.breakdown[0].sourceId);
                                }}
                                actions={[
                                    { 
                                        icon: ChevronLeft, 
                                        tooltip: t('مشاهده جزئیات', 'View Details'), 
                                        onClick: (row) => {
                                            setSelectedPermDetail(row);
                                            if (row.breakdown.length > 0) setActiveSourceId(row.breakdown[0].sourceId);
                                        },
                                        className: 'text-slate-400 hover:text-indigo-600'
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    {selectedPermDetail && (
                        <div className="w-full md:w-5/12 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200 relative z-10">
                            <div className="absolute top-3 left-3">
                                <button onClick={() => setSelectedPermDetail(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500">
                                    <X size={14}/>
                                </button>
                            </div>
                            
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1">{selectedPermDetail.name}</h3>
                                <div className="text-[10px] text-slate-500 font-mono leading-tight">{selectedPermDetail.path}</div>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                {activeSource ? (
                                    <>
                                        <div className={`p-2.5 rounded-lg border flex items-center gap-2 shadow-sm ${isReadOnly ? 'bg-purple-50 border-purple-100 text-purple-800 dark:bg-purple-950/20 dark:border-purple-900/50 dark:text-purple-400' : 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400'}`}>
                                            {isReadOnly ? <Shield size={14}/> : <Zap size={14}/>}
                                            <div className="font-bold text-[11px]">
                                                {t('منبع دسترسی فعلی:', 'Current Source:')} {activeSource.label}
                                            </div>
                                        </div>

                                        {isReadOnly && (
                                            <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded leading-relaxed">
                                                <Info size={14} className="shrink-0 text-amber-500"/>
                                                {t('این دسترسی‌ها از نقش به ارث رسیده‌اند و در اینجا قابل تغییر نیستند. برای ویرایش باید به فرم مدیریت نقش‌ها بروید.', 'Inherited from role. To edit, please use the Role Management screen.')}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                                {t('عملیات مجاز (Actions)', 'Allowed Actions')}
                                            </div>

                                            {availActions.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                                    {t('عملیاتی برای این فرم تعریف نشده است.', 'No actions defined.')}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {availActions.map(actId => {
                                                        const isChecked = activeSource.actions.includes(actId);
                                                        const lbl = AVAILABLE_ACTIONS.find(a => a.id === actId)?.label[isRtl ? 'fa' : 'en'] || actId;

                                                        if (isReadOnly) {
                                                            return (
                                                                <div key={actId} className={`flex items-center gap-2 p-2 rounded-lg border bg-white dark:bg-slate-800 ${isChecked ? 'border-purple-200 opacity-100' : 'border-slate-100 dark:border-slate-800 opacity-40'}`}>
                                                                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-purple-500 border-purple-500 text-white' : 'text-transparent'}`}>
                                                                        <Check size={10} strokeWidth={3}/>
                                                                    </div>
                                                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{lbl}</span>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <label 
                                                                key={actId} 
                                                                onClick={() => handleUpdateDirectPermission(selectedPermDetail.id, 'action', actId)}
                                                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all bg-white dark:bg-slate-800 ${isChecked ? 'border-blue-400 ring-1 ring-blue-100 dark:ring-0' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                    {isChecked && <Check size={10} strokeWidth={3}/>}
                                                                </div>
                                                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{lbl}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {availScopes.length > 0 && (
                                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {t('محدودیت دسترسی به داده‌ها', 'Data Scopes')}
                                                </div>
                                                
                                                {availScopes.map(scopeId => {
                                                    const scopeDataList = scopesData[scopeId] || [];
                                                    const displayLabel = SCOPE_DICT[scopeId]?.[isRtl ? 'fa' : 'en'] || scopeId;

                                                    return (
                                                        <div key={scopeId} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-sm">
                                                            <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-400">
                                                                {displayLabel}
                                                            </div>
                                                            <div className="p-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                                                {scopeDataList.length > 0 ? scopeDataList.map(item => {
                                                                    const isSelected = activeSource.scopes?.[scopeId]?.includes(item.id);

                                                                    if (isReadOnly) {
                                                                        if (!isSelected) return null;
                                                                        return (
                                                                            <span key={item.id} className="px-2 py-0.5 text-[10px] rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50 font-bold flex items-center gap-1">
                                                                                <Check size={8} strokeWidth={3}/> {item.title}
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div 
                                                                            key={item.id} 
                                                                            onClick={() => handleUpdateDirectPermission(selectedPermDetail.id, 'scope', scopeId, item.id)}
                                                                            className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer select-none transition-all flex items-center gap-1 ${isSelected ? 'bg-blue-500 border-blue-500 text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
                                                                        >
                                                                            {isSelected && <Check size={8} strokeWidth={3}/>}
                                                                            {item.title}
                                                                        </div>
                                                                    );
                                                                }) : (
                                                                    <span className="text-[10px] text-slate-400 italic">{t('داده‌ای یافت نشد.', 'No data found.')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-slate-400 text-xs mt-10">
                                        {t('لطفا یکی از منابع دسترسی (بج‌های رنگی) را از جدول انتخاب کنید.', 'Please select one of the access source badges from the grid.')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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