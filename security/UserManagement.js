/* Filename: security/UserManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  
  const { 
    Button, PageHeader, Modal, AdvancedFilter, DataGrid, 
    TextField, SelectField, ToggleField, Badge
  } = window.DesignSystem || {};
  
  const { 
    Users, Edit, Trash2, Save, 
    AlertTriangle, Lock, RefreshCw
  } = window.LucideIcons || {};
  const supabase = window.supabase;

  const UserManagement = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    
    const [data, setData] = useState([]);
    const [allParties, setAllParties] = useState([]);
    const [partiesDropdown, setPartiesDropdown] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });
    const [resetConfirm, setResetConfirm] = useState({ isOpen: false, data: null });
    
    const [formData, setFormData] = useState({
      username: '',
      password: '123456',
      partyId: '',
      userType: 'کاربر سیستم',
      isActive: true,
      email: '',
      mobile: ''
    });

    const [gridState, setGridState] = useState(null);

    const viewConfig = {
      pageId: 'users_main',
      currentState: () => ({ 
        filters,
        gridState
      }),
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
      fetchData();
    }, []);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: pData, error: pError } = await supabase
          .from('parties')
          .select('id, first_name, last_name, company_name, party_type, code, roles, mobile, email');
          
        if (pData && !pError) {
          setAllParties(pData);
          const sysUsers = pData.filter(p => p.roles && p.roles.includes('system_user'));
          setPartiesDropdown(sysUsers.map(p => ({
            id: p.id,
            label: `${p.party_type === 'legal' ? (p.company_name || '') : ((p.first_name || '') + ' ' + (p.last_name || '')).trim()} (${p.code})`,
            mobile: p.mobile,
            email: p.email
          })));
        } else if (pError) {
          console.error('Parties Fetch Error:', pError);
        }

        // استفاده از View ساخته شده در اسکیمای public برای دور زدن باگ Supabase
        const { data: usersData, error } = await supabase
          .from('sec_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setData(usersData || []);
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const hashPassword = async (pass) => {
      const msgBuffer = new TextEncoder().encode(pass);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSave = async () => {
      if (!formData.username || !formData.partyId) {
        alert(t('وارد کردن نام کاربری و اتصال به شخص الزامی است.', 'Username and Party connection are required.'));
        return;
      }
      if (!currentRecord && !formData.password) return;

      setIsLoading(true);
      try {
        const payload = {
          username: formData.username,
          party_id: formData.partyId || null,
          user_type: formData.userType,
          is_active: formData.isActive,
          email: formData.email,
          mobile: formData.mobile,
          updated_at: new Date().toISOString()
        };

        if (formData.password) {
          payload.password_hash = await hashPassword(formData.password);
        }

        const { error } = currentRecord?.id 
          ? await supabase.from('sec_users').update(payload).eq('id', currentRecord.id)
          : await supabase.from('sec_users').insert([payload]);

        if (error) {
          if (error.message?.includes('unique') || error.code === '23505') {
            alert(t('این نام کاربری قبلاً ثبت شده است.', 'This username is already taken.'));
          } else {
            throw error;
          }
          return;
        }
        
        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Save Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleToggleActive = async (row, newValue) => {
      try {
        const { error } = await supabase
          .from('sec_users')
          .update({ is_active: newValue })
          .eq('id', row.id);
        
        if (error) throw error;
        setData(prev => prev.map(item => item.id === row.id ? { ...item, is_active: newValue } : item));
      } catch (err) {
        console.error("Toggle Error:", err);
      }
    };

    const executeDelete = async () => {
      setIsLoading(true);
      try {
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from('sec_users').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from('sec_users').delete().in('id', deleteConfirm.data);
          if (error) throw error;
        }
        
        setSelectedIds([]);
        setDeleteConfirm({ isOpen: false, type: null, data: null });
        fetchData();
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const executeResetPassword = async () => {
      setIsLoading(true);
      try {
        const newHash = await hashPassword('123456');
        const { error } = await supabase.from('sec_users').update({ password_hash: newHash }).eq('id', resetConfirm.data.id);
        if (error) throw error;
        setResetConfirm({ isOpen: false, data: null });
      } catch (err) {
        console.error('Reset password error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenModal = (record = null) => {
      setFormData(record ? {
        username: record.username || '',
        password: '',
        partyId: record.party_id || '',
        userType: record.user_type || 'کاربر سیستم',
        isActive: record.is_active ?? true,
        email: record.email || '',
        mobile: record.mobile || ''
      } : { 
        username: '',
        password: '123456',
        partyId: '',
        userType: 'کاربر سیستم',
        isActive: true,
        email: '',
        mobile: ''
      });
      setCurrentRecord(record);
      setIsModalOpen(true);
    };

    const handlePartyChange = (e) => {
      const selectedId = e.target.value;
      const selectedParty = partiesDropdown.find(p => p.id === selectedId);
      
      setFormData(prev => ({
        ...prev,
        partyId: selectedId,
        mobile: selectedParty?.mobile || prev.mobile,
        email: selectedParty?.email || prev.email
      }));
    };

    const handleDownloadSample = () => {
      const headers = isRtl
        ? 'نام کاربری,نوع کاربری,ایمیل,موبایل'
        : 'Username,User Type,Email,Mobile';
        
      const sampleRow = isRtl
        ? 'admin,مدیر سیستم,admin@test.com,09120000000'
        : 'admin,System Admin,admin@test.com,09120000000';
        
      const csv = '\uFEFF' + headers + '\n' + sampleRow;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Users_Import_Sample.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleImportFile = (file) => {
      if (!file) return;
      console.log('Import file selected:', file.name);
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleString(isRtl ? 'fa-IR' : 'en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };

    const getPartyName = (partyId) => {
      if (!partyId) return '-';
      const p = allParties.find(x => x.id === partyId);
      if (!p) return '-';
      return p.party_type === 'legal' ? p.company_name : `${p.first_name || ''} ${p.last_name || ''}`.trim();
    };

    const columns = [
      { 
        field: 'username', 
        header_fa: 'نام کاربری', 
        header_en: 'Username', 
        width: '150px',
        render: (val) => <span className="font-mono text-slate-700 dark:text-slate-300">{val}</span>
      },
      { 
        field: 'party_id', 
        header_fa: 'نام و نام خانوادگی / شخص متصل', 
        header_en: 'Linked Party / Full Name', 
        width: '200px',
        render: (val) => <span className="font-bold text-slate-700 dark:text-slate-200">{getPartyName(val)}</span>
      },
      { 
        field: 'user_type', 
        header_fa: 'نوع کاربری', 
        header_en: 'Type', 
        width: '120px',
        render: (val) => (
          <Badge variant={val === 'مدیر سیستم' || val === 'System Admin' ? 'indigo' : 'slate'} size="sm">
            {val}
          </Badge>
        )
      },
      { field: 'mobile', header_fa: 'موبایل', header_en: 'Mobile', width: '130px', render: (val) => <span className="font-mono">{val || '-'}</span> },
      { field: 'email', header_fa: 'ایمیل', header_en: 'Email', width: '200px', render: (val) => <span className="font-mono">{val || '-'}</span> },
      { 
        field: 'last_login', 
        header_fa: 'آخرین ورود', 
        header_en: 'Last Login', 
        width: '140px',
        render: (val) => <span className="text-[11px] text-slate-500 dir-ltr inline-block">{formatDateTime(val)}</span>
      },
      { 
        field: 'is_active', 
        header_fa: 'وضعیت', 
        header_en: 'Status', 
        width: '90px', 
        type: 'toggle',
        onToggle: (row, val) => handleToggleActive(row, val)
      }
    ];

    const filteredData = useMemo(() => {
      let result = [...data];
      if (filters.username) {
         result = result.filter(u => u.username && u.username.toLowerCase().includes(filters.username.toLowerCase()));
      }
      if (filters.partyName) {
         result = result.filter(u => {
            const pName = getPartyName(u.party_id).toLowerCase();
            return pName.includes(filters.partyName.toLowerCase());
         });
      }
      if (filters.userType) {
         result = result.filter(u => u.user_type === filters.userType);
      }
      if (filters.isActive) {
         const wantActive = filters.isActive === 'active';
         result = result.filter(u => u.is_active === wantActive);
      }
      return result;
    }, [data, filters, allParties]);

    const filterFields = [
      { name: 'username', label: t('نام کاربری', 'Username'), type: 'text' },
      { name: 'partyName', label: t('شخص متصل', 'Linked Party'), type: 'text' },
      { 
        name: 'userType', 
        label: t('نوع کاربری', 'User Type'), 
        type: 'select', 
        options: [
          { value: 'مدیر سیستم', label: t('مدیر سیستم', 'System Admin') },
          { value: 'کاربر سیستم', label: t('کاربر سیستم', 'System User') }
        ]
      },
      { 
        name: 'isActive', 
        label: t('وضعیت', 'Status'), 
        type: 'select', 
        options: [
          { value: 'active', label: t('فعال', 'Active') },
          { value: 'inactive', label: t('غیرفعال', 'Inactive') }
        ]
      }
    ];

    return (
      <div className="flex flex-col h-full p-4 bg-[#f8fafc] dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت کاربران', 'User Management')} 
          icon={Users}
          description={t('تعریف و مدیریت دسترسی ورود کاربران به سیستم', 'Manage user accounts and system access')}
          language={language}
          breadcrumbs={[{ label: t('امنیت', 'Security') }, { label: t('کاربران', 'Users') }]}
          viewConfig={viewConfig}
        />

        <div className="flex-1 flex flex-col min-h-0 mt-2 animate-in fade-in duration-300">
          <AdvancedFilter 
            fields={filterFields}
            initialValues={filters}
            onFilter={setFilters}
            onClear={() => setFilters({})}
            language={language}
          />

          <div className="flex-1 min-h-0 mt-1">
            <DataGrid 
              data={filteredData}
              columns={columns} 
              language={language}
              selectable={true}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              isLoading={isLoading}
              onAdd={() => handleOpenModal()}
              onRowDoubleClick={(row) => handleOpenModal(row)}
              gridState={gridState}
              onGridStateChange={setGridState}
              onDownloadSample={handleDownloadSample}
              onImport={handleImportFile}
              actions={[
                { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => handleOpenModal(row), className: 'text-slate-400 hover:text-indigo-600' },
                { icon: RefreshCw, tooltip: t('بازنشانی رمز عبور', 'Reset Password'), onClick: (row) => setResetConfirm({ isOpen: true, data: row }), className: 'text-slate-400 hover:text-amber-600' },
                { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row }), className: 'text-slate-400 hover:text-red-600' }
              ]}
              bulkActions={[
                { label: t('حذف گروهی', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: (ids) => setDeleteConfirm({ isOpen: true, type: 'bulk', data: ids }) }
              ]}
            />
          </div>
        </div>

        <Modal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          title={currentRecord ? t('ویرایش مشخصات کاربر', 'Edit User') : t('تعریف کاربر جدید', 'New User')}
          width="max-w-2xl"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField 
                size="sm" 
                label={t('نام کاربری', 'Username')} 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                isRtl={isRtl} 
                required 
                dir="ltr" 
              />
              <SelectField 
                size="sm" 
                label={t('نوع کاربری', 'User Type')} 
                value={formData.userType} 
                onChange={e => setFormData({...formData, userType: e.target.value})} 
                isRtl={isRtl}
                options={[
                  { value: 'مدیر سیستم', label: t('مدیر سیستم', 'System Admin') },
                  { value: 'کاربر سیستم', label: t('کاربر سیستم', 'System User') }
                ]}
              />

              <SelectField 
                size="sm" 
                label={t('اتصال به شخص / پرسنل *', 'Link to Party *')} 
                value={formData.partyId} 
                onChange={handlePartyChange} 
                isRtl={isRtl}
                options={[
                  { value: '', label: `-- ${t('انتخاب کنید', 'Select')} --` },
                  ...partiesDropdown.map(p => ({ value: p.id, label: p.label }))
                ]}
              />
              <TextField 
                size="sm" 
                label={currentRecord ? t('رمز عبور جدید (اختیاری)', 'New Password (Optional)') : t('رمز عبور *', 'Password *')} 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                isRtl={isRtl} 
                required={!currentRecord}
                dir="ltr" 
                placeholder="********"
              />

              <TextField 
                size="sm" 
                label={t('موبایل', 'Mobile')} 
                value={formData.mobile} 
                onChange={e => setFormData({...formData, mobile: e.target.value})} 
                isRtl={isRtl} 
                dir="ltr" 
              />
              <TextField 
                size="sm" 
                label={t('ایمیل', 'Email')} 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                isRtl={isRtl} 
                dir="ltr" 
              />

              <div className="md:col-span-2 flex items-center mt-2">
                 <ToggleField size="sm" label={t('کاربر فعال است', 'Is Active')} checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} isRtl={isRtl} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={isLoading}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 mb-1">
               <AlertTriangle size={22} />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1">
               <Lock size={12}/> {t('هشدار: غیرقابل بازگشت', 'WARNING: IRREVERSIBLE')}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {deleteConfirm.type === 'bulk' 
                ? t(`آیا از حذف ${deleteConfirm.data?.length} مورد انتخاب شده اطمینان دارید؟`, `Delete ${deleteConfirm.data?.length} selected items?`)
                : t(`آیا از حذف کاربر "${deleteConfirm.data?.username}" اطمینان دارید؟`, `Delete this user?`)
              }
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={executeDelete} isLoading={isLoading} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 border-red-600 dark:border-red-500">{t('تایید حذف', 'Delete')}</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={resetConfirm.isOpen} onClose={() => setResetConfirm({ isOpen: false, data: null })} title={t('بازنشانی رمز عبور', 'Reset Password')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-1">
               <RefreshCw size={22} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {t(`آیا از بازنشانی رمز عبور کاربر "${resetConfirm.data?.username}" به 123456 اطمینان دارید؟`, `Are you sure you want to reset password to 123456?`)}
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setResetConfirm({ isOpen: false, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={executeResetPassword} isLoading={isLoading} className="flex-1">{t('تایید بازنشانی', 'Confirm Reset')}</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  window.UserManagement = UserManagement;
})();