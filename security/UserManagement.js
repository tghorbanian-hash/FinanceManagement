/* Filename: security/UserManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  const { 
    Users, Plus, Edit, Trash2, RefreshCw, Key, Shield, Check, X, 
    Download, Upload, FileText, Search, Loader2 
  } = window.LucideIcons || {};

  const UserManagement = ({ language = 'fa' }) => {
    const { 
      Button, Badge, PageHeader, Modal, Toast, Card 
    } = window.DesignSystem || {};
    
    const { 
      TextField, SelectField, ToggleField 
    } = window.DesignSystem || {};
    
    const { 
      AdvancedFilter, DataGrid 
    } = window.DesignSystem || {};

    const supabase = window.supabase;
    const isRtl = language === 'fa';

    const [users, setUsers] = useState([]);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);
    
    const [toastConfig, setToastConfig] = useState({ isVisible: false, message: '', type: 'success' });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      fullName: '',
      partyId: '',
      userType: 'کاربر سیستم',
      isActive: true,
      email: '',
      mobile: ''
    });

    const [filterValues, setFilterValues] = useState({
      username: '',
      fullName: '',
      userType: '',
      isActive: ''
    });

    const showToast = (message, type = 'success') => {
      setToastConfig({ isVisible: true, message, type });
      setTimeout(() => setToastConfig(prev => ({ ...prev, isVisible: false })), 3000);
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: pData, error: pError } = await supabase.schema('cmn').from('parties').select('id, name, code');
        if (!pError && pData) setParties(pData);

        const { data: uData, error: uError } = await supabase.schema('sec').from('users').select('*').order('created_at', { ascending: false });
        if (uError) throw uError;
        if (uData) setUsers(uData);
      } catch (err) {
        console.error('Error fetching data:', err);
        showToast('خطا در دریافت اطلاعات کاربران', 'error');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    const hashPassword = async (pass) => {
      const msgBuffer = new TextEncoder().encode(pass);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleCreate = () => {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        partyId: '',
        userType: 'کاربر سیستم',
        isActive: true,
        email: '',
        mobile: ''
      });
      setIsEditModalOpen(true);
    };

    const handleEdit = (user) => {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        password: '',
        fullName: user.full_name || '',
        partyId: user.party_id || '',
        userType: user.user_type || 'کاربر سیستم',
        isActive: user.is_active,
        email: user.email || '',
        mobile: user.mobile || ''
      });
      setIsEditModalOpen(true);
    };

    const handleSave = async () => {
      if (!formData.username) {
        showToast('نام کاربری الزامی است', 'error');
        return;
      }
      if (!editingUser && !formData.password) {
        showToast('رمز عبور برای کاربر جدید الزامی است', 'error');
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          username: formData.username,
          full_name: formData.fullName,
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

        if (editingUser) {
          const { error } = await supabase.schema('sec').from('users').update(payload).eq('id', editingUser.id);
          if (error) throw error;
          showToast('کاربر با موفقیت بروزرسانی شد');
        } else {
          const { error } = await supabase.schema('sec').from('users').insert([payload]);
          if (error) throw error;
          showToast('کاربر جدید با موفقیت ایجاد شد');
        }
        setIsEditModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Save error:', err);
        showToast(err.message?.includes('unique') ? 'این نام کاربری قبلا ثبت شده است' : 'خطا در ذخیره اطلاعات', 'error');
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async (ids) => {
      if (!window.confirm(`آیا از حذف ${ids.length} کاربر اطمینان دارید؟`)) return;
      try {
        const { error } = await supabase.schema('sec').from('users').delete().in('id', ids);
        if (error) throw error;
        showToast('کاربران انتخاب شده با موفقیت حذف شدند');
        setSelectedRows([]);
        fetchData();
      } catch (err) {
        console.error('Delete error:', err);
        showToast('خطا در حذف کاربران', 'error');
      }
    };

    const handleResetPassword = async (user) => {
      if (!window.confirm(`آیا از بازنشانی رمز عبور کاربر "${user.username}" به 123456 اطمینان دارید؟`)) return;
      try {
        const newHash = await hashPassword('123456');
        const { error } = await supabase.schema('sec').from('users').update({ password_hash: newHash }).eq('id', user.id);
        if (error) throw error;
        showToast('رمز عبور با موفقیت بازنشانی شد');
      } catch (err) {
        console.error('Reset password error:', err);
        showToast('خطا در بازنشانی رمز عبور', 'error');
      }
    };

    const handleExport = () => {
      if (users.length === 0) {
        showToast('داده‌ای برای خروجی وجود ندارد', 'error');
        return;
      }
      
      const csvHeaders = ['نام کاربری', 'نام و نام خانوادگی', 'نوع کاربری', 'ایمیل', 'موبایل', 'وضعیت'];
      const csvData = users.map(u => [
        u.username || '',
        u.full_name || '',
        u.user_type || '',
        u.email || '',
        u.mobile || '',
        u.is_active ? 'فعال' : 'غیرفعال'
      ]);
      
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + csvHeaders.join(",") + "\n" 
        + csvData.map(e => e.join(",")).join("\n");
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `users_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('خروجی اکسل با موفقیت ایجاد شد');
    };

    const handleDownloadTemplate = () => {
      const csvContent = "data:text/csv;charset=utf-8,\uFEFFنام کاربری,نام و نام خانوادگی,رمز عبور,نوع کاربری,ایمیل,موبایل\nuser1,علی احمدی,123456,کاربر سیستم,ali@test.com,09120000000";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "users_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const filteredUsers = useMemo(() => {
      return users.filter(user => {
        const matchUsername = !filterValues.username || (user.username && user.username.toLowerCase().includes(filterValues.username.toLowerCase()));
        const matchFullName = !filterValues.fullName || (user.full_name && user.full_name.toLowerCase().includes(filterValues.fullName.toLowerCase()));
        const matchUserType = !filterValues.userType || user.user_type === filterValues.userType;
        let matchActive = true;
        if (filterValues.isActive === 'active') matchActive = user.is_active === true;
        if (filterValues.isActive === 'inactive') matchActive = user.is_active === false;
        
        return matchUsername && matchFullName && matchUserType && matchActive;
      });
    }, [users, filterValues]);

    const formatDateTime = (dateString) => {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleString('fa-IR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };

    const columns = [
      { 
        header: 'شناسه', field: 'id', width: 'w-16', 
        render: (r) => <span className="text-[10px] text-slate-400 font-mono truncate w-12 inline-block" title={r.id}>{r.id.split('-')[0]}</span> 
      },
      { header: 'نام کاربری', field: 'username', width: 'w-32', sortable: true },
      { 
        header: 'نام و نام خانوادگی', field: 'full_name', width: 'w-48', sortable: true,
        render: (r) => <span className="font-bold text-slate-700">{r.full_name || '-'}</span>
      },
      { header: 'نوع کاربری', field: 'user_type', width: 'w-32', sortable: true },
      { header: 'موبایل / ایمیل', field: 'contact', width: 'w-48', render: (r) => (
        <div className="flex flex-col text-[10px] text-slate-500">
          {r.mobile && <span>{r.mobile}</span>}
          {r.email && <span>{r.email}</span>}
          {!r.mobile && !r.email && <span>-</span>}
        </div>
      )},
      { 
        header: 'آخرین ورود', field: 'last_login', width: 'w-36', sortable: true,
        render: (r) => <span className="dir-ltr text-[11px] text-slate-500">{formatDateTime(r.last_login)}</span>
      },
      { 
        header: 'وضعیت', field: 'is_active', width: 'w-24 text-center', sortable: true,
        render: (r) => <Badge variant={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'فعال' : 'غیرفعال'}</Badge> 
      }
    ];

    const actions = (row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title="ویرایش" />
        <Button variant="ghost" size="iconSm" icon={RefreshCw} className="text-amber-600" onClick={() => handleResetPassword(row)} title="بازنشانی رمز عبور" />
      </div>
    );

    const headerActions = (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" icon={Upload} onClick={() => setIsImportModalOpen(true)}>ایمپورت</Button>
        <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>اکسپورت</Button>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleCreate}>کاربر جدید</Button>
      </div>
    );

    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <PageHeader 
          title="مدیریت کاربران" 
          icon={Users} 
          description="تعریف و مدیریت دسترسی ورود کاربران به سیستم"
          actions={headerActions}
        />

        <div className="p-4 flex flex-col h-full overflow-hidden gap-4">
          <AdvancedFilter 
            onClear={() => setFilterValues({ username: '', fullName: '', userType: '', isActive: '' })}
            isRtl={isRtl}
          >
            <TextField 
              label="نام کاربری" 
              value={filterValues.username} 
              onChange={(e) => setFilterValues(p => ({ ...p, username: e.target.value }))} 
              placeholder="جستجو..." 
            />
            <TextField 
              label="نام و نام خانوادگی" 
              value={filterValues.fullName} 
              onChange={(e) => setFilterValues(p => ({ ...p, fullName: e.target.value }))} 
              placeholder="جستجو..." 
            />
            <SelectField 
              label="نوع کاربری" 
              value={filterValues.userType} 
              onChange={(e) => setFilterValues(p => ({ ...p, userType: e.target.value }))}
            >
              <option value="">همه</option>
              <option value="مدیر سیستم">مدیر سیستم</option>
              <option value="کاربر سیستم">کاربر سیستم</option>
            </SelectField>
            <SelectField 
              label="وضعیت" 
              value={filterValues.isActive} 
              onChange={(e) => setFilterValues(p => ({ ...p, isActive: e.target.value }))}
            >
              <option value="">همه</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </SelectField>
          </AdvancedFilter>

          <Card className="flex-1 overflow-hidden flex flex-col p-0 border-0 shadow-sm">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : (
              <DataGrid 
                columns={columns} 
                data={filteredUsers} 
                isRtl={isRtl} 
                selectedIds={selectedRows} 
                onSelectAll={(c) => setSelectedRows(c ? filteredUsers.map(r => r.id) : [])} 
                onSelectRow={(id, c) => setSelectedRows(p => c ? [...p, id] : p.filter(r => r !== id))} 
                onDelete={handleDelete}
                actions={actions}
                height="h-full"
              />
            )}
          </Card>
        </div>

        {Modal && (
          <Modal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            title={editingUser ? "ویرایش کاربر" : "تعریف کاربر جدید"} 
            size="md" 
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>انصراف</Button>
                <Button variant="primary" icon={Check} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <TextField 
                label="نام کاربری *" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                className="dir-ltr text-left" 
                placeholder="User Name"
              />
              <SelectField 
                label="نوع کاربری" 
                value={formData.userType} 
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
              >
                <option value="مدیر سیستم">مدیر سیستم</option>
                <option value="کاربر سیستم">کاربر سیستم</option>
              </SelectField>
              
              <TextField 
                label={editingUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور *"} 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="dir-ltr" 
                placeholder="********" 
              />
              <TextField 
                label="نام و نام خانوادگی" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              />

              <TextField 
                label="موبایل" 
                value={formData.mobile} 
                onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                className="dir-ltr text-left"
              />
              <TextField 
                label="ایمیل" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="dir-ltr text-left"
              />

              <div className="col-span-2">
                <SelectField 
                  label="اتصال به شخص / پرسنل (اختیاری)" 
                  value={formData.partyId} 
                  onChange={(e) => setFormData({...formData, partyId: e.target.value})}
                >
                  <option value="">-- انتخاب کنید --</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </SelectField>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100">
                <ToggleField 
                  label="کاربر فعال است و اجازه ورود به سیستم را دارد" 
                  checked={formData.isActive} 
                  onChange={(val) => setFormData({...formData, isActive: val})} 
                />
              </div>
            </div>
          </Modal>
        )}

        {Modal && (
          <Modal 
            isOpen={isImportModalOpen} 
            onClose={() => setIsImportModalOpen(false)} 
            title="ایمپورت کاربران از اکسل" 
            size="sm"
          >
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <div className="bg-indigo-50 p-4 rounded-full text-indigo-500 mb-2">
                <Upload size={32} />
              </div>
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                برای ایمپورت گروهی کاربران، ابتدا نمونه فایل اکسل را دانلود کرده و اطلاعات را طبق فرمت آن تکمیل نمایید.
              </p>
              
              <Button variant="outline" icon={Download} onClick={handleDownloadTemplate} className="w-full justify-center">
                دانلود فایل نمونه (Template)
              </Button>

              <div className="w-full relative mt-4">
                <input 
                  type="file" 
                  accept=".csv,.xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      showToast('فایل با موفقیت بارگذاری شد (نسخه دمو)');
                      setIsImportModalOpen(false);
                    }
                  }}
                />
                <Button variant="primary" icon={FileText} className="w-full justify-center">
                  انتخاب فایل و ایمپورت
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {Toast && (
          <Toast 
            isVisible={toastConfig.isVisible} 
            message={toastConfig.message} 
            type={toastConfig.type} 
            onClose={() => setToastConfig(p => ({ ...p, isVisible: false }))} 
          />
        )}
      </div>
    );
  };

  window.UserManagement = UserManagement;
})();