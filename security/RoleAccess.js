/* Filename: security/RoleAccess.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Lock = FallbackIcon, Save = FallbackIcon, 
    Check = FallbackIcon, ChevronRight = FallbackIcon, ChevronDown = FallbackIcon, 
    Layers = FallbackIcon 
  } = LucideIcons;

  const DesignSystem = window.DesignSystem || window.DSCore || {};
  const { Modal = () => null, Button = () => null } = DesignSystem;

  const supabase = window.supabase;

  const AVAILABLE_ACTIONS = [
    { id: 'read', label_fa: 'مشاهده اطلاعات', label_en: 'Read' },
    { id: 'create', label_fa: 'ایجاد', label_en: 'Create' },
    { id: 'update', label_fa: 'ویرایش', label_en: 'Update' },
    { id: 'delete', label_fa: 'حذف', label_en: 'Delete' },
    { id: 'print', label_fa: 'چاپ اطلاعات', label_en: 'Print' },
    { id: 'import', label_fa: 'وارد نمودن اکسل', label_en: 'Excel Import' },
    { id: 'export', label_fa: 'خروجی اکسل', label_en: 'Excel Export' },
    { id: 'approve', label_fa: 'تغییر وضعیت / تایید', label_en: 'Approval' },
    { id: 'assign_detail', label_fa: 'تخصیص کد تفصیلی', label_en: 'Detail Assignment' },
  ];

  const RoleAccess = ({ isOpen, onClose, role, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const [isLoading, setIsLoading] = useState(false);
    const [resources, setResources] = useState([]);
    const [scopesData, setScopesData] = useState({ docTypes: [], branches: [] });
    const [selectedResource, setSelectedResource] = useState(null);
    const [tempPermissions, setTempPermissions] = useState({});
    const [expandedNodes, setExpandedNodes] = useState({});

    useEffect(() => {
      if (isOpen && role) {
        fetchData();
      } else {
        setSelectedResource(null);
        setTempPermissions({});
      }
    }, [isOpen, role]);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: dbResources } = await supabase.from('sec_resources').select('*');
        if (dbResources) setResources(dbResources);

        const [dtRes, brRes] = await Promise.all([
            supabase.from('fm_doc_types').select('id, title').eq('is_active', true).catch(() => ({ data: [] })),
            supabase.from('fm_branches').select('id, title').eq('is_active', true).catch(() => ({ data: [] }))
        ]);

        setScopesData({
            docTypes: dtRes.data || [],
            branches: brRes.data || []
        });

        const { data: perms } = await supabase.from('sec_permissions').select('*').eq('role_id', role.id);
        if (perms) {
            const mapped = {};
            perms.forEach(p => {
                mapped[p.resource_code] = {
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

    const handleSavePermissions = async () => {
      setIsLoading(true);
      try {
          await supabase.from('sec_permissions').delete().eq('role_id', role.id);
          
          const inserts = [];
          Object.entries(tempPermissions).forEach(([resCode, data]) => {
              if (data.actions.length > 0 || Object.keys(data.scopes).some(k => data.scopes[k]?.length > 0)) {
                  inserts.push({
                      role_id: role.id,
                      resource_code: resCode,
                      actions: data.actions,
                      data_scopes: data.scopes
                  });
              }
          });

          if (inserts.length > 0) {
              await supabase.from('sec_permissions').insert(inserts);
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
        if (!selectedResource) return;
        setTempPermissions(prev => {
            const current = prev[selectedResource.code] || { actions: [], scopes: {} };
            const hasAction = current.actions.includes(actionId);
            return {
                ...prev,
                [selectedResource.code]: {
                    ...current,
                    actions: hasAction 
                        ? current.actions.filter(a => a !== actionId) 
                        : [...current.actions, actionId]
                }
            };
        });
    };

    const toggleScope = (scopeKey, valueId) => {
        if (!selectedResource) return;
        setTempPermissions(prev => {
            const current = prev[selectedResource.code] || { actions: [], scopes: {} };
            const scopeArr = current.scopes[scopeKey] || [];
            const hasVal = scopeArr.includes(valueId);
            return {
                ...prev,
                [selectedResource.code]: {
                    ...current,
                    scopes: {
                        ...current.scopes,
                        [scopeKey]: hasVal 
                            ? scopeArr.filter(v => v !== valueId)
                            : [...scopeArr, valueId]
                    }
                }
            };
        });
    };

    const toggleNodeExpand = (code, e) => {
        if (e) e.stopPropagation();
        setExpandedNodes(prev => ({ ...prev, [code]: !prev[code] }));
    };

    const renderTreeNodes = (parentId = null, level = 0) => {
        const nodes = resources.filter(r => r.parent_code === parentId);
        if (nodes.length === 0) return null;

        return (
            <div className="flex flex-col w-full">
                {nodes.map(node => {
                    const hasChildren = resources.some(r => r.parent_code === node.code);
                    const isExpanded = expandedNodes[node.code] !== false; 
                    const isSelected = selectedResource?.code === node.code;
                    const hasPerms = tempPermissions[node.code]?.actions?.length > 0;

                    return (
                        <div key={node.code} className="w-full select-none">
                            <div 
                                onClick={() => setSelectedResource(node)}
                                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-[12px] transition-colors border-b border-transparent ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
                                style={{ paddingInlineStart: `${(level * 16) + 8}px` }}
                            >
                                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                    {hasChildren ? (
                                        <div onClick={(e) => toggleNodeExpand(node.code, e)} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500">
                                            {isExpanded ? <ChevronDown size={14}/> : (isRtl ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>)}
                                        </div>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                    )}
                                </div>
                                <div className="flex-1 truncate font-medium flex items-center gap-2">
                                    <Layers size={13} className={isSelected ? 'text-indigo-500' : 'text-slate-400'}/>
                                    {isRtl ? (node.title_fa || node.code) : (node.title_en || node.code)}
                                </div>
                                {hasPerms && (
                                    <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            {hasChildren && isExpanded && renderTreeNodes(node.code, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    const ChevronLeft = ({size}) => React.createElement('svg', {width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement('polyline', {points:"15 18 9 12 15 6"}));

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('مدیریت دسترسی‌های ۳ سطحی:', '3-Level Permissions Management:')} ${role?.title || ''}`} width="max-w-6xl" language={language}>
            <div className="flex h-[600px] flex-col md:flex-row bg-white dark:bg-slate-900">
                <div className="w-full md:w-1/3 border-r md:border-b-0 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-hidden shrink-0">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm z-10">
                        <div className="w-5 h-5 rounded bg-indigo-500 text-white flex items-center justify-center"><Layers size={12}/></div>
                        <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">{t('سطح ۱: فرم‌ها و منابع', 'Level 1: Forms & Resources')}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {resources.length > 0 ? renderTreeNodes(null, 0) : (
                            <div className="text-center p-4 text-slate-400 text-[11px]">{t('فرمی در سیستم یافت نشد.', 'No forms found in system.')}</div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-2/3 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                    {!selectedResource ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Shield size={48} className="opacity-10 mb-4" />
                            <span className="text-[13px] font-bold">{t('برای تنظیم دسترسی، یک فرم از منوی سمت راست انتخاب کنید.', 'Select a form from the list to configure permissions.')}</span>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    {isRtl ? <ChevronLeft size={16} className="text-indigo-500" /> : <ChevronRight size={16} className="text-indigo-500" />}
                                    {isRtl ? (selectedResource.title_fa || selectedResource.code) : (selectedResource.title_en || selectedResource.code)}
                                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-2 border border-slate-200 dark:border-slate-700 dir-ltr inline-block">{selectedResource.code}</span>
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Shield size={12}/></div>
                                        <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">{t('سطح ۲: دسترسی عملیات (Actions)', 'Level 2: Action Permissions')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        {AVAILABLE_ACTIONS.map(action => {
                                            const isChecked = tempPermissions[selectedResource.code]?.actions?.includes(action.id);
                                            return (
                                                <label key={action.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${isChecked ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 shadow-sm' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}>
                                                        {isChecked && <Check size={12} strokeWidth={3}/>}
                                                    </div>
                                                    <span className={`text-[12px] select-none ${isChecked ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                                                        {isRtl ? action.label_fa : action.label_en}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center"><Lock size={12}/></div>
                                        <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">{t('سطح ۳: محدودیت دسترسی به داده‌ها (Data Scopes)', 'Level 3: Data Scope Restrictions')}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{t('در صورت عدم انتخاب هیچ گزینه‌ای، دسترسی به کلیه داده‌ها در این بخش باز خواهد بود.', 'If no options are selected, access to all data in this scope is granted.')}</div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                {t('انواع سند مجاز', 'Allowed Document Types')}
                                            </div>
                                            <div className="p-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                                {scopesData.docTypes.map(dt => {
                                                    const isSelected = tempPermissions[selectedResource.code]?.scopes?.docTypes?.includes(dt.id);
                                                    return (
                                                        <div key={dt.id} onClick={() => toggleScope('docTypes', dt.id)} className={`px-2.5 py-1 text-[11px] rounded-full border cursor-pointer select-none transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                                                            {isSelected && <Check size={10} strokeWidth={3}/>}
                                                            {dt.title}
                                                        </div>
                                                    )
                                                })}
                                                {scopesData.docTypes.length === 0 && <span className="text-[10px] text-slate-400">{t('اطلاعاتی یافت نشد', 'No data')}</span>}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                {t('شعب مجاز', 'Allowed Branches')}
                                            </div>
                                            <div className="p-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                                {scopesData.branches.map(br => {
                                                    const isSelected = tempPermissions[selectedResource.code]?.scopes?.branches?.includes(br.id);
                                                    return (
                                                        <div key={br.id} onClick={() => toggleScope('branches', br.id)} className={`px-2.5 py-1 text-[11px] rounded-full border cursor-pointer select-none transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                                                            {isSelected && <Check size={10} strokeWidth={3}/>}
                                                            {br.title}
                                                        </div>
                                                    )
                                                })}
                                                {scopesData.branches.length === 0 && <span className="text-[10px] text-slate-400">{t('اطلاعاتی یافت نشد', 'No data')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                        <div className="text-[10px] text-slate-500 font-medium">
                            {t('تغییرات دسترسی بلافاصله پس از ذخیره برای کاربران اعمال می‌گردد.', 'Permission changes apply immediately upon save.')}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onClose}>{t('انصراف', 'Cancel')}</Button>
                            <Button variant="primary" size="sm" icon={Save} onClick={handleSavePermissions} isLoading={isLoading}>{t('ذخیره کلیه تغییرات', 'Save All Changes')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
  };

  window.RoleAccess = RoleAccess;
})();