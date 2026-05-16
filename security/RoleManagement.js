/* Filename: security/RoleManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  
  const FallbackIcon = ({ size = 16, className = '' }) => React.createElement('span', { className: `inline-block ${className}`, style: { width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Shield = FallbackIcon, Users = FallbackIcon, Edit = FallbackIcon, 
    Trash2 = FallbackIcon, Save = FallbackIcon, Plus = FallbackIcon, 
    Search = FallbackIcon, AlertTriangle = FallbackIcon, UserPlus = FallbackIcon,
    UserMinus = FallbackIcon, Calendar = FallbackIcon
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
    DatePicker = () => null
  } = DesignSystem;

  const supabase = window.supabase;
  const RoleAccess = window.RoleAccess;

  const RoleManagement = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const [roles, setRoles] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [gridState, setGridState] = useState(null);
    
    const [roleModal, setRoleModal] = useState({ isOpen: false, data: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, data: null });
    
    const [userModal, setUserModal] = useState({ isOpen: false, role: null });
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserResults, setShowUserResults] = useState(false);

    const [accessModal, setAccessModal] = useState({ isOpen: false, role: null });

    const [formData, setFormData] = useState({
      id: null,
      code: '',
      title: '',
      is_active: true,
      description: '',
      start_date: '',
      end_date: ''
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
        const { data: rolesData } = await supabase.from('sec_roles').select('*').order('created_at', { ascending: false });
        if (rolesData) setRoles(rolesData);

        const { data: usersData } = await supabase.from('sec_users').select('id, username, is_active').eq('is_active', true);
        if (usersData) setAllUsers(usersData);
      } catch (err) {
        console.error('Fetch Roles Data Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleToggleActive = async (row, newValue) => {
      try {
        const { error } = await supabase.from('sec_roles').update({ is_active: newValue }).eq('id', row.id);
        if (error) throw error;
        setRoles(prev => prev.map(item => item.id === row.id ? { ...item, is_active: newValue } : item));
      } catch (err) {
        console.error("Toggle Active Error:", err);
      }
    };

    const handleOpenRoleModal = (record = null) => {
      setFormData(record ? {
        id: record.id,
        code: record.code || '',
        title: record.title || '',
        is_active: record.is_active ?? true,
        description: record.description || '',
        start_date: record.start_date || '',
        end_date: record.end_date || ''
      } : { 
        id: null,
        code: '',
        title: '',
        is_active: true,
        description: '',
        start_date: '',
        end_date: ''
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
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
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
        setShowUserResults(false);
        try {
            const { data: userRoles } = await supabase.from('sec_user_roles').select('user_id').eq('role_id', role.id);
            if (userRoles) {
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
            const { error } = await supabase.from('sec_user_roles').insert([{ user_id: userId, role_id: userModal.role.id }]);
            if (error) throw error;
            setAssignedUsers(prev => [...prev, allUsers.find(u => u.id === userId)]);
            setUserSearchTerm('');
            setShowUserResults(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const removeUser = async (row) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.from('sec_user_roles').delete().match({ user_id: row.id, role_id: userModal.role.id });
            if (error) throw error;
            setAssignedUsers(prev => prev.filter(u => u.id !== row.id));
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

    const columns = [
      { field: 'code', header_fa: 'کد نقش', header_en: 'Role Code', width: '120px', render: (val) => <span className="text-[11px] text-slate-700 dark:text-slate-300 dir-ltr inline-block">{val}</span> },
      { field: 'title', header_fa: 'عنوان نقش', header_en: 'Role Title', width: '250px', render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200 text-[12px]">{val}</span> },
      { field: 'start_date', header_fa: 'تاریخ شروع', header_en: 'Start Date', width: '110px', render: (val) => val ? <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /><span className="text-[11px] text-slate-700 dark:text-slate-300 dir-ltr inline-block">{val}</span></div> : '-' },
      { field: 'end_date', header_fa: 'تاریخ پایان', header_en: 'End Date', width: '110px', render: (val) => val ? <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /><span className="text-[11px] text-slate-700 dark:text-slate-300 dir-ltr inline-block">{val}</span></div> : '-' },
      { field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', width: '90px', type: 'toggle', onToggle: (row, val) => handleToggleActive(row, val) }
    ];

    const assignedUsersColumns = [
        { field: 'username', header_fa: 'نام کاربری', header_en: 'Username', width: '150px', render: (val) => <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{val}</span> },
        { field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', width: '100px', render: (val) => <div className="flex justify-center"><input type="checkbox" checked={val} readOnly className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-default" /></div> }
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
                { icon: Shield, tooltip: t('دسترسی‌ها', 'Permissions'), onClick: (row) => setAccessModal({ isOpen: true, role: row }), className: 'text-slate-400 hover:text-amber-600' },
                { icon: Users, tooltip: t('کاربران نقش', 'Role Users'), onClick: (row) => openUserModal(row), className: 'text-slate-400 hover:text-indigo-600' },
                { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => handleOpenRoleModal(row), className: 'text-slate-400 hover:text-blue-600' },
                { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, data: row }), className: 'text-slate-400 hover:text-red-600' }
              ]}
            />
          </div>
        </div>

        {RoleAccess && <RoleAccess isOpen={accessModal.isOpen} role={accessModal.role} onClose={() => setAccessModal({ isOpen: false, role: null })} language={language} />}

        <Modal isOpen={roleModal.isOpen} onClose={() => setRoleModal({ isOpen: false, data: null })} title={roleModal.data ? t('ویرایش نقش', 'Edit Role') : t('تعریف نقش جدید', 'New Role')} width="max-w-md" language={language}>
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField size="sm" label={t('کد نقش *', 'Role Code *')} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} dir="ltr" disabled={!!roleModal.data} placeholder="ROLE_ADMIN" />
                <TextField size="sm" label={t('عنوان نقش *', 'Role Title *')} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
                
                <DatePicker size="sm" label={t('تاریخ شروع', 'Start Date')} value={formData.start_date} onChange={val => setFormData({...formData, start_date: val})} isRtl={isRtl} language={language} />
                <DatePicker size="sm" label={t('تاریخ پایان', 'End Date')} value={formData.end_date} onChange={val => setFormData({...formData, end_date: val})} isRtl={isRtl} language={language} />
                
                <div className="md:col-span-2">
                    <TextField size="sm" label={t('توضیحات', 'Description')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} isRtl={isRtl} multiline rows={2} />
                </div>
                <div className="md:col-span-2 mt-1 flex items-center">
                    <ToggleField size="sm" label={t('فعال', 'Active')} checked={formData.is_active} onChange={v => setFormData({...formData, is_active: v})} isRtl={isRtl} />
                </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setRoleModal({ isOpen: false, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveRole} isLoading={isLoading}>{t('ذخیره', 'Save')}</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={userModal.isOpen} onClose={() => setUserModal({ isOpen: false, role: null })} title={`${t('تخصیص کاربران به نقش:', 'Assign Users to Role:')} ${userModal.role?.title || ''}`} width="max-w-lg" language={language}>
            <div className="flex flex-col h-[500px]">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 mx-4 mt-4 mb-3 relative z-[60]">
                    <label className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 mb-2 block flex items-center gap-2"><UserPlus size={14}/> {t('افزودن کاربر جدید به این نقش', 'Add user to this role')}</label>
                    <div className="relative">
                        <input 
                            value={userSearchTerm} 
                            onChange={(e) => { setUserSearchTerm(e.target.value); setShowUserResults(true); }} 
                            placeholder={t('جستجوی نام کاربری...', 'Search username...')} 
                            className={`w-full h-9 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded text-[11px] outline-none focus:ring-2 focus:ring-indigo-300 transition-all ${isRtl ? 'pr-9 pl-2' : 'pl-9 pr-2'} text-slate-800 dark:text-slate-200`} 
                        />
                        <Search size={16} className={`absolute top-2.5 text-indigo-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`}/>
                        
                        {showUserResults && userSearchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[100]">
                                {searchResults.length > 0 ? searchResults.map(u => (
                                    <div key={u.id} onClick={() => assignUser(u.id)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 last:border-0 group transition-colors">
                                        <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 dir-ltr">{u.username}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded"><Plus size={14}/></div>
                                    </div>
                                )) : <div className="p-3 text-center text-[11px] text-slate-400">{t('کاربری یافت نشد.', 'No user found.')}</div>}
                            </div>
                        )}
                        {showUserResults && userSearchTerm && <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserResults(false)}></div>}
                    </div>
                </div>
                <div className="flex-1 overflow-hidden px-4 pb-4 bg-white dark:bg-slate-900 relative z-0 flex flex-col">
                    <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
                        <DataGrid 
                            columns={assignedUsersColumns} 
                            data={assignedUsers} 
                            isRtl={isRtl} 
                            isLoading={isLoading}
                            hideImport={true}
                            hideAdvancedSearch={true}
                            actions={[
                                { icon: UserMinus, tooltip: t('حذف از نقش', 'Remove from role'), onClick: (row) => removeUser(row), className: 'text-slate-400 hover:text-red-500' }
                            ]}
                        />
                    </div>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setUserModal({ isOpen: false, role: null })}>{t('بستن', 'Close')}</Button>
                </div>
            </div>
        </Modal>

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