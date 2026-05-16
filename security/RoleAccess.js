/* Filename: security/RoleAccess.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Lock = FallbackIcon, Save = FallbackIcon, 
    Check = FallbackIcon, AlertCircle = FallbackIcon
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

  const RoleAccess = ({ isOpen, onClose, role, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const [isLoading, setIsLoading] = useState(false);
    const [menusData, setMenusData] = useState([]);
    const [scopesData, setScopesData] = useState({ docTypes: [], branches: [] });
    
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [tempPermissions, setTempPermissions] = useState({});

    useEffect(() => {
      if (isOpen && role) {
        fetchData();
      } else {
        setSelectedMenu(null);
        setTempPermissions({});
      }
    }, [isOpen, role]);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: dbMenus, error: menuErr } = await supabase.from('menus').select('*').order('display_order', { ascending: true });
        if (!menuErr && dbMenus) setMenusData(dbMenus);

        const safeFetchDocTypes = async () => {
            try {
                const res = await supabase.from('fm_doc_types').select('id, title').eq('is_active', true);
                return res.error ? { data: [] } : res;
            } catch (e) { return { data: [] }; }
        };

        const safeFetchBranches = async () => {
            try {
                const res = await supabase.from('fm_branches').select('id, title').eq('is_active', true);
                return res.error ? { data: [] } : res;
            } catch (e) { return { data: [] }; }
        };

        const [dtRes, brRes] = await Promise.all([safeFetchDocTypes(), safeFetchBranches()]);

        setScopesData({
            docTypes: dtRes.data || [],
            branches: brRes.data || []
        });

        const { data: perms } = await supabase.from('sec_permissions').select('*').eq('role_id', role.id);
        if (perms) {
            const mapped = {};
            perms.forEach(p => {
                mapped[p.menu_id] = {
                    id: p.id,
                    actions: typeof p.actions === 'string' ? JSON.parse(p.actions || '[]') : (p.actions || []),
                    scopes: typeof p.data_scopes === 'string' ? JSON.parse(p.data_scopes || '{}') : (p.data_scopes || {})
                };
            });
            setTempPermissions(mapped);
        }
      } catch (err) {
        console.error('Fetch Access Data Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const mappedTreeData = useMemo(() => {
        return menusData.map(m => {
            const hasActions = tempPermissions[m.id]?.actions?.length > 0;
            const hasScopes = Object.keys(tempPermissions[m.id]?.scopes || {}).some(k => tempPermissions[m.id].scopes[k].length > 0);
            const hasAccess = hasActions || hasScopes;
            
            const indicator = hasAccess ? '✔ ' : '';
            const rawLabel = isRtl ? (m.label_fa || m.title || m.name || m.unique_code) : (m.label_en || m.title || m.name || m.unique_code);
            
            return {
                ...m,
                displayLabel: indicator + rawLabel
            };
        });
    }, [menusData, tempPermissions, isRtl]);

    const handleSavePermissions = async () => {
      setIsLoading(true);
      try {
          const inserts = [];
          const updates = [];
          const deletes = [];

          Object.entries(tempPermissions).forEach(([menuId, data]) => {
              const hasActions = data.actions.length > 0;
              const hasScopes = Object.keys(data.scopes).some(k => data.scopes[k]?.length > 0);
              
              if (hasActions || hasScopes) {
                  if (data.id) {
                      updates.push({ id: data.id, role_id: role.id, menu_id: menuId, actions: data.actions, data_scopes: data.scopes });
                  } else {
                      inserts.push({ role_id: role.id, menu_id: menuId, actions: data.actions, data_scopes: data.scopes });
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

    const toggleAction = (actionId) => {
        if (!selectedMenu) return;
        setTempPermissions(prev => {
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

    const toggleScope = (scopeKey, valueId) => {
        if (!selectedMenu) return;
        setTempPermissions(prev => {
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('مدیریت دسترسی‌های نقش:', 'Role Permissions Management:')} ${role?.title || ''}`} width="max-w-6xl" language={language}>
            <div className="flex h-[600px] flex-col md:flex-row bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                
                {/* Left Pane - Tree */}
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
                            secondaryField="unique_code" 
                            activeField="is_visible"
                            selectedId={selectedMenu?.id}
                            onSelect={setSelectedMenu}
                            language={language}
                        />
                    )}
                </div>

                {/* Right Pane - Config */}
                <div className="w-full md:w-2/3 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                    {!selectedMenu ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Shield size={48} className="opacity-10 mb-4 text-indigo-500" />
                            <span className="text-[13px] font-bold text-slate-500">{t('برای تنظیم دسترسی، یک فرم از درخت انتخاب کنید.', 'Select a form from the tree to configure permissions.')}</span>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    {isRtl ? (selectedMenu.label_fa || selectedMenu.title || selectedMenu.name) : (selectedMenu.label_en || selectedMenu.title || selectedMenu.name)}
                                </h3>
                                {selectedMenu.unique_code && <p className="text-[10px] font-mono text-slate-400 mt-1 dir-ltr inline-block bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{selectedMenu.unique_code}</p>}
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Actions Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Shield size={14}/></div>
                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('عملیات مجاز (Actions)', 'Allowed Actions')}</span>
                                    </div>
                                    
                                    {availActions.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                            {t('هیچ عملیات خاصی برای این فرم در دیتابیس تعریف نشده است.', 'No specific actions defined for this form in the database.')}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {availActions.map(actionId => {
                                                const isChecked = tempPermissions[selectedMenu.id]?.actions?.includes(actionId);
                                                const labelObj = ACTION_DICT[actionId];
                                                const displayLabel = labelObj ? labelObj[isRtl ? 'fa' : 'en'] : actionId;
                                                
                                                return (
                                                    <label key={actionId} onClick={() => toggleAction(actionId)} className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all select-none ${isChecked ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                                                            {isChecked && <Check size={12} strokeWidth={3}/>}
                                                        </div>
                                                        <span className={`text-[12px] ${isChecked ? 'font-bold text-amber-900 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                                                            {displayLabel}
                                                        </span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Scopes Section */}
                                {availScopes.length > 0 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Lock size={14}/></div>
                                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('محدودیت دسترسی به داده‌ها', 'Data Scope Restrictions')}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                                            {t('در صورت عدم انتخاب هیچ گزینه‌ای در یک بخش، کاربر به تمامی داده‌های آن بخش دسترسی خواهد داشت.', 'If no options are selected, the user will have access to all data in that scope.')}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availScopes.map(scopeId => {
                                                const scopeDataList = scopesData[scopeId] || [];
                                                const labelObj = SCOPE_DICT[scopeId];
                                                const displayLabel = labelObj ? labelObj[isRtl ? 'fa' : 'en'] : scopeId;
                                                
                                                return (
                                                    <div key={scopeId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
                                                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                            {displayLabel}
                                                        </div>
                                                        <div className="p-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                            {scopeDataList.length > 0 ? scopeDataList.map(item => {
                                                                const isSelected = tempPermissions[selectedMenu.id]?.scopes?.[scopeId]?.includes(item.id);
                                                                return (
                                                                    <div key={item.id} onClick={() => toggleScope(scopeId, item.id)} className={`px-2.5 py-1 text-[11px] rounded-full border cursor-pointer select-none transition-all flex items-center gap-1.5 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white font-bold shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-600'}`}>
                                                                        {isSelected && <Check size={10} strokeWidth={3}/>}
                                                                        {item.title}
                                                                    </div>
                                                                )
                                                            }) : (
                                                                <span className="text-[10px] text-slate-400 italic">{t('داده‌ای یافت نشد.', 'No data found.')}</span>
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
                    
                    {/* Bottom Action Bar */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                            {t('تغییرات دسترسی بلافاصله پس از ذخیره برای کاربران اعمال می‌گردد.', 'Permission changes apply immediately upon save.')}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onClose}>{t('انصراف', 'Cancel')}</Button>
                            <Button variant="primary" size="sm" className="flex-1 sm:flex-none" icon={Save} onClick={handleSavePermissions} isLoading={isLoading}>{t('ذخیره تغییرات فرم‌ها', 'Save All Changes')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
  };

  window.RoleAccess = RoleAccess;
})();