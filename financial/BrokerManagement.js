/* Filename: financial/BrokerManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useRef } = React;
  
  const { 
    Button, PageHeader, Modal, AdvancedFilter, DataGrid, 
    TextField, SelectField, ToggleField, CheckboxField, DatePicker
  } = window.DesignSystem || window.DSCore || window.DSForms || window.DSGrid || {};
  
  const { 
    Edit, Trash2, Save, 
    AlertTriangle, Lock, Plus, Briefcase, Percent, History
  } = window.LucideIcons || {};
  
  const supabase = window.supabase;

  // --- کامپوننت محلی برای انتخاب حساب ---
  const SearchableAccountSelect = ({ accounts, value, onChange, disabled, placeholder, isRtl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);
    
    const selectedAcc = accounts.find(a => String(a.id) === String(value));
    const displaySelected = selectedAcc ? `${selectedAcc.code} - ${isRtl ? selectedAcc.titleFa : selectedAcc.titleEn}` : '';

    useEffect(() => {
      const handleClickOutside = (event) => { 
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); 
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = accounts.filter(a => {
        const searchLower = search.toLowerCase();
        const codeStr = a.code || '';
        const titleStr = (isRtl ? a.titleFa : a.titleEn) || '';
        const pathStr = (isRtl ? a.pathFa : a.pathEn) || '';
        return codeStr.includes(searchLower) || titleStr.includes(searchLower) || pathStr.includes(searchLower);
    });

    return (
      <div className="relative w-full flex flex-col gap-1.5" ref={wrapperRef}>
        <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
          {isRtl ? 'حساب مرتبط (آخرین سطح)' : 'Linked Account'}
        </label>
        <div className="relative w-full">
          <input 
            type="text" 
            className={`w-full h-8 px-2.5 bg-white dark:bg-slate-700/40 border border-slate-300 dark:border-slate-500 rounded-lg text-[12px] text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-400/20 focus:border-indigo-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 cursor-pointer`}
            value={isOpen ? search : displaySelected} 
            onChange={e => { setSearch(e.target.value); setIsOpen(true); }} 
            onFocus={() => { setIsOpen(true); setSearch(''); }} 
            disabled={disabled} 
            placeholder={placeholder} 
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          {isOpen && !disabled && (
            <div className={`absolute z-[9999] w-[350px] mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar ${isRtl ? 'right-0' : 'left-0'}`}>
              {filtered.length > 0 ? filtered.map(acc => (
                <div key={acc.id} className="px-3 py-2 text-[12px] hover:bg-indigo-50 dark:hover:bg-indigo-500/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0" onMouseDown={(e) => { e.preventDefault(); onChange(acc.id); setIsOpen(false); }}>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-right dir-ltr">{acc.code} - {isRtl ? acc.titleFa : acc.titleEn}</div>
                  <div className="text-slate-500 dark:text-slate-400 truncate mt-0.5 text-[10px] text-right" title={isRtl ? acc.pathFa : acc.pathEn}>{isRtl ? acc.pathFa : acc.pathEn}</div>
                </div>
              )) : (
                <div className="p-3 text-center text-slate-500 text-[12px]">{isRtl ? 'موردی یافت نشد' : 'No results'}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  // -------------------------------------------------------------

  const BrokerManagement = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    
    const [data, setData] = useState([]);
    const [allParties, setAllParties] = useState([]);
    const [partiesDropdown, setPartiesDropdown] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });
    const [logModal, setLogModal] = useState({ isOpen: false, recordId: null, tableName: '' });
    
    const [formData, setFormData] = useState({
      partyId: '',
      accountId: '',
      validFrom: '',
      validTo: '',
      isActive: true
    });

    const [isQuickPartyModalOpen, setIsQuickPartyModalOpen] = useState(false);
    const [isSavingParty, setIsSavingParty] = useState(false);
    const [quickPartyData, setQuickPartyData] = useState({
      partyType: 'real',
      companyName: '',
      code: '',
      firstName: '',
      lastName: '',
      nationalId: '',
      mobile: '',
      email: '',
      roles: ['broker']
    });

    const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState(null);

    const EXTERNAL_PARTY_ROLES = [
      { id: 'customer', label: t('مشتری', 'Customer') },
      { id: 'supplier', label: t('تامین‌کننده', 'Supplier') },
      { id: 'shareholder', label: t('سهامدار', 'Shareholder') },
      { id: 'broker', label: t('بروکر', 'Broker') }
    ];

    const [gridState, setGridState] = useState(null);

    const viewConfig = {
      pageId: 'brokers_main',
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
      fetchDropdownData();
      fetchData();
    }, []);

    const fetchDropdownData = async () => {
        try {
          const { data: coaData } = await supabase
            .from('fm_coa_accounts')
            .select('id, parent_id, title_fa, title_en, code');
          if (coaData) {
            const parentIds = new Set(coaData.map(c => c.parent_id).filter(Boolean));
            const leaves = coaData.filter(c => !parentIds.has(c.id));
            
            const buildPath = (node) => {
              let pathFa = node.title_fa || '';
              let pathEn = node.title_en || node.title_fa || '';
              let current = node;
              while(current.parent_id) {
                const parent = coaData.find(c => c.id === current.parent_id);
                if(parent) {
                  pathFa = (parent.title_fa || '') + ' > ' + pathFa;
                  pathEn = (parent.title_en || parent.title_fa || '') + ' > ' + pathEn;
                  current = parent;
                } else { break; }
              }
              return { pathFa, pathEn };
            };
  
            const accOptions = leaves.map(leaf => {
              const paths = buildPath(leaf);
              return {
                id: leaf.id,
                code: leaf.code,
                titleFa: leaf.title_fa,
                titleEn: leaf.title_en,
                pathFa: paths.pathFa,
                pathEn: paths.pathEn
              };
            });
            setAccounts(accOptions);
          }
        } catch (err) {
          console.error('Fetch Accounts Error:', err);
        }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: pData, error: pError },
          { data: brokersData, error: bError }
        ] = await Promise.all([
          supabase.from('parties').select('id, first_name, last_name, company_name, party_type, code, roles, mobile, email'),
          supabase.from('fm_brokers').select('*, account:fm_coa_accounts(id, title_fa, title_en, code)').order('created_at', { ascending: false })
        ]);
          
        if (pData && !pError) {
          setAllParties(pData);
          setPartiesDropdown(pData.map(p => ({
            id: p.id,
            label: `${p.party_type === 'legal' ? (p.company_name || '') : ((p.first_name || '') + ' ' + (p.last_name || '')).trim()} (${p.code})`,
            mobile: p.mobile,
            email: p.email
          })));
        }

        if (bError) throw bError;
        
        const mappedData = (brokersData || []).map(item => ({
            ...item,
            accountName: item.account ? `[${item.account.code}] ${isRtl ? item.account.title_fa : item.account.title_en}` : '---'
        }));

        setData(mappedData);

      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSaveBroker = async () => {
      if (!formData.partyId) {
        alert(t('انتخاب شخص/شرکت الزامی است.', 'Party selection is required.'));
        return;
      }

      setIsLoading(true);
      try {
        const payload = {
          party_id: formData.partyId,
          account_id: formData.accountId || null,
          valid_from: formData.validFrom || null,
          valid_to: formData.validTo || null,
          is_active: formData.isActive,
          updated_at: new Date().toISOString()
        };

        const { error } = currentRecord?.id 
          ? await supabase.from('fm_brokers').update(payload).eq('id', currentRecord.id)
          : await supabase.from('fm_brokers').insert([payload]);

        if (error) {
          if (error.code === '23505') {
            alert(t('این بروکر قبلاً ثبت شده است.', 'This broker is already registered.'));
          } else {
            throw error;
          }
          return;
        }
        
        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Save Broker Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSaveQuickParty = async () => {
      const isLegal = quickPartyData.partyType === 'legal';
      if (!quickPartyData.code || (isLegal && !quickPartyData.companyName) || (!isLegal && (!quickPartyData.firstName || !quickPartyData.lastName))) {
         alert(t('لطفاً فیلدهای ستاره‌دار را تکمیل کنید.', 'Please fill required fields.'));
         return;
      }
      
      setIsSavingParty(true);
      try {
        const payload = {
          party_type: quickPartyData.partyType,
          code: quickPartyData.code,
          first_name: isLegal ? null : quickPartyData.firstName,
          last_name: isLegal ? null : quickPartyData.lastName,
          company_name: isLegal ? quickPartyData.companyName : null,
          national_id: quickPartyData.nationalId,
          mobile: quickPartyData.mobile,
          email: quickPartyData.email,
          roles: Array.from(new Set([...quickPartyData.roles, 'broker'])), 
          is_active: true,
          created_at: new Date().toISOString()
        };

        const { data: newPartyData, error } = await supabase.from('parties').insert([payload]).select().single();
        
        if (error) {
           if (error.code === '23505') {
             alert(t('کد شخص یا شناسه ملی تکراری است.', 'Duplicate party code or national ID.'));
           } else {
             throw error;
           }
           return;
        }

        const partyLabel = isLegal 
            ? `${newPartyData.company_name} (${newPartyData.code})`
            : `${newPartyData.first_name} ${newPartyData.last_name} (${newPartyData.code})`;

        const newDropdownItem = {
          id: newPartyData.id,
          label: partyLabel,
          mobile: newPartyData.mobile,
          email: newPartyData.email
        };

        setAllParties(prev => [...prev, newPartyData]);
        setPartiesDropdown(prev => [...prev, newDropdownItem]);

        setFormData(prev => ({
          ...prev,
          partyId: newPartyData.id
        }));

        setIsQuickPartyModalOpen(false);
        setQuickPartyData({ partyType: 'real', companyName: '', code: '', firstName: '', lastName: '', nationalId: '', mobile: '', email: '', roles: ['broker'] });
      } catch (err) {
        console.error('Save Quick Party Error:', err);
        alert(t('خطا در ذخیره اطلاعات شخص.', 'Error saving party.'));
      } finally {
        setIsSavingParty(false);
      }
    };

    const handleToggleActive = async (row, newValue) => {
      try {
        const { error } = await supabase
          .from('fm_brokers')
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
          const { error } = await supabase.from('fm_brokers').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from('fm_brokers').delete().in('id', deleteConfirm.data);
          if (error) throw error;
        }
        
        setSelectedIds([]);
        fetchData();
        setDeleteConfirm({ isOpen: false, type: null, data: null });
      } catch (err) {
        console.error("Delete error:", err);
        alert(t('خطا در حذف اطلاعات. ممکن است رکوردهای وابسته وجود داشته باشد.', 'Deletion error. There might be dependent records.'));
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenModal = (record = null) => {
      setFormData(record ? {
        partyId: record.party_id || '',
        accountId: record.account_id || '',
        validFrom: record.valid_from ? record.valid_from.substring(0, 10) : '',
        validTo: record.valid_to ? record.valid_to.substring(0, 10) : '',
        isActive: record.is_active ?? true
      } : { 
        partyId: '',
        accountId: '',
        validFrom: '',
        validTo: '',
        isActive: true
      });
      setCurrentRecord(record);
      setIsModalOpen(true);
    };

    const getPartyName = (partyId) => {
      if (!partyId) return '-';
      const p = allParties.find(x => x.id === partyId);
      if (!p) return '-';
      return p.party_type === 'legal' ? p.company_name : `${p.first_name || ''} ${p.last_name || ''}`.trim();
    };

    const columns = [
      { 
        field: 'party_id', 
        header_fa: 'نام بروکر (شخص/شرکت)', 
        header_en: 'Broker Name', 
        width: '250px',
        render: (val) => <span className="font-bold text-slate-700 dark:text-slate-200">{getPartyName(val)}</span>
      },
      {
        field: 'accountName',
        header_fa: 'حساب مرتبط',
        header_en: 'Linked Account',
        width: '220px'
      },
      { 
        field: 'valid_from', 
        header_fa: 'تاریخ اعتبار از', 
        header_en: 'Valid From', 
        width: '140px',
        type: 'date'
      },
      { 
        field: 'valid_to', 
        header_fa: 'تاریخ اعتبار تا', 
        header_en: 'Valid To', 
        width: '140px',
        type: 'date'
      },
      { 
        field: 'is_active', 
        header_fa: 'وضعیت', 
        header_en: 'Status', 
        width: '100px', 
        type: 'toggle',
        onToggle: (row, val) => handleToggleActive(row, val)
      }
    ];

    const filteredData = useMemo(() => {
      let result = [...data];
      
      if (filters.party && filters.party.id) {
         result = result.filter(u => u.party_id === filters.party.id);
      }
      if (filters.isActive) {
         const wantActive = filters.isActive === 'active';
         result = result.filter(u => u.is_active === wantActive);
      }
      
      return result;
    }, [data, filters]);

    const filterFields = [
      { 
        name: 'party', 
        label: t('بروکر', 'Broker'), 
        type: 'lov', 
        lovData: partiesDropdown, 
        lovColumns: [
          { field: 'label', header_fa: 'نام و کد', header_en: 'Name & Code', width: '250px' }
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
          title={t('مدیریت بروکرها', 'Broker Management')} 
          icon={Briefcase}
          description={t('تعریف بروکرها، حساب‌های مرتبط و سوابق قرارداد', 'Manage brokers, linked accounts, and contract histories')}
          language={language}
          breadcrumbs={[{ label: t('مالی', 'Financial') }, { label: t('بروکرها', 'Brokers') }]}
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
              onToggle={(row, field, val) => {
                 if (field === 'is_active') handleToggleActive(row, val);
              }}
              actions={[
                { icon: Edit, tooltip: t('ویرایش مشخصات', 'Edit Details'), onClick: (row) => handleOpenModal(row), className: 'text-slate-400 hover:text-indigo-600' },
                { icon: Percent, tooltip: t('قراردادها و کارمزدها', 'Contracts & Commissions'), onClick: (row) => { setSelectedBroker(row); setIsContractsModalOpen(true); }, className: 'text-slate-400 hover:text-emerald-600' },
                { icon: History, tooltip: t('تاریخچه سیستم', 'System Log'), onClick: (row) => setLogModal({ isOpen: true, recordId: row.id, tableName: 'fm_brokers' }), className: 'text-slate-400 hover:text-blue-600' },
                { icon: Trash2, tooltip: t('حذف بروکر', 'Delete Broker'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row }), className: 'text-slate-400 hover:text-red-600' }
              ]}
              bulkActions={[
                { label: t('حذف گروهی', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: (ids) => setDeleteConfirm({ isOpen: true, type: 'bulk', data: ids }) }
              ]}
            />
          </div>
        </div>

        <Modal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          title={currentRecord ? t('ویرایش بروکر', 'Edit Broker') : t('تعریف بروکر جدید', 'New Broker')}
          width="max-w-2xl"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-end gap-2">
                <div className="flex-1">
                  <SelectField 
                    size="sm" 
                    label={t('انتخاب شخص / شرکت (بروکر)', 'Select Party (Broker)')} 
                    value={formData.partyId} 
                    onChange={e => setFormData({...formData, partyId: e.target.value})} 
                    isRtl={isRtl}
                    required
                    options={[
                      { value: '', label: `-- ${t('انتخاب کنید', 'Select')} --` },
                      ...partiesDropdown.map(p => ({ value: p.id, label: p.label }))
                    ]}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Plus} 
                  onClick={() => setIsQuickPartyModalOpen(true)} 
                  className="h-8 w-8 px-0 shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/40 mb-[1px]" 
                  title={t('تعریف شخص جدید', 'Add New Party')}
                />
              </div>

              <div className="md:col-span-2">
                <SearchableAccountSelect 
                  accounts={accounts}
                  value={formData.accountId} 
                  onChange={val => setFormData({...formData, accountId: val})} 
                  isRtl={isRtl} 
                  placeholder={t('جستجوی حساب...', 'Search Account...')}
                />
              </div>

              <DatePicker 
                size="sm" 
                label={t('تاریخ اعتبار از', 'Valid From')} 
                value={formData.validFrom} 
                onChange={val => setFormData({...formData, validFrom: val?.target ? val.target.value : val})} 
                isRtl={isRtl} 
                dir="ltr" 
              />
              
              <DatePicker 
                size="sm" 
                label={t('تاریخ اعتبار تا', 'Valid To')} 
                value={formData.validTo} 
                onChange={val => setFormData({...formData, validTo: val?.target ? val.target.value : val})} 
                isRtl={isRtl} 
                dir="ltr" 
              />

              <div className="md:col-span-2 flex items-center mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                 <ToggleField size="sm" label={t('بروکر فعال است', 'Is Active')} checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} isRtl={isRtl} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveBroker} isLoading={isLoading}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isQuickPartyModalOpen}
          onClose={() => setIsQuickPartyModalOpen(false)}
          title={t('تعریف سریع شخص / شرکت', 'Quick Add Party')}
          width="max-w-3xl"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="mb-2">
               <SelectField 
                  size="sm" 
                  label={t('نوع شخص', 'Party Type')} 
                  value={quickPartyData.partyType} 
                  onChange={e => setQuickPartyData({...quickPartyData, partyType: e.target.value, companyName: '', firstName: '', lastName: '', roles: ['broker']})} 
                  isRtl={isRtl}
                  options={[
                    { value: 'real', label: t('حقیقی (فرد)', 'Real Person') },
                    { value: 'legal', label: t('حقوقی (شرکت)', 'Legal Entity') }
                  ]}
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TextField size="sm" label={t('کد شخص/شرکت', 'Party Code')} value={quickPartyData.code} onChange={e => setQuickPartyData({...quickPartyData, code: e.target.value})} isRtl={isRtl} required dir="ltr" />
              
              {quickPartyData.partyType === 'real' ? (
                  <>
                    <TextField size="sm" label={t('نام', 'First Name')} value={quickPartyData.firstName} onChange={e => setQuickPartyData({...quickPartyData, firstName: e.target.value})} isRtl={isRtl} required />
                    <TextField size="sm" label={t('نام خانوادگی', 'Last Name')} value={quickPartyData.lastName} onChange={e => setQuickPartyData({...quickPartyData, lastName: e.target.value})} isRtl={isRtl} required />
                  </>
              ) : (
                  <div className="md:col-span-2">
                    <TextField size="sm" label={t('نام شرکت', 'Company Name')} value={quickPartyData.companyName} onChange={e => setQuickPartyData({...quickPartyData, companyName: e.target.value})} isRtl={isRtl} required />
                  </div>
              )}

              <TextField size="sm" label={quickPartyData.partyType === 'real' ? t('کد ملی', 'National ID') : t('شناسه ملی / ثبت', 'Registration ID')} value={quickPartyData.nationalId} onChange={e => setQuickPartyData({...quickPartyData, nationalId: e.target.value})} isRtl={isRtl} dir="ltr" />
              <TextField size="sm" label={t('موبایل / تلفن', 'Mobile / Phone')} value={quickPartyData.mobile} onChange={e => setQuickPartyData({...quickPartyData, mobile: e.target.value})} isRtl={isRtl} dir="ltr" />
              <TextField size="sm" label={t('ایمیل', 'Email')} value={quickPartyData.email} onChange={e => setQuickPartyData({...quickPartyData, email: e.target.value})} isRtl={isRtl} dir="ltr" />
            </div>
            
            <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
               <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-3 block">{t('نقش‌های مرتبط', 'Associated Roles')}</label>
               <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                 {EXTERNAL_PARTY_ROLES.map(role => (
                   <CheckboxField 
                     key={role.id} 
                     size="sm" 
                     label={role.label} 
                     checked={quickPartyData.roles.includes(role.id)} 
                     disabled={role.id === 'broker'} 
                     onChange={(checked) => {
                       if (role.id === 'broker') return;
                       setQuickPartyData(prev => ({
                         ...prev,
                         roles: checked ? [...prev.roles, role.id] : prev.roles.filter(r => r !== role.id)
                       }));
                     }} 
                     isRtl={isRtl} 
                   />
                 ))}
               </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button variant="outline" size="sm" onClick={() => setIsQuickPartyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveQuickParty} isLoading={isSavingParty}>{t('ذخیره و انتخاب', 'Save & Select')}</Button>
            </div>
          </div>
        </Modal>

        <Modal
            isOpen={isContractsModalOpen}
            onClose={() => setIsContractsModalOpen(false)}
            title={t('قراردادها و کارمزدهای بروکر', 'Broker Contracts & Commissions')}
            width="max-w-5xl"
            language={language}
        >
            {selectedBroker && window.BrokerContract ? (
                <window.BrokerContract 
                    broker={selectedBroker} 
                    brokerName={getPartyName(selectedBroker.party_id)} 
                    language={language} 
                />
            ) : (
                <div className="p-8 text-center text-slate-500 font-bold">
                    {t('در حال بارگذاری فرم قراردادها...', 'Loading contracts form...')}
                </div>
            )}
        </Modal>

        <Modal 
          isOpen={logModal.isOpen} 
          onClose={() => setLogModal({ isOpen: false, recordId: null, tableName: '' })} 
          title={t('تاریخچه تغییرات', 'Change History')} 
          width="max-w-4xl" 
          language={language}
        >
          <div className="h-[500px] flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50">
             {window.SystemLog && logModal.recordId ? (
                <window.SystemLog tableName={logModal.tableName} recordId={logModal.recordId} language={language} />
             ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-bold">
                   {t('ماژول لاگ سیستم در دسترس نیست.', 'System Log module is not available.')}
                </div>
             )}
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
                : t(`آیا از حذف این رکورد اطمینان دارید؟`, `Are you sure you want to delete this record?`)
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

  window.BrokerManagement = BrokerManagement;
})();