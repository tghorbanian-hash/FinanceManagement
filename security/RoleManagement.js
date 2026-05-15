/* Filename: security/RoleManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Users = FallbackIcon, Lock = FallbackIcon, 
    Edit = FallbackIcon, Trash2 = FallbackIcon, Save = FallbackIcon, 
    Plus = FallbackIcon, Search = FallbackIcon, Check = FallbackIcon, 
    X = FallbackIcon, AlertTriangle = FallbackIcon, ChevronRight = FallbackIcon, 
    ChevronDown = FallbackIcon, Layers = FallbackIcon, UserPlus = FallbackIcon,
    UserMinus = FallbackIcon, RefreshCw = FallbackIcon, Hash = FallbackIcon
  } = LucideIcons;

  const DesignSystem = window.DesignSystem || window.DSCore || {};
  const { 
    Button = () => null, 
    PageHeader = () => null, 
    Modal = () => null, 
    AdvancedFilter = () => null, 
    DataGrid = () => null, 
    TextField = () => null, 
    ToggleField = () => null, 
    Badge = () => null,
    SelectField = () => null
  } = DesignSystem;

  const supabase = window.supabase;

  // Level 2: Available Actions per Form (Standard Actions)
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

  const RoleManagement = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    // Main States
    const [roles, setRoles] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [resources, setResources] = useState([]);
    const [scopesData, setScopesData] = useState({ docTypes: [], branches: [], ledgers: [] });
    
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [gridState, setGridState] = useState(null);
    
    // Modals State
    const [roleModal, setRoleModal] = useState({ isOpen: false, data: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, data: null });
    
    // User Assignment State
    const [userModal, setUserModal] = useState({ isOpen: false, role: null });
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // Permissions State (3 Levels)
    const [permModal, setPermModal] = useState({ isOpen: false, role: null });
    const [selectedResource, setSelectedResource] = useState(null);
    const [tempPermissions, setTempPermissions] = useState({}); 

    const [expandedNodes, setExpandedNodes] = useState({});

    // Forms Form Data
    const [formData, setFormData] = useState({
      code: '',
      title: '',
      is_active: true,
      description: ''
    });

    const viewConfig = {
      pageId: 'roles_main',
      currentState: () => ({ filters, gridState }),
      onApplyState: (state) => {
        if (state) {
          if (state.filters) setFilters(state.filters);
          if (state.gridState) setGridState(state.gridState);
        } else {
          setFilters({});
          setGridState(null);
        }
      }
    };

    useEffect(() => {
      fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch Roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('sec_roles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!rolesError && rolesData) setRoles(rolesData);

        // Fetch Users for Assignment
        const { data: usersData } = await supabase
          .from('sec_users')
          .select('id, username, is_active')
          .eq('is_active', true);
        if (usersData) setAllUsers(usersData);

        // Fetch Resources
        const { data: dbResData, error: resError } = await supabase.from('sec_resources').select('*');
        if (!resError && dbResData) {
            setResources(dbResData);
        }

        // Fetch Data Scopes (DocTypes & Branches)
        const [dtRes, brRes] = await Promise.all([
            supabase.from('fm_doc_types').select('id, title').eq('is_active', true),
            supabase.from('fm_branches').select('id, title').eq('is_active', true)
        ]);

        setScopesData({
            docTypes: dtRes.data || [],
            branches: brRes.data || [],
            ledgers: []
        });

      } catch (err) {
        console.error('Fetch Initial Data Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenRoleModal = (record = null) => {
      setFormData(record ? {
        code: record.code || '',
        title: record.title || '',
        is_active: record.is_active ?? true,
        description: record.description || ''
      } : { 
        code: '',
        title: '',
        is_active: true,
        description: ''
      });
      setRoleModal({ isOpen: true, data: record });
    };

    const handleSaveRole = async () => {
      if (!formData.code || !formData.title) return;
      setIsLoading(true);
      try {
        const payload = {
          code: formData.code,
          title: formData.title,
          is_active: formData.is_active,
          description: formData.description,
          updated_at: new Date().toISOString()
        };

        if (roleModal.data?.id) {
          const { error } = await supabase.from('sec_roles').update(payload).eq('id', roleModal.data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('sec_roles').insert([payload]);
          if (error) throw error;
        }

        setRoleModal({ isOpen: false, data: null });
        fetchInitialData();
      } catch (err) {
        console.error('Save Role Error:', err);
        alert(t('خطا در ذخیره نقش. ممکن است کد تکراری باشد.', 'Error saving role. Code might be duplicate.'));
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteRole = async () => {
      if (!deleteConfirm.data) return;
      setIsLoading(true);
      try {
        const { error } = await supabase.from('sec_roles').delete().eq('id', deleteConfirm.data.id);
        if (error) throw error;
        setDeleteConfirm({ isOpen: false, data: null });
        fetchInitialData();
      } catch (err) {
        console.error('Delete Role Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const openUserModal = async (role) => {
        setIsLoading(true);
        setUserModal({ isOpen: true, role });
        setUserSearchTerm('');
        try {
            const { data: userRoles, error } = await supabase
                .from('sec_user_roles')
                .select('user_id')
                .eq('role_id', role.id);
            
            if (!error && userRoles) {
                const assignedIds = userRoles.map(ur => ur.user_id);
                setAssignedUsers(allUsers.filter(u => assignedIds.includes(u.id)));
            } else {
                setAssignedUsers([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const assignUser = async (userId) => {
        setIsLoading(true);
        try {
            await supabase.from('sec_user_roles').insert([{ user_id: userId, role_id: userModal.role.id }]);
            setAssignedUsers(prev => [...prev, allUsers.find(u => u.id === userId)]);
            setUserSearchTerm('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const removeUser = async (userId) => {
        setIsLoading(true);
        try {
            await supabase.from('sec_user_roles').delete().match({ user_id: userId, role_id: userModal.role.id });
            setAssignedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const searchResults = useMemo(() => {
        if (!userSearchTerm) return [];
        const term = userSearchTerm.toLowerCase();
        const assignedIds = assignedUsers.map(u => u.id);
        return allUsers.filter(u => 
            !assignedIds.includes(u.id) && 
            u.username.toLowerCase().includes(term)
        );
    }, [userSearchTerm, allUsers, assignedUsers]);

    const openPermModal = async (role) => {
        setIsLoading(true);
        setPermModal({ isOpen: true, role });
        setSelectedResource(null);
        setTempPermissions({});
        
        try {
            const { data: perms } = await supabase
                .from('sec_permissions')
                .select('*')
                .eq('role_id', role.id);
                
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
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePermissions = async () => {
        setIsLoading(true);
        try {
            await supabase.from('sec_permissions').delete().eq('role_id', permModal.role.id);
            
            const inserts = [];
            Object.entries(tempPermissions).forEach(([resCode, data]) => {
                if (data.actions.length > 0 || Object.keys(data.scopes).some(k => data.scopes[k]?.length > 0)) {
                    inserts.push({
                        role_id: permModal.role.id,
                        resource_code: resCode,
                        actions: data.actions,
                        data_scopes: data.scopes
                    });
                }
            });

            if (inserts.length > 0) {
                await supabase.from('sec_permissions').insert(inserts);
            }
            
            setPermModal({ isOpen: false, role: null });
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

    const columns = [
      { field: 'code', header_fa: 'کد نقش', header_en: 'Role Code', width: '120px', render: (val) => <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{val}</span> },
      { field: 'title', header_fa: 'عنوان نقش', header_en: 'Role Title', width: '250px', render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200 text-[12px]">{val}</span> },
      { field: 'description', header_fa: 'توضیحات', header_en: 'Description', width: 'auto' },
      { 
        field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', width: '100px', 
        render: (val) => (
          <Badge variant={val ? 'emerald' : 'slate'} size="sm">
            {val ? t('فعال', 'Active') : t('غیرفعال', 'Inactive')}
          </Badge>
        )
      }
    ];

    const filteredRoles = useMemo(() => {
      let res = [...roles];
      if (filters.title) {
        res = res.filter(r => r.title.toLowerCase().includes(filters.title.toLowerCase()));
      }
      if (filters.code) {
        res = res.filter(r => r.code.toLowerCase().includes(filters.code.toLowerCase()));
      }
      if (filters.isActive) {
        const wantActive = filters.isActive === 'active';
        res = res.filter(r => r.is_active === wantActive);
      }
      return res;
    }, [roles, filters]);

    const ChevronLeft = ({size}) => React.createElement('svg', {width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement('polyline', {points:"15 18 9 12 15 6"}));

    return (
      <div className="flex flex-col h-full p-4 bg-[#f8fafc] dark:bg-slate-900 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت نقش‌ها و دسترسی‌ها', 'Role & Permission Management')} 
          icon={Shield}
          description={t('تعریف نقش‌ها و تخصیص دسترسی‌های ۳ سطحی به فرم‌ها، عملیات و داده‌ها', 'Define roles and assign 3-level permissions to forms, actions, and data scopes')}
          language={language}
          breadcrumbs={[{ label: t('امنیت', 'Security') }, { label: t('نقش‌ها', 'Roles') }]}
          viewConfig={viewConfig}
        />

        <div className="flex-1 flex flex-col min-h-0 mt-3 animate-in fade-in duration-300">
          <AdvancedFilter 
            fields={[
              { name: 'title', label: t('عنوان نقش', 'Role Title'), type: 'text' },
              { name: 'code', label: t('کد نقش', 'Role Code'), type: 'text' },
              { 
                name: 'isActive', label: t('وضعیت', 'Status'), type: 'select', 
                options: [{ value: 'active', label: t('فعال', 'Active') }, { value: 'inactive', label: t('غیرفعال', 'Inactive') }]
              }
            ]}
            initialValues={filters}
            onFilter={setFilters}
            onClear={() => setFilters({})}
            language={language}
          />

          <div className="flex-1 min-h-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <DataGrid 
              data={filteredRoles}
              columns={columns} 
              language={language}
              isLoading={isLoading}
              gridState={gridState}
              onGridStateChange={setGridState}
              onAdd={() => handleOpenRoleModal()}
              onRowDoubleClick={(row) => handleOpenRoleModal(row)}
              hideImport={true}
              actions={[
                { icon: Shield, tooltip: t('دسترسی‌ها', 'Permissions'), onClick: (row) => openPermModal(row), className: 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
                { icon: Users, tooltip: t('کاربران نقش', 'Role Users'), onClick: (row) => openUserModal(row), className: 'text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
                { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => handleOpenRoleModal(row), className: 'text-slate-400 hover:text-slate-600' },
                { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, data: row }), className: 'text-rose-400 hover:text-rose-600' }
              ]}
            />
          </div>
        </div>

        {/* --- 1. Role Create/Edit Modal --- */}
        <Modal isOpen={roleModal.isOpen} onClose={() => setRoleModal({ isOpen: false, data: null })} title={roleModal.data ? t('ویرایش نقش', 'Edit Role') : t('تعریف نقش جدید', 'New Role')} width="max-w-md" language={language}>
          <div className="p-4 flex flex-col gap-4">
            <TextField size="sm" label={t('کد سیستمی نقش *', 'Role Code *')} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} dir="ltr" disabled={!!roleModal.data} placeholder="ROLE_ADMIN" />
            <TextField size="sm" label={t('عنوان نقش *', 'Role Title *')} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
            <TextField size="sm" label={t('توضیحات', 'Description')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} isRtl={isRtl} multiline rows={3} />
            <div className="mt-2">
                <ToggleField size="sm" label={t('وضعیت فعالیت نقش', 'Role Is Active')} checked={formData.is_active} onChange={v => setFormData({...formData, is_active: v})} isRtl={isRtl} />
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setRoleModal({ isOpen: false, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveRole} isLoading={isLoading}>{t('ذخیره', 'Save')}</Button>
            </div>
          </div>
        </Modal>

        {/* --- 2. User Assignment Modal --- */}
        <Modal isOpen={userModal.isOpen} onClose={() => setUserModal({ isOpen: false, role: null })} title={`${t('تخصیص کاربران به نقش:', 'Assign Users to Role:')} ${userModal.role?.title || ''}`} width="max-w-lg" language={language}>
            <div className="flex flex-col h-[500px]">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 shrink-0 relative z-50">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block flex items-center gap-1.5"><UserPlus size={14}/> {t('جستجو و افزودن کاربر جدید', 'Search & Add New User')}</label>
                    <div className="relative">
                        <input 
                            value={userSearchTerm} 
                            onChange={(e) => setUserSearchTerm(e.target.value)} 
                            placeholder={t('نام کاربری را وارد کنید...', 'Enter username...')} 
                            className={`w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-slate-800 dark:text-slate-200`} 
                        />
                        <Search size={16} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`}/>
                        
                        {userSearchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[100] py-1">
                                {searchResults.length > 0 ? searchResults.map(u => (
                                    <div key={u.id} onClick={() => assignUser(u.id)} className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer flex items-center justify-between group transition-colors">
                                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{u.username}</span>
                                        <div className="opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-md"><Plus size={12}/></div>
                                    </div>
                                )) : <div className="p-3 text-center text-[11px] text-slate-400">{t('کاربری یافت نشد.', 'No user found.')}</div>}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-slate-900">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-500 px-2 pt-2 pb-3">{t('کاربران فعلی این نقش:', 'Current users in this role:')}</div>
                    {assignedUsers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2">
                            {assignedUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-2 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"><Users size={12}/></div>
                                        <span className="text-[12px] font-mono font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]" dir="ltr">{u.username}</span>
                                    </div>
                                    <Button variant="ghost" size="iconSm" icon={UserMinus} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30" onClick={() => removeUser(u.id)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <Users size={32} className="opacity-20 mb-2"/>
                            <span className="text-[12px]">{t('هیچ کاربری به این نقش تخصیص نیافته است.', 'No users assigned.')}</span>
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setUserModal({ isOpen: false, role: null })}>{t('بستن', 'Close')}</Button>
                </div>
            </div>
        </Modal>

        {/* --- 3. Permissions Modal (3-Level Access) --- */}
        <Modal isOpen={permModal.isOpen} onClose={() => setPermModal({ isOpen: false, role: null })} title={`${t('مدیریت دسترسی‌های ۳ سطحی:', '3-Level Permissions Management:')} ${permModal.role?.title || ''}`} width="max-w-6xl" language={language}>
            <div className="flex h-[600px] flex-col md:flex-row bg-white dark:bg-slate-900">
                
                {/* Left Pane: Level 1 - Resources Tree */}
                <div className="w-full md:w-1/3 border-r md:border-b-0 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-hidden shrink-0">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm z-10">
                        <div className="w-5 h-5 rounded bg-indigo-500 text-white flex items-center justify-center"><Layers size={12}/></div>
                        <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">{t('سطح ۱: فرم‌ها و منابع', 'Level 1: Forms & Resources')}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {renderTreeNodes(null, 0)}
                    </div>
                </div>

                {/* Right Pane: Level 2 & 3 */}
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
                                    <ChevronLeft size={16} className="text-indigo-500" />
                                    {isRtl ? (selectedResource.title_fa || selectedResource.code) : (selectedResource.title_en || selectedResource.code)}
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-2 border border-slate-200 dark:border-slate-700">{selectedResource.code}</span>
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Level 2: Actions */}
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

                                {/* Level 3: Data Scopes */}
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
                                                            {isRtl ? (dt.title_fa || dt.title) : (dt.title_en || dt.title)}
                                                        </div>
                                                    )
                                                })}
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
                                                            {isRtl ? (br.title_fa || br.title) : (br.title_en || br.title)}
                                                        </div>
                                                    )
                                                })}
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
                            <Button variant="outline" size="sm" onClick={() => setPermModal({ isOpen: false, role: null })}>{t('انصراف', 'Cancel')}</Button>
                            <Button variant="primary" size="sm" icon={Save} onClick={handleSavePermissions} isLoading={isLoading}>{t('ذخیره کلیه تغییرات', 'Save All Changes')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, data: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-1">
               <AlertTriangle size={22} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">
              {t(`آیا از حذف نقش "${deleteConfirm.data?.title}" اطمینان دارید؟ تمامی دسترسی‌های این نقش حذف خواهد شد.`, `Are you sure you want to delete role "${deleteConfirm.data?.title}"? All permissions will be lost.`)}
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={handleDeleteRole} isLoading={isLoading} className="flex-1 bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 border-rose-600 dark:border-rose-500">{t('تایید حذف', 'Delete')}</Button>
            </div>
          </div>
        </Modal>

      </div>
    );
  };

  window.RoleManagement = RoleManagement;
})();