/* Filename: OrganizationInfo.js */
(() => {
  const React = window.React;
  const { useState, useEffect } = React;
  
  const { 
    Button, PageHeader, Modal, AdvancedFilter, DataGrid, 
    TextField, ToggleField, Badge
  } = window.DesignSystem || {};
  
  const { Building2, Plus, Edit, Trash2, MapPin, Upload, X, Save } = window.LucideIcons || {};
  const supabase = window.supabase;

  const OrganizationInfo = ({ isAdmin, language = 'fa' }) => {
    const isRtl = language === 'fa';
    
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({ code: '', name: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
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
          .schema('public')
          .from('organization_info')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching data:', error);
          return;
        }

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
        console.error('Unexpected error during fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSave = async () => {
      if (!formData.code || !formData.name) {
        alert(isRtl ? 'لطفاً کد و نام سازمان را وارد کنید.' : 'Please enter Organization Code and Name.');
        return;
      }

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

        if (currentRecord && currentRecord.id) {
          const { error } = await supabase
            .schema('public')
            .from('organization_info')
            .update(payload)
            .eq('id', currentRecord.id);

          if (error) {
            console.error('Error updating:', error);
            alert(isRtl ? 'خطا در ویرایش اطلاعات.' : 'Error updating data.');
            return;
          }
        } else {
          const { error } = await supabase
            .schema('public')
            .from('organization_info')
            .insert([payload]);

          if (error) {
            console.error('Error inserting:', error);
            alert(isRtl ? 'خطا در ثبت اطلاعات.' : 'Error inserting data.');
            return;
          }
        }

        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Unexpected error during save:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async (ids) => {
      if (!ids || ids.length === 0) return;
      
      const confirmMsg = isRtl ? `آیا از حذف ${ids.length} مورد اطمینان دارید؟` : `Delete ${ids.length} items?`;
      if (!window.confirm(confirmMsg)) return;

      setIsLoading(true);
      try {
        const { error } = await supabase
          .schema('public')
          .from('organization_info')
          .delete()
          .in('id', ids);

        if (error) {
          console.error('Error deleting:', error);
          alert(isRtl ? 'خطا در حذف اطلاعات.' : 'Error deleting data.');
          return;
        }

        setSelectedIds([]);
        fetchData();
      } catch (err) {
        console.error('Unexpected error during delete:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenModal = (record = null) => {
      if (record) {
        setFormData({ ...record });
      } else {
        setFormData({ 
          code: '', 
          name: '', 
          regNo: '', 
          phone: '', 
          fax: '', 
          logo: null, 
          addresses: [],
          isActive: true
        });
      }
      setCurrentRecord(record);
      setNewAddress('');
      setIsModalOpen(true);
    };

    const handleAddAddress = () => {
      if (!newAddress.trim()) return;
      setFormData(prev => ({
        ...prev,
        addresses: [...(prev.addresses || []), { id: Date.now(), text: newAddress.trim() }]
      }));
      setNewAddress('');
    };

    const handleRemoveAddress = (addrId) => {
      setFormData(prev => ({
        ...prev,
        addresses: prev.addresses.filter(a => a.id !== addrId)
      }));
    };

    const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, logo: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    };

    const columns = [
      { field: 'code', header: isRtl ? 'کد' : 'Code', width: 'w-24', sortable: true },
      { field: 'name', header: isRtl ? 'نام سازمان' : 'Name', width: 'w-64', sortable: true },
      { field: 'regNo', header: isRtl ? 'شماره ثبت' : 'Reg No', width: 'w-32' },
      { field: 'phone', header: isRtl ? 'تلفن' : 'Phone', width: 'w-32' },
      { 
        field: 'isActive', 
        header: isRtl ? 'وضعیت' : 'Status', 
        width: 'w-24', 
        render: (row) => (
          <Badge variant={row.isActive ? "success" : "danger"}>
            {row.isActive ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}
          </Badge>
        ) 
      }
    ];

    const filteredData = data.filter(item => {
      const matchCode = filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
      return matchCode && matchName;
    });

    return (
      <div className={`flex flex-col h-full p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900 ${isRtl ? 'font-sans' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mb-6">
          <PageHeader 
            title={isRtl ? 'اطلاعات سازمان' : 'Organization Info'}
            description={isRtl ? 'مدیریت اطلاعات پایه و ساختار شرکت' : 'Manage core company details and structure'}
            icon={Building2}
            actions={
              <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
                {isRtl ? 'سازمان جدید' : 'New Organization'}
              </Button>
            }
          />
        </div>

        <div className="mb-4">
          <AdvancedFilter 
            isRtl={isRtl} 
            onClear={() => setFilters({ code: '', name: '' })}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField 
                label={isRtl ? 'جستجو بر اساس کد' : 'Search by Code'} 
                value={filters.code}
                onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                isRtl={isRtl}
              />
              <TextField 
                label={isRtl ? 'جستجو بر اساس نام' : 'Search by Name'} 
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                isRtl={isRtl}
              />
            </div>
          </AdvancedFilter>
        </div>

        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <DataGrid 
            columns={columns} 
            data={filteredData} 
            selectedIds={selectedIds}
            onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
            onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
            isRtl={isRtl}
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} title={isRtl ? 'ویرایش' : 'Edit'} />
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete([row.id])} title={isRtl ? 'حذف' : 'Delete'} />
              </div>
            )}
          />
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={currentRecord ? (isRtl ? 'ویرایش اطلاعات سازمان' : 'Edit Organization Info') : (isRtl ? 'ثبت سازمان جدید' : 'New Organization')}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                {isRtl ? 'انصراف' : 'Cancel'}
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSave} isLoading={isLoading}>
                {isRtl ? 'ذخیره تغییرات' : 'Save Changes'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="md:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               {formData.logo ? (
                 <div className="relative group">
                   <img src={formData.logo} alt="Organization Logo" className="h-28 object-contain rounded-lg" />
                   <button 
                     onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                     className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                     title={isRtl ? 'حذف لوگو' : 'Remove Logo'}
                   >
                     <X size={14}/>
                   </button>
                 </div>
               ) : (
                 <div className="text-center">
                   <div className="w-16 h-16 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                     <Upload size={28}/>
                   </div>
                   <label className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:text-indigo-700 transition-colors">
                     <span>{isRtl ? 'بارگذاری لوگوی سازمان' : 'Upload Organization Logo'}</span>
                     <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} />
                   </label>
                   <p className="text-xs text-slate-400 mt-2 font-mono">PNG, JPG (Max: 2MB)</p>
                 </div>
               )}
            </div>

            <TextField 
              label={isRtl ? 'کد سازمان *' : 'Organization Code *'} 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})} 
              isRtl={isRtl} 
              className="dir-ltr text-left"
            />
            <TextField 
              label={isRtl ? 'نام سازمان *' : 'Organization Name *'} 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              isRtl={isRtl} 
            />
            <TextField 
              label={isRtl ? 'شماره ثبت' : 'Registration No'} 
              value={formData.regNo} 
              onChange={e => setFormData({...formData, regNo: e.target.value})} 
              isRtl={isRtl} 
              className="dir-ltr text-left"
            />
            
            <div className="flex items-center mt-6">
              <ToggleField 
                label={isRtl ? 'وضعیت سازمان (فعال / غیرفعال)' : 'Organization Status (Active / Inactive)'}
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                isRtl={isRtl}
              />
            </div>

            <TextField 
              label={isRtl ? 'شماره تلفن' : 'Phone Number'} 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              isRtl={isRtl} 
              className="dir-ltr text-left"
            />
            <TextField 
              label={isRtl ? 'فکس' : 'Fax'} 
              value={formData.fax} 
              onChange={e => setFormData({...formData, fax: e.target.value})} 
              isRtl={isRtl} 
              className="dir-ltr text-left"
            />

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mt-2">
               <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                 <MapPin size={18} className="text-indigo-500" />
                 <label className="text-sm font-bold">
                   {isRtl ? 'مدیریت آدرس‌ها' : 'Manage Addresses'}
                 </label>
               </div>
               
               <div className="flex gap-3 mb-4">
                 <div className="flex-1">
                   <TextField 
                     placeholder={isRtl ? 'آدرس جدید را اینجا تایپ کنید...' : 'Type new address here...'} 
                     value={newAddress} 
                     onChange={e => setNewAddress(e.target.value)} 
                     isRtl={isRtl}
                   />
                 </div>
                 <div className="self-end pb-1">
                   <Button variant="secondary" icon={Plus} onClick={handleAddAddress}>
                     {isRtl ? 'افزودن آدرس' : 'Add Address'}
                   </Button>
                 </div>
               </div>

               <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                 {formData.addresses?.map((addr) => (
                   <div key={addr.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-relaxed">
                        {addr.text}
                      </span>
                      <button 
                        onClick={() => handleRemoveAddress(addr.id)} 
                        className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors ms-3"
                        title={isRtl ? 'حذف آدرس' : 'Remove Address'}
                      >
                        <Trash2 size={16}/>
                      </button>
                   </div>
                 ))}
                 {(!formData.addresses || formData.addresses.length === 0) && (
                   <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                     <p className="text-sm text-slate-400">
                       {isRtl ? 'هنوز هیچ آدرسی ثبت نشده است.' : 'No addresses registered yet.'}
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  window.OrganizationInfo = OrganizationInfo;
})();