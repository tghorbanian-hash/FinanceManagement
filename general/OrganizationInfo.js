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

    const handleDelete = async (ids) => {
      if (!ids?.length || !window.confirm(isRtl ? 'حذف شوند؟' : 'Delete?')) return;
      setIsLoading(true);
      try {
        const { error } = await supabase.from('organization_info').delete().in('id', ids);
        if (error) throw error;
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        console.error('Delete Error:', err);
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
      { field: 'code', header: isRtl ? 'کد' : 'Code', width: 'w-24' },
      { field: 'name', header: isRtl ? 'نام سازمان' : 'Name', width: 'w-64' },
      { field: 'regNo', header: isRtl ? 'شماره ثبت' : 'Reg No', width: 'w-32' },
      { field: 'phone', header: isRtl ? 'تلفن' : 'Phone', width: 'w-32' },
      { 
        field: 'isActive', header: isRtl ? 'وضعیت' : 'Status', width: 'w-20',
        render: (row) => (
          <Badge variant={row.isActive ? "success" : "danger"} size="sm">
            {row.isActive ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}
          </Badge>
        ) 
      }
    ];

    return (
      <div className="flex flex-col h-full p-3 bg-[#f8fafc] dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={isRtl ? 'اطلاعات سازمان' : 'Organization Info'} 
          icon={Building2}
          description={isRtl ? 'تنظیمات پایه و لوگوی شرکت' : 'Base settings'}
        />

        <div className="mt-2">
          <AdvancedFilter isRtl={isRtl} onClear={() => setFilters({ code: '', name: '' })}>
            <div className="flex gap-2">
              <div className="w-32">
                <TextField 
                  label={isRtl ? 'کد' : 'Code'} value={filters.code} variant="compact"
                  onChange={e => setFilters({...filters, code: e.target.value})} isRtl={isRtl}
                />
              </div>
              <div className="w-48">
                <TextField 
                  label={isRtl ? 'نام سازمان' : 'Name'} value={filters.name} variant="compact"
                  onChange={e => setFilters({...filters, name: e.target.value})} isRtl={isRtl}
                />
              </div>
            </div>
          </AdvancedFilter>
        </div>

        <div className="flex-1 mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
          <DataGrid 
            columns={columns} 
            data={data.filter(item => 
              (filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true) &&
              (filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true)
            )} 
            selectedIds={selectedIds}
            onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
            onSelectAll={(checked) => setSelectedIds(checked ? data.map(d => d.id) : [])}
            onCreate={() => handleOpenModal()}
            onDelete={handleDelete}
            isRtl={isRtl}
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} />
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500" onClick={() => handleDelete([row.id])} />
              </div>
            )}
          />
        </div>

        <Modal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          title={currentRecord ? (isRtl ? 'ویرایش' : 'Edit') : (isRtl ? 'جدید' : 'New')}
          size="sm"
          footer={
            <div className="flex justify-end gap-1.5 w-full">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>{isRtl ? 'انصراف' : 'Cancel'}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={isLoading}>{isRtl ? 'ذخیره' : 'Save'}</Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-col items-center p-2 border border-dashed border-slate-200 dark:border-slate-700 rounded bg-slate-50/30">
               {formData.logo ? (
                 <div className="relative group">
                   <img src={formData.logo} className="h-14 object-contain" />
                   <button onClick={() => setFormData({...formData, logo: null})} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                 </div>
               ) : (
                 <label className="cursor-pointer flex items-center gap-2 text-indigo-600">
                   <Upload size={14}/>
                   <span className="text-[10px] font-bold">{isRtl ? 'لوگو' : 'Logo'}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const reader = new FileReader();
                     reader.onload = () => setFormData({...formData, logo: reader.result});
                     if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                   }} />
                 </label>
               )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField label={isRtl ? 'کد' : 'Code'} value={formData.code} variant="compact" onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'نام' : 'Name'} value={formData.name} variant="compact" onChange={e => setFormData({...formData, name: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'ثبت' : 'Reg'} value={formData.regNo} variant="compact" onChange={e => setFormData({...formData, regNo: e.target.value})} isRtl={isRtl} />
              <ToggleField label={isRtl ? 'فعال' : 'Active'} checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} isRtl={isRtl} />
              <TextField label={isRtl ? 'تلفن' : 'Tel'} value={formData.phone} variant="compact" onChange={e => setFormData({...formData, phone: e.target.value})} isRtl={isRtl} />
              <TextField label={isRtl ? 'فکس' : 'Fax'} value={formData.fax} variant="compact" onChange={e => setFormData({...formData, fax: e.target.value})} isRtl={isRtl} />
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
               <label className="text-[10px] font-bold text-slate-500 mb-1.5 block flex items-center gap-1"><MapPin size={10}/> {isRtl ? 'آدرس' : 'Addr'}</label>
               <div className="flex gap-1.5 mb-1.5">
                 <TextField placeholder={isRtl ? 'آدرس...' : 'Addr...'} value={newAddress} variant="compact" onChange={e => setNewAddress(e.target.value)} isRtl={isRtl} />
                 <Button variant="secondary" size="sm" icon={Plus} onClick={() => {
                   if(!newAddress.trim()) return;
                   setFormData({...formData, addresses: [...formData.addresses, { id: Date.now(), text: newAddress.trim() }]});
                   setNewAddress('');
                 }} />
               </div>
               <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                 {formData.addresses.map(a => (
                   <div key={a.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-1 px-1.5 rounded border border-slate-100 dark:border-slate-700 text-[10px]">
                     <span className="truncate">{a.text}</span>
                     <button onClick={() => setFormData({...formData, addresses: formData.addresses.filter(x => x.id !== a.id)})} className="text-slate-300 hover:text-red-500 ms-2"><Trash2 size={10}/></button>
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