/* Filename: financial/BrokerManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  
  const { 
    Button, PageHeader, Modal, AdvancedFilter, DataGrid, 
    TextField, SelectField, ToggleField, Badge, CheckboxField, CurrencyField
  } = window.DesignSystem || {};
  
  const { 
    Users, Edit, Trash2, Save, 
    AlertTriangle, Lock, Plus, Briefcase, Percent, FileText
  } = window.LucideIcons || {};
  
  const supabase = window.supabase;

  const BrokerManagement = ({ language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    
    const [data, setData] = useState([]);
    const [allParties, setAllParties] = useState([]);
    const [partiesDropdown, setPartiesDropdown] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [contractsData, setContractsData] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null, table: null });
    
    const [formData, setFormData] = useState({
      partyId: '',
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
    const [contractFormData, setContractFormData] = useState({
      id: null,
      currencyId: '',
      fromDate: '',
      toDate: '',
      minAmount: 0,
      maxAmount: 0,
      commissionPct: 0
    });

    const PARTY_ROLES = [
      { id: 'system_user', label: t('کاربر سیستم', 'System User') },
      { id: 'employee', label: t('پرسنل / کارمند', 'Employee') },
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
      fetchData();
    }, []);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: pData, error: pError },
          { data: brokersData, error: bError },
          { data: curData, error: curError }
        ] = await Promise.all([
          supabase.from('parties').select('id, first_name, last_name, company_name, party_type, code, roles, mobile, email'),
          supabase.from('fm_brokers').select('*').order('created_at', { ascending: false }),
          supabase.from('fm_currencies').select('id, code, title_fa, title_en').eq('is_active', true)
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

        if (curData && !curError) {
            setCurrencies(curData);
        }

        if (bError) throw bError;
        setData(brokersData || []);

      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchContracts = async (brokerId) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('fm_broker_contracts')
                .select('*')
                .eq('broker_id', brokerId)
                .order('from_date', { ascending: false });
                
            if (error) throw error;
            setContractsData(data || []);
        } catch (err) {
            console.error('Fetch Contracts Error:', err);
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

    const handleSaveContract = async () => {
        if (!contractFormData.currencyId || !contractFormData.fromDate || contractFormData.commissionPct === null) {
            alert(t('فیلدهای ارز، تاریخ شروع و درصد کارمزد الزامی هستند.', 'Currency, From Date, and Commission fields are required.'));
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                broker_id: selectedBroker.id,
                currency_id: contractFormData.currencyId,
                from_date: contractFormData.fromDate,
                to_date: contractFormData.toDate || null,
                min_amount: contractFormData.minAmount || 0,
                max_amount: contractFormData.maxAmount || null,
                commission_pct: contractFormData.commissionPct,
                updated_at: new Date().toISOString()
            };

            const { error } = contractFormData.id
                ? await supabase.from('fm_broker_contracts').update(payload).eq('id', contractFormData.id)
                : await supabase.from('fm_broker_contracts').insert([payload]);

            if (error) throw error;

            setContractFormData({ id: null, currencyId: '', fromDate: '', toDate: '', minAmount: 0, maxAmount: 0, commissionPct: 0 });
            fetchContracts(selectedBroker.id);
        } catch (err) {
            console.error('Save Contract Error:', err);
            alert(t('خطا در ذخیره قرارداد.', 'Error saving contract.'));
        } finally {
            setIsLoading(false);
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
        const table = deleteConfirm.table || 'fm_brokers';
        
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from(table).delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from(table).delete().in('id', deleteConfirm.data);
          if (error) throw error;
        }
        
        if (table === 'fm_brokers') {
            setSelectedIds([]);
            fetchData();
        } else if (table === 'fm_broker_contracts') {
            fetchContracts(selectedBroker.id);
        }

        setDeleteConfirm({ isOpen: false, type: null, data: null, table: null });
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
        validFrom: record.valid_from ? record.valid_from.substring(0, 10) : '',
        validTo: record.valid_to ? record.valid_to.substring(0, 10) : '',
        isActive: record.is_active ?? true
      } : { 
        partyId: '',
        validFrom: '',
        validTo: '',
        isActive: true
      });
      setCurrentRecord(record);
      setIsModalOpen(true);
    };

    const handleOpenContractsModal = (broker) => {
        setSelectedBroker(broker);
        setContractFormData({ id: null, currencyId: '', fromDate: '', toDate: '', minAmount: 0, maxAmount: 0, commissionPct: 0 });
        setIsContractsModalOpen(true);
        fetchContracts(broker.id);
    };

    const getPartyName = (partyId) => {
      if (!partyId) return '-';
      const p = allParties.find(x => x.id === partyId);
      if (!p) return '-';
      return p.party_type === 'legal' ? p.company_name : `${p.first_name || ''} ${p.last_name || ''}`.trim();
    };

    const getCurrencyName = (currencyId) => {
        if (!currencyId) return '-';
        const c = currencies.find(x => x.id === currencyId);
        if (!c) return '-';
        return isRtl ? c.title_fa : c.title_en || c.title_fa;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US');
      } catch (e) {
        return dateString;
      }
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
        field: 'valid_from', 
        header_fa: 'تاریخ اعتبار از', 
        header_en: 'Valid From', 
        width: '140px',
        render: (val) => <span className="text-[12px] text-slate-600 dark:text-slate-400" dir="ltr">{formatDate(val)}</span>
      },
      { 
        field: 'valid_to', 
        header_fa: 'تاریخ اعتبار تا', 
        header_en: 'Valid To', 
        width: '140px',
        render: (val) => <span className="text-[12px] text-slate-600 dark:text-slate-400" dir="ltr">{formatDate(val)}</span>
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

    const contractColumns = [
        { 
            field: 'currency_id', 
            header_fa: 'ارز', 
            header_en: 'Currency', 
            width: '100px',
            render: (val) => <Badge variant="indigo" size="sm">{getCurrencyName(val)}</Badge>
        },
        { 
            field: 'from_date', 
            header_fa: 'از تاریخ', 
            header_en: 'From Date', 
            width: '120px',
            render: (val) => <span dir="ltr" className="text-[12px]">{formatDate(val)}</span>
        },
        { 
            field: 'to_date', 
            header_fa: 'تا تاریخ', 
            header_en: 'To Date', 
            width: '120px',
            render: (val) => <span dir="ltr" className="text-[12px]">{formatDate(val)}</span>
        },
        { 
            field: 'min_amount', 
            header_fa: 'از مبلغ', 
            header_en: 'Min Amount', 
            width: '120px',
            render: (val) => <span dir="ltr" className="font-medium text-slate-700 dark:text-slate-300">{Number(val).toLocaleString()}</span>
        },
        { 
            field: 'max_amount', 
            header_fa: 'تا مبلغ', 
            header_en: 'Max Amount', 
            width: '120px',
            render: (val) => <span dir="ltr" className="font-medium text-slate-700 dark:text-slate-300">{val ? Number(val).toLocaleString() : '∞'}</span>
        },
        { 
            field: 'commission_pct', 
            header_fa: 'درصد کارمزد', 
            header_en: 'Commission %', 
            width: '100px',
            render: (val) => <Badge variant="emerald" size="sm" className="font-bold">{val} %</Badge>
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
          description={t('تعریف بروکرها، سوابق قرارداد و درصدهای کارمزد تراکنش‌ها', 'Manage brokers, contract histories, and commission percentages')}
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
                { icon: Percent, tooltip: t('قراردادها و کارمزدها', 'Contracts & Commissions'), onClick: (row) => handleOpenContractsModal(row), className: 'text-slate-400 hover:text-emerald-600' },
                { icon: Trash2, tooltip: t('حذف بروکر', 'Delete Broker'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row, table: 'fm_brokers' }), className: 'text-slate-400 hover:text-red-600' }
              ]}
              bulkActions={[
                { label: t('حذف گروهی', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: (ids) => setDeleteConfirm({ isOpen: true, type: 'bulk', data: ids, table: 'fm_brokers' }) }
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

              <TextField 
                size="sm" 
                type="date"
                label={t('تاریخ اعتبار از', 'Valid From')} 
                value={formData.validFrom} 
                onChange={e => setFormData({...formData, validFrom: e.target.value})} 
                isRtl={isRtl} 
                dir="ltr" 
              />
              
              <TextField 
                size="sm" 
                type="date"
                label={t('تاریخ اعتبار تا', 'Valid To')} 
                value={formData.validTo} 
                onChange={e => setFormData({...formData, validTo: e.target.value})} 
                isRtl={isRtl} 
                dir="ltr" 
              />

              <div className="md:col-span-2 flex items-center mt-2">
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
                  onChange={e => setQuickPartyData({...quickPartyData, partyType: e.target.value, companyName: '', firstName: '', lastName: ''})} 
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
                 {PARTY_ROLES.map(role => (
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
            <div className="flex flex-col h-[600px]">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-300 font-bold">
                        <Briefcase size={18} />
                        <span>{selectedBroker ? getPartyName(selectedBroker.party_id) : ''}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <SelectField 
                            size="sm" 
                            label={t('ارز تراکنش', 'Currency')} 
                            value={contractFormData.currencyId} 
                            onChange={e => setContractFormData({...contractFormData, currencyId: e.target.value})} 
                            isRtl={isRtl}
                            required
                            options={[
                                { value: '', label: `-- ${t('انتخاب', 'Select')} --` },
                                ...currencies.map(c => ({ value: c.id, label: isRtl ? c.title_fa : (c.title_en || c.title_fa) }))
                            ]}
                        />
                        <TextField 
                            size="sm" 
                            type="date"
                            label={t('از تاریخ', 'From Date')} 
                            value={contractFormData.fromDate} 
                            onChange={e => setContractFormData({...contractFormData, fromDate: e.target.value})} 
                            isRtl={isRtl} 
                            required
                            dir="ltr" 
                        />
                        <TextField 
                            size="sm" 
                            type="date"
                            label={t('تا تاریخ (اختیاری)', 'To Date (Opt)')} 
                            value={contractFormData.toDate} 
                            onChange={e => setContractFormData({...contractFormData, toDate: e.target.value})} 
                            isRtl={isRtl} 
                            dir="ltr" 
                        />
                        <CurrencyField 
                            size="sm" 
                            label={t('از مبلغ تراکنش', 'Min Amount')} 
                            value={contractFormData.minAmount} 
                            onChange={val => setContractFormData({...contractFormData, minAmount: val})} 
                            isRtl={isRtl} 
                        />
                        <CurrencyField 
                            size="sm" 
                            label={t('تا مبلغ تراکنش (0=نامحدود)', 'Max Amount (0=Unlimit)')} 
                            value={contractFormData.maxAmount} 
                            onChange={val => setContractFormData({...contractFormData, maxAmount: val})} 
                            isRtl={isRtl} 
                        />
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <TextField 
                                    size="sm" 
                                    type="number"
                                    step="0.01"
                                    label={t('درصد کارمزد', 'Commission %')} 
                                    value={contractFormData.commissionPct} 
                                    onChange={e => setContractFormData({...contractFormData, commissionPct: e.target.value})} 
                                    isRtl={isRtl} 
                                    required
                                    dir="ltr" 
                                />
                            </div>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                icon={contractFormData.id ? Save : Plus} 
                                onClick={handleSaveContract} 
                                isLoading={isLoading}
                                className="h-8 mb-[1px]"
                                title={contractFormData.id ? t('بروزرسانی', 'Update') : t('افزودن', 'Add')}
                            >
                                {contractFormData.id ? t('ثبت', 'Save') : t('افزودن', 'Add')}
                            </Button>
                            {contractFormData.id && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setContractFormData({ id: null, currencyId: '', fromDate: '', toDate: '', minAmount: 0, maxAmount: 0, commissionPct: 0 })} 
                                    className="h-8 mb-[1px] px-2 text-slate-500"
                                    title={t('انصراف از ویرایش', 'Cancel Edit')}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 p-4">
                    <DataGrid 
                        data={contractsData}
                        columns={contractColumns} 
                        language={language}
                        isLoading={isLoading}
                        actions={[
                            { icon: Edit, tooltip: t('ویرایش ردیف', 'Edit Tier'), onClick: (row) => setContractFormData({
                                id: row.id,
                                currencyId: row.currency_id,
                                fromDate: row.from_date ? row.from_date.substring(0, 10) : '',
                                toDate: row.to_date ? row.to_date.substring(0, 10) : '',
                                minAmount: row.min_amount || 0,
                                maxAmount: row.max_amount || 0,
                                commissionPct: row.commission_pct || 0
                            }), className: 'text-slate-400 hover:text-indigo-600' },
                            { icon: Trash2, tooltip: t('حذف ردیف', 'Delete Tier'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'single', data: row, table: 'fm_broker_contracts' }), className: 'text-slate-400 hover:text-red-600' }
                        ]}
                    />
                </div>
            </div>
        </Modal>

        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null, table: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
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
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null, table: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" onClick={executeDelete} isLoading={isLoading} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 border-red-600 dark:border-red-500">{t('تایید حذف', 'Delete')}</Button>
            </div>
          </div>
        </Modal>
        
      </div>
    );
  };

  window.BrokerManagement = BrokerManagement;
})();