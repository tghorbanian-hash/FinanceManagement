/* Filename: OrganizationInfo.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  
  const { 
    Button, PageHeader, Modal, AdvancedFilter, DataGrid, 
    TextField, ToggleField, Badge
  } = window.DesignSystem || {};
  
  const { Building2, Plus, Edit, Trash2, MapPin, Upload, X, Save, AlertTriangle, Lock } = window.LucideIcons || {};
  const supabase = window.supabase;

  const OrganizationInfo = ({ isAdmin, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });
    
    const [formData, setFormData] = useState({
      code: '', 
      name: '', 
      regNo: '', 
      phone: '', 
      fax: '', 
      logo: null, 
      addresses: [], 
      isActive: true
    });
    const [newAddress, setNewAddress] = useState('');

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: orgs, error } = await supabase
          .from('organization_info')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData = (orgs || []).map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          regNo: item.reg_no,
          phone: item.phone,
          fax: item.fax,
          logo: item.logo,
          addresses: item.addresses || [],
          isActive: item.is_active ?? true
        }));
        
        setData(mappedData);
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSave = async () => {
      if (!formData.code || !formData.name) return;

      setIsLoading(true);
      try {
        const payload = {
          code: formData.code,
          name: formData.name,
          reg_no: formData.regNo,
          phone: formData.phone,
          fax: formData.fax,
          logo: formData.logo,
          addresses: formData.addresses || [],
          is_active: formData.isActive
        };

        const { error } = currentRecord?.id 
          ? await supabase.from('organization_info').update(payload).eq('id', currentRecord.id)
          : await supabase.from('organization_info').insert([payload]);

        if (error) throw error;
        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Save Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const executeDelete = async () => {
      setIsLoading(true);
      try {
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from('organization_info').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from('organization_info').delete().in('id', deleteConfirm.data);
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

    const handleOpenModal = (record = null) => {
      setFormData(record ? { ...record } : { 
        code: '', name: '', regNo: '', phone: '', fax: '', 
        logo: null, addresses: [], isActive: true 
      });
      setCurrentRecord(record);
      setNewAddress('');
      setIsModalOpen(true);
    };

    const columns = [
      { field: 'code', header_fa: 'کد', header_en: 'Code', width: '100px' },
      { field: 'name', header_fa: 'نام سازمان', header_en: 'Name', width: '250px' },
      { field: 'regNo', header_fa: 'شماره ثبت', header_en: 'Reg No', width: '120px' },
      { field: 'phone', header_fa: 'تلفن', header_en: 'Phone', width: '120px' },
      { 
        field: 'isActive', header_fa: 'وضعیت', header_en: 'Status', width: '100px',
        render: (val) => (
          <Badge variant={val ? "success" : "slate"} size="sm">
            {val ? t('فعال', 'Active') : t('غیرفعال', 'Inactive')}
          </Badge>
        ) 
      }
    ];

    const filteredData = useMemo(() => {
      let result = [...data];
      if (filters.code) {
         result = result.filter(c => c.code.toLowerCase().includes(filters.code.toLowerCase()));
      }
      if (filters.name) {
         result = result.filter(c => c.name.toLowerCase().includes(filters.name.toLowerCase()));
      }
      return result;
    }, [data, filters]);

    const filterFields = [
      { name: 'code', label: t('کد سازمان', 'Code'), type: 'text' },
      { name: 'name', label: t('نام سازمان', 'Name'), type: 'text' }
    ];

    return (
      <div className="flex flex-col h-full p-4 bg-[#f8fafc] dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('اطلاعات سازمان', 'Organization Info')} 
          icon={Building2}
          description={t('تنظیمات پایه و مدیریت ساختار شرکت', 'Base settings and company structure')}
          language={language}
          breadcrumbs={[{ label: t('تنظیمات پایه', 'Base Setup') }, { label: t('سازمان', 'Organization') }]}
        />

        <div className="flex-1 flex flex-col min-h-0 mt-4 animate-in fade-in duration-300">
          <AdvancedFilter 
            fields={filterFields}
            initialValues={filters}
            onFilter={setFilters}
            onClear={() => setFilters({})}
            language={language}
          />

          <div className="flex-1 min-h-0 mt-2">
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
              actions={[
                { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => handleOpenModal(row), className: 'text-slate-400 hover:text-indigo-600' },
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
          title={currentRecord ? t('ویرایش سازمان', 'Edit Org') : t('تعریف سازمان جدید', 'New Org')}
          width="max-w-xl"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
               {formData.logo ? (
                 <div className="relative group">
                   <img src={formData.logo} className="h-16 object-contain" alt="Logo" />
                   <button onClick={() => setFormData({...formData, logo: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                 </div>
               ) : (
                 <label className="cursor-pointer flex flex-col items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                   <Upload size={20}/>
                   <span className="text-[11px] font-bold">{t('بارگذاری لوگوی سازمان', 'Upload Logo')}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const reader = new FileReader();
                     reader.onload = () => setFormData({...formData, logo: reader.result});
                     if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                   }} />
                 </label>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField size="sm" label={t('کد سازمان', 'Code')} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} required dir="ltr" />
              <TextField size="sm" label={t('نام سازمان', 'Name')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} isRtl={isRtl} required />
              <TextField size="sm" label={t('شماره ثبت', 'Reg No')} value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} isRtl={isRtl} dir="ltr" />
              <div className="flex items-center mt-6">
                <ToggleField size="sm" label={t('وضعیت فعال بودن سازمان', 'Active Status')} checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} isRtl={isRtl} />
              </div>
              <TextField size="sm" label={t('تلفن', 'Phone')} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} isRtl={isRtl} dir="ltr" />
              <TextField size="sm" label={t('فکس', 'Fax')} value={formData.fax} onChange={e => setFormData({...formData, fax: e.target.value})} isRtl={isRtl} dir="ltr" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
               <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500"/> {t('مدیریت آدرس‌ها', 'Manage Addresses')}</label>
               <div className="flex gap-2 mb-3">
                 <div className="flex-1">
                   <TextField size="sm" placeholder={t('آدرس جدید را وارد کنید...', 'New address...')} value={newAddress} onChange={e => setNewAddress(e.target.value)} isRtl={isRtl} wrapperClassName="m-0" />
                 </div>
                 <Button variant="secondary" size="sm" icon={Plus} onClick={() => {
                   if(!newAddress.trim()) return;
                   setFormData({...formData, addresses: [...formData.addresses, { id: Date.now(), text: newAddress.trim() }]});
                   setNewAddress('');
                 }}>{t('افزودن', 'Add')}</Button>
               </div>
               
               <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                 {formData.addresses.map(a => (
                   <div key={a.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] group shadow-sm">
                     <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{a.text}</span>
                     <button onClick={() => setFormData({...formData, addresses: formData.addresses.filter(x => x.id !== a.id)})} className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 p-1.5 rounded transition-colors ms-2 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                   </div>
                 ))}
                 {formData.addresses.length === 0 && (
                   <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-md">
                      <span className="text-[10px] text-slate-400">{t('هیچ آدرسی ثبت نشده است.', 'No addresses found.')}</span>
                   </div>
                 )}
               </div>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={isLoading}>{t('ذخیره تغییرات', 'Save Changes')}</Button>
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
                : t(`آیا از حذف سازمان ${deleteConfirm.data?.name} اطمینان دارید؟`, `Delete ${deleteConfirm.data?.name}?`)
              }
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={executeDelete} isLoading={isLoading} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 border-red-600 dark:border-red-500">{t('تایید حذف', 'Delete')}</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  window.OrganizationInfo = OrganizationInfo;
})();