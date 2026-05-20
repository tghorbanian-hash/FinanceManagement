/* Filename: financial/GatewayTypes.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  
  const { 
    Button, PageHeader, Modal, DataGrid, 
    TextField, ToggleField, SelectField, CurrencyField, DatePicker, CheckboxField
  } = window.DesignSystem || window.DSCore || window.DSForms || {};
  
  const { 
    CreditCard, Plus, Edit, Trash2, Save, 
    AlertTriangle, Lock, Users
  } = window.LucideIcons || {};
  
  const supabase = window.supabase;

  const GatewayTypes = ({ isAdmin, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;
    
    const [data, setData] = useState([]);
    const [providers, setProviders] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });
    
    const [formData, setFormData] = useState({
      code: '', 
      title: '', 
      providerId: '', 
      currencyId: '',
      accountId: '',
      minAmount: '', 
      maxAmount: '', 
      validFrom: '',
      validTo: '',
      isActive: true
    });

    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
    const [isPartyLoading, setIsPartyLoading] = useState(false);
    const [partyFormData, setPartyFormData] = useState({
      name: '',
      code: '',
      roles: ['PROVIDER']
    });

    const AVAILABLE_ROLES = [
      { value: 'PROVIDER', label_fa: 'تامین کننده', label_en: 'Provider' },
      { value: 'CUSTOMER', label_fa: 'مشتری', label_en: 'Customer' },
      { value: 'EMPLOYEE', label_fa: 'کارمند', label_en: 'Employee' },
      { value: 'BROKER', label_fa: 'بروکر', label_en: 'Broker' }
    ];

    const [gridState, setGridState] = useState(null);

    const viewConfig = {
      pageId: 'gateway_types_main',
      currentState: () => ({ gridState }),
      onApplyState: (state) => {
        if (state) {
          if (state.gridState) setGridState(state.gridState);
        } else {
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
        const { data: partiesData } = await supabase
          .from('parties')
          .select('id, name')
          .order('name', { ascending: true });
        if (partiesData) {
          setProviders(partiesData.map(p => ({ value: p.id, label: p.name })));
        }

        const { data: currData } = await supabase
          .from('fm_currencies')
          .select('id, name, code')
          .order('code', { ascending: true });
        if (currData) {
          setCurrencies(currData.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })));
        }

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
              value: leaf.id,
              labelFa: `[${leaf.code}] ${paths.pathFa}`,
              labelEn: `[${leaf.code}] ${paths.pathEn}`
            };
          });
          setAccounts(accOptions);
        }
      } catch (err) {
        console.error('Fetch Dropdowns Error:', err);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: gateways, error } = await supabase
          .from('fm_gateways')
          .select(`
            *,
            provider:parties(id, name),
            currency:fm_currencies(id, name, code),
            account:fm_coa_accounts(id, title_fa, title_en, code)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData = (gateways || []).map(item => ({
          id: item.id,
          code: item.code,
          title: item.title,
          providerId: item.provider_id,
          providerName: item.provider?.name || '---',
          currencyId: item.currency_id,
          currencyName: item.currency ? `${item.currency.name} (${item.currency.code})` : '---',
          accountId: item.account_id,
          accountName: item.account ? `[${item.account.code}] ${isRtl ? item.account.title_fa : item.account.title_en}` : '---',
          minAmount: item.min_amount,
          maxAmount: item.max_amount,
          validFrom: item.valid_from,
          validTo: item.valid_to,
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
      if (!formData.code || !formData.title || !formData.providerId || !formData.currencyId) return;

      setIsLoading(true);
      try {
        const payload = {
          code: formData.code,
          title: formData.title,
          provider_id: formData.providerId,
          currency_id: formData.currencyId,
          account_id: formData.accountId || null,
          min_amount: formData.minAmount || 0,
          max_amount: formData.maxAmount || 0,
          valid_from: formData.validFrom || null,
          valid_to: formData.validTo || null,
          is_active: formData.isActive
        };

        const { error } = currentRecord?.id 
          ? await supabase.from('fm_gateways').update(payload).eq('id', currentRecord.id)
          : await supabase.from('fm_gateways').insert([payload]);

        if (error) throw error;
        setIsModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Save Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSaveParty = async () => {
      if (!partyFormData.name) return;
      setIsPartyLoading(true);
      try {
        const payload = {
          name: partyFormData.name,
          code: partyFormData.code,
          roles: partyFormData.roles
        };
        const { data, error } = await supabase.from('parties').insert([payload]).select();
        if (error) throw error;
        
        if (data && data.length > 0) {
           const newParty = data[0];
           setProviders(prev => [...prev, { value: newParty.id, label: newParty.name }].sort((a,b) => a.label.localeCompare(b.label)));
           setFormData(prev => ({ ...prev, providerId: newParty.id }));
           setIsPartyModalOpen(false);
        }
      } catch (err) {
        console.error('Save Party Error:', err);
      } finally {
        setIsPartyLoading(false);
      }
    };

    const handleToggleActive = async (row, newValue) => {
      try {
        const { error } = await supabase
          .from('fm_gateways')
          .update({ is_active: newValue })
          .eq('id', row.id);
        
        if (error) throw error;
        setData(prev => prev.map(item => item.id === row.id ? { ...item, isActive: newValue } : item));
      } catch (err) {
        console.error("Toggle Error:", err);
      }
    };

    const executeDelete = async () => {
      setIsLoading(true);
      try {
        if (deleteConfirm.type === 'single') {
          const { error } = await supabase.from('fm_gateways').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
        } else if (deleteConfirm.type === 'bulk') {
          const { error } = await supabase.from('fm_gateways').delete().in('id', deleteConfirm.data);
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
        code: '', title: '', providerId: '', currencyId: '', accountId: '', minAmount: '', maxAmount: '', 
        validFrom: '', validTo: '', isActive: true 
      });
      setCurrentRecord(record);
      setIsModalOpen(true);
    };

    const accOpts = useMemo(() => {
      return accounts.map(a => ({
        value: a.value,
        label: isRtl ? a.labelFa : a.labelEn
      }));
    }, [accounts, isRtl]);

    const columns = [
      { field: 'code', header_fa: 'کد', header_en: 'Code', width: '100px' },
      { field: 'title', header_fa: 'عنوان درگاه', header_en: 'Title', width: '180px' },
      { field: 'providerName', header_fa: 'تامین‌کننده', header_en: 'Provider', width: '150px' },
      { field: 'currencyName', header_fa: 'ارز', header_en: 'Currency', width: '120px' },
      { field: 'accountName', header_fa: 'حساب مرتبط', header_en: 'Linked Account', width: '220px' },
      { 
        field: 'minAmount', 
        header_fa: 'کف تراکنش', 
        header_en: 'Min Amount', 
        width: '130px',
        render: (row) => row.minAmount ? Number(row.minAmount).toLocaleString() : '0'
      },
      { 
        field: 'maxAmount', 
        header_fa: 'سقف تراکنش', 
        header_en: 'Max Amount', 
        width: '130px',
        render: (row) => row.maxAmount ? Number(row.maxAmount).toLocaleString() : '0'
      },
      { 
        field: 'isActive', 
        header_fa: 'وضعیت', 
        header_en: 'Status', 
        width: '90px', 
        type: 'toggle',
        onToggle: (row, val) => handleToggleActive(row, val)
      }
    ];

    return (
      <div className="flex flex-col h-full p-4 bg-[#f8fafc] dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت درگاه‌های پرداخت', 'Payment Gateways Management')} 
          icon={CreditCard}
          description={t('مدیریت و تعریف درگاه‌های بانکی، ارزها و حساب‌های مرتبط', 'Manage gateways, currencies, and linked accounts')}
          language={language}
          breadcrumbs={[{ label: t('مدیریت مالی', 'Financial') }, { label: t('درگاه‌های پرداخت', 'Gateways') }]}
          viewConfig={viewConfig}
        />

        <div className="flex-1 flex flex-col min-h-0 mt-4 animate-in fade-in duration-300">
          <div className="flex-1 min-h-0">
            <DataGrid 
              data={data}
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
              hideImport={true}
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
          title={currentRecord ? t('ویرایش درگاه پرداخت', 'Edit Gateway') : t('تعریف درگاه جدید', 'New Gateway')}
          width="max-w-2xl"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField 
                size="sm" 
                label={t('کد درگاه', 'Code')} 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                isRtl={isRtl} 
                required 
                dir="ltr" 
              />
              <TextField 
                size="sm" 
                label={t('عنوان درگاه', 'Title')} 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                isRtl={isRtl} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-end gap-2">
                <SelectField 
                  wrapperClassName="flex-1"
                  size="sm" 
                  label={t('تامین‌کننده (شخص/شرکت)', 'Provider')} 
                  value={formData.providerId} 
                  onChange={e => setFormData({...formData, providerId: e.target.value})} 
                  options={providers}
                  isRtl={isRtl} 
                  required
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Plus} 
                  onClick={() => {
                    setPartyFormData({ name: '', code: '', roles: ['PROVIDER'] });
                    setIsPartyModalOpen(true);
                  }}
                  title={t('تعریف شخص/شرکت جدید', 'New Party')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField 
                size="sm" 
                label={t('نوع ارز', 'Currency')} 
                value={formData.currencyId} 
                onChange={e => setFormData({...formData, currencyId: e.target.value})} 
                options={currencies}
                isRtl={isRtl} 
                required
              />
              <SelectField 
                size="sm" 
                label={t('حساب مرتبط (آخرین سطح)', 'Linked Account')} 
                value={formData.accountId} 
                onChange={e => setFormData({...formData, accountId: e.target.value})} 
                options={accOpts}
                isRtl={isRtl} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyField 
                size="sm" 
                label={t('کف مبلغ تراکنش', 'Min Amount')} 
                value={formData.minAmount} 
                onChange={val => setFormData({...formData, minAmount: val})} 
                isRtl={isRtl} 
              />
              <CurrencyField 
                size="sm" 
                label={t('سقف مبلغ تراکنش', 'Max Amount')} 
                value={formData.maxAmount} 
                onChange={val => setFormData({...formData, maxAmount: val})} 
                isRtl={isRtl} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker 
                size="sm" 
                label={t('از تاریخ (اعتبار)', 'Valid From')} 
                value={formData.validFrom} 
                onChange={val => setFormData({...formData, validFrom: val})} 
                isRtl={isRtl} 
              />
              <DatePicker 
                size="sm" 
                label={t('تا تاریخ (اعتبار)', 'Valid To')} 
                value={formData.validTo} 
                onChange={val => setFormData({...formData, validTo: val})} 
                isRtl={isRtl} 
              />
            </div>

            <div className="flex items-center mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
              <ToggleField 
                size="sm" 
                label={t('وضعیت فعال', 'Active Status')} 
                checked={formData.isActive} 
                onChange={v => setFormData({...formData, isActive: v})} 
                isRtl={isRtl} 
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={isLoading}>{t('ذخیره اطلاعات', 'Save')}</Button>
            </div>
          </div>
        </Modal>

        <Modal 
          isOpen={isPartyModalOpen} onClose={() => setIsPartyModalOpen(false)} 
          title={t('تعریف سریع تامین‌کننده', 'Quick Add Provider')}
          width="max-w-md"
          language={language}
        >
          <div className="p-4 flex flex-col gap-4">
            <TextField 
              size="sm" 
              label={t('نام شخص / شرکت', 'Name')} 
              value={partyFormData.name} 
              onChange={e => setPartyFormData({...partyFormData, name: e.target.value})} 
              isRtl={isRtl} 
              required 
            />
            <TextField 
              size="sm" 
              label={t('کد', 'Code')} 
              value={partyFormData.code} 
              onChange={e => setPartyFormData({...partyFormData, code: e.target.value})} 
              isRtl={isRtl} 
              dir="ltr" 
            />
            
            <div className="mt-2">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block">{t('نقش‌های مرتبط', 'Associated Roles')}</label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {AVAILABLE_ROLES.map(role => (
                  <CheckboxField 
                    key={role.value}
                    label={isRtl ? role.label_fa : role.label_en}
                    checked={partyFormData.roles.includes(role.value)}
                    onChange={(checked) => {
                        let newRoles = [...partyFormData.roles];
                        if (checked) newRoles.push(role.value);
                        else newRoles = newRoles.filter(r => r !== role.value);
                        setPartyFormData({...partyFormData, roles: newRoles});
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="outline" size="sm" onClick={() => setIsPartyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" size="sm" icon={Users} onClick={handleSaveParty} isLoading={isPartyLoading}>{t('ثبت شخص', 'Save Party')}</Button>
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
                : t(`آیا از حذف درگاه "${deleteConfirm.data?.title}" اطمینان دارید؟`, `Delete gateway "${deleteConfirm.data?.title}"?`)
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

  window.GatewayTypes = GatewayTypes;
})();