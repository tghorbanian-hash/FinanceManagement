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
            .from('organization_info')
            .update(payload)
            .eq('id', currentRecord.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('organization_info')
            .insert([payload]);

          if (error) throw error;
        }

        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Error saving data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async (ids) => {
      if (!ids || ids.length === 0) return;
      if (!window.confirm(isRtl ? 'آیا از حذف موارد انتخاب شده اطمینان دارید؟' : 'Are you sure?')) return;

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('organization_info')
          .delete()
          .in('id', ids);

        if (error) throw error;
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        console.error('Error deleting data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenModal = (record = null) => {
      if (record) {
        setFormData({ ...record });
      } else {
        setFormData({ 
          code: '', name: '', regNo: '', phone: '', fax: '', 
          logo: null, addresses: [], isActive: true 
        });
      }
      setCurrentRecord(record);
      setNewAddress('');
      setIsModalOpen(true);
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
          <Badge variant={row.isActive ? "success" : "danger"} size="sm">
            {row.isActive ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}
          </Badge>
        ) 
      }
    ];

    const filteredData = data.filter(item => {
      return (filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true) &&
             (filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true);
    });

    return (
      <div className="flex flex-col h-full p-4 bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={isRtl ? 'اطلاعات سازمان' : 'Organization Info'}
          description={isRtl ? 'پیکربندی اطلاعات پایه شرکت' : 'Configure base company details'}
          icon={Building2}
        />

        <div className="mt-4">
          <AdvancedFilter isRtl={isRtl} onClear={() => setFilters({ code: '', name: '' })}>
            <div className="flex flex-wrap gap-3">
              <div className="w-48">
                <TextField 
                  label={isRtl ? 'کد سازمان' : 'Code'} 
                  value={filters.code}
                  variant="compact"
                  onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                  isRtl={isRtl}
                />
              </div>
              <div className="w-64">
                <TextField 
                  label={isRtl ? 'نام سازمان' : 'Name'} 
                  value={filters.name}
                  variant="compact"
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                  isRtl={isRtl}
                />
              </div>
            </div>
          </AdvancedFilter>
        </div>

        <div className="flex-1 mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
          <DataGrid 
            columns={columns} 
            data={filteredData} 
            selectedIds={selectedIds}
            onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
            onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
            onCreate={() => handleOpenModal()}
            onDelete={handleDelete}
            isRtl={isRtl}
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} />
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500" onClick={() => handleDelete([row.id])} />
              </div>
            )}
          />
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={currentRecord ? (isRtl ? 'ویرایش سازمان' : 'Edit Org') : (isRtl ? 'تعریف سازمان جدید' : 'New Org')}
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>{isRtl ? 'انصراف' : 'Cancel'}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={isLoading}>{isRtl ? 'ذخیره' : 'Save'}</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col items-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
               {formData.logo ? (
                 <div className="relative group">
                   <img src={formData.logo} className="h-20 object-contain" />
                   <button onClick={() => setFormData({...formData, logo: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                 </div>
               ) : (
                 <label className="cursor-pointer flex flex-col items-center gap-1">
                   <Upload size={20} className="text-slate-400"/>
                   <span className="text-[11px] font-bold text-indigo-600">{isRtl ? 'بارگذاری لوگو' : 'Upload Logo'}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const reader = new FileReader();
                     reader.onload = () => setFormData({...formData, logo: reader.result});
                     if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                   }} />
                 </label>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TextField label={isRtl ? 'کد' : 'Code'} value={formData.code} variant="compact" onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'نام' : 'Name'} value={formData.name} variant="compact" onChange={e => setFormData({...formData, name: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'شماره ثبت' : 'Reg No'} value={formData.regNo} variant="compact" onChange={e => setFormData({...formData, regNo: e.target.value})} isRtl={isRtl} />
              <ToggleField label={isRtl ? 'وضعیت فعال' : 'Active'} checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} isRtl={isRtl} />
              <TextField label={isRtl ? 'تلفن' : 'Phone'} value={formData.phone} variant="compact" onChange={e => setFormData({...formData, phone: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'فکس' : 'Fax'} value={formData.fax} variant="compact" onChange={e => setFormData({...formData, fax: e.target.value})} isRtl={isRtl} />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
               <label className="text-[11px] font-bold text-slate-500 mb-2 block flex items-center gap-1"><MapPin size={12}/> {isRtl ? 'آدرس‌ها' : 'Addresses'}</label>
               <div className="flex gap-2 mb-2">
                 <TextField placeholder={isRtl ? 'آدرس جدید...' : 'New...'} value={newAddress} variant="compact" onChange={e => setNewAddress(e.target.value)} isRtl={isRtl} />
                 <Button variant="secondary" size="sm" icon={Plus} onClick={() => {
                   if(!newAddress.trim()) return;
                   setFormData({...formData, addresses: [...formData.addresses, { id: Date.now(), text: newAddress.trim() }]});
                   setNewAddress('');
                 }} />
               </div>
               <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                 {formData.addresses.map(a => (
                   <div key={a.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-1.5 px-2 rounded border border-slate-100 dark:border-slate-700 text-[11px]">
                     <span>{a.text}</span>
                     <button onClick={() => setFormData({...formData, addresses: formData.addresses.filter(x => x.id !== a.id)})} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  window.OrganizationInfo = OrganizationInfo;
})();