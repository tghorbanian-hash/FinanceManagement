/* Filename: financial/CostTypes.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback, useRef } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    Tags = FallbackIcon, Plus = FallbackIcon, Edit = FallbackIcon, Trash2 = FallbackIcon, Save = FallbackIcon,
    AlertTriangle = FallbackIcon, Lock = FallbackIcon, RefreshCw = FallbackIcon, FileText = FallbackIcon
  } = LucideIcons;

  const CostTypes = ({ language = 'fa', formCode = 'COST_TYPES' }) => {
    const FallbackComponent = () => null;
    
    const Core = window.DSCore || window.DesignSystem || {};
    const { Button = FallbackComponent, PageHeader = FallbackComponent, Card = FallbackComponent, Badge = FallbackComponent } = Core;
    
    const Forms = window.DSForms || window.DesignSystem || {};
    const { TextField = FallbackComponent, SelectField = FallbackComponent, ToggleField = FallbackComponent } = Forms;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Modal = FallbackComponent, Toast = FallbackComponent } = Feedback;
    
    const TreeSystem = window.DSTree || window.DesignSystem || {};
    const { Tree = FallbackComponent } = TreeSystem;

    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const securityCtx = window.SecurityManager?.useSecurity ? window.SecurityManager.useSecurity() : null;
    const access = useMemo(() => {
        const rawActions = securityCtx ? securityCtx.getActions(formCode) : null;
        return rawActions || { canView: true, canCreate: true, canEdit: true, canDelete: true, canPrint: true };
    }, [securityCtx, formCode]);

    const supabase = window.supabase;
    const currentUser = window.NavigationSystem?.currentUser?.name || 'مدیر سیستم';

    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, data: null });
    const isFetching = useRef(false);

    const [rawNodes, setRawNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState({ 
      id: null, 
      code: '', 
      titleFa: '', 
      titleEn: '', 
      parentId: '', 
      isActive: true 
    });

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    const logAction = useCallback(async (entityType, recordId, action, details = '') => {
      try {
        if (!supabase) return;
        await supabase.from('fm_record_logs').insert([{
          entity_type: entityType, record_id: String(recordId), action: action, user_name: currentUser, details: details
        }]);
      } catch (err) {
        console.error('Failed to log action:', err);
      }
    }, [supabase, currentUser]);

    const fetchData = useCallback(async (retainNodeId = null) => {
      if (isFetching.current) return;
      isFetching.current = true;
      setIsLoading(true);
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('fm_cost_types').select('*').order('created_at', { ascending: true });
        if (error) throw error;

        const mappedNodes = (data || []).map(n => ({
          id: n.id,
          parentId: n.parent_id,
          titleFa: n.title_fa,
          titleEn: n.title_en,
          title: isRtl ? n.title_fa : (n.title_en || n.title_fa),
          code: n.code,
          isActive: n.is_active
        }));
        
        setRawNodes(mappedNodes);

        if (retainNodeId) {
          const target = mappedNodes.find(n => n.id === retainNodeId);
          if (target) {
             setSelectedNode(target);
             setFormData({ 
               id: target.id, 
               code: target.code || '', 
               titleFa: target.titleFa || '', 
               titleEn: target.titleEn || '', 
               parentId: target.parentId || '', 
               isActive: target.isActive ?? true 
             });
             setIsEditMode(true);
          }
        }
      } catch (err) {
        showToast(t('خطا در دریافت اطلاعات انواع هزینه', 'Error fetching cost types'), 'error');
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    }, [supabase, showToast, t, isRtl]);

    useEffect(() => {
      let mounted = true;
      if (mounted && access.canView) {
        fetchData();
      }
      return () => { mounted = false; };
    }, [fetchData, access.canView]);

    const handleSelectNode = (node) => {
      setSelectedNode(node);
      setFormData({ 
        id: node.id, 
        code: node.code || '', 
        titleFa: node.titleFa || '', 
        titleEn: node.titleEn || '', 
        parentId: node.parentId || '', 
        isActive: node.isActive ?? true 
      });
      setIsEditMode(true);
    };

    const handlePrepareNewNode = (parentNode = null) => {
      setSelectedNode(null);
      setFormData({ 
        id: null, 
        code: '', 
        titleFa: '', 
        titleEn: '', 
        parentId: parentNode ? parentNode.id : '', 
        isActive: true 
      });
      setIsEditMode(false);
    };

    const validateUniqueness = () => {
      const parentIdToCheck = formData.parentId || null;
      
      const siblings = rawNodes.filter(n => n.parentId === parentIdToCheck && n.id !== formData.id);
      
      const duplicateFa = siblings.some(n => n.titleFa.trim() === formData.titleFa.trim());
      if (duplicateFa) {
        showToast(t('عنوان فارسی در این سطح تکراری است.', 'Persian title is duplicated at this level.'), 'error');
        return false;
      }

      const duplicateEn = siblings.some(n => (n.titleEn || '').trim() !== '' && n.titleEn.trim() === formData.titleEn.trim());
      if (duplicateEn) {
        showToast(t('عنوان انگلیسی در این سطح تکراری است.', 'English title is duplicated at this level.'), 'error');
        return false;
      }

      return true;
    };

    const handleSave = async () => {
      if (!formData.titleFa) {
        return showToast(t('عنوان فارسی الزامی است', 'Persian title is required'), 'error');
      }

      if (!validateUniqueness()) {
        return;
      }

      setIsLoading(true);
      try {
        const payload = {
          code: formData.code,
          title_fa: formData.titleFa,
          title_en: formData.titleEn,
          parent_id: formData.parentId || null,
          is_active: formData.isActive
        };

        let targetNodeId = null;

        if (isEditMode && selectedNode) {
          if (formData.parentId === selectedNode.id) {
             setIsLoading(false);
             return showToast(t('گره نمی‌تواند زیرمجموعه خودش باشد', 'Cannot be parent to itself'), 'error');
          }
          const { error } = await supabase.from('fm_cost_types').update(payload).eq('id', selectedNode.id);
          if (error) throw error;
          targetNodeId = selectedNode.id;
          await logAction('انواع هزینه', targetNodeId, 'update', `ویرایش نوع هزینه: ${payload.title_fa}`);
        } else {
          const { data, error } = await supabase.from('fm_cost_types').insert([payload]).select();
          if (error) throw error;
          if (data && data[0]) {
            targetNodeId = data[0].id;
            await logAction('انواع هزینه', targetNodeId, 'create', `ایجاد نوع هزینه جدید: ${payload.title_fa}`);
          }
        }
        
        await fetchData(targetNodeId);
        showToast(t('عملیات با موفقیت انجام شد', 'Operation successful'));
      } catch (err) {
        showToast(t('خطا در ذخیره اطلاعات', 'Error saving data'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const executeDelete = async () => {
      if (!deleteConfirm.data) return;
      setIsLoading(true);
      try {
        const hasChildren = rawNodes.some(n => n.parentId === deleteConfirm.data.id);
        if (hasChildren) {
          setIsLoading(false);
          setDeleteConfirm({ isOpen: false, data: null });
          return showToast(t('این گره دارای زیرمجموعه است و قابل حذف نیست', 'Node has children and cannot be deleted'), 'error');
        }

        const { error } = await supabase.from('fm_cost_types').delete().eq('id', deleteConfirm.data.id);
        if (error) throw error;
        
        await logAction('انواع هزینه', deleteConfirm.data.id, 'delete', `حذف نوع هزینه: ${deleteConfirm.data.titleFa}`);
        
        await fetchData();
        handlePrepareNewNode();
        showToast(t('عملیات حذف با موفقیت انجام شد', 'Deletion successful'));
        setDeleteConfirm({ isOpen: false, data: null });
      } catch (err) {
        showToast(t('امکان حذف رکورد دارای وابستگی وجود ندارد', 'Cannot delete record with relations'), 'error');
        setDeleteConfirm({ isOpen: false, data: null });
      } finally {
        setIsLoading(false);
      }
    };

    const parentNodeOptions = useMemo(() => {
        return rawNodes
            .filter(n => n.id !== formData.id) 
            .map(n => ({ value: n.id, label: isRtl ? n.titleFa : (n.titleEn || n.titleFa) }));
    }, [rawNodes, formData.id, isRtl]);

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('تعریف انواع هزینه', 'Cost Types Management')}
          icon={Tags} language={language}
          description={t('مدیریت و دسته‌بندی درختی هزینه‌های سیستم', 'Manage and categorize system costs hierarchically')}
          breadcrumbs={[{ label: t('مدیریت مالی', 'Financial Management') }, { label: t('انواع هزینه', 'Cost Types') }]}
        />

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 mt-3 animate-in fade-in zoom-in-95 duration-300">
          
          <div className="w-full md:w-[400px] flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden shrink-0">
             <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                   <Tags size={16} className="text-indigo-500" />
                   {t('ساختار درختی هزینه‌ها', 'Cost Hierarchy')}
                </h2>
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchData()} isLoading={isLoading} title={t('بروزرسانی', 'Refresh')} className="h-7 w-7 px-0" />
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                {rawNodes.length === 0 && !isLoading ? (
                    <div className="text-center text-slate-400 text-sm p-4 mt-10">
                        {t('هیچ نوع هزینه‌ای تعریف نشده است.', 'No cost types defined yet.')}
                    </div>
                ) : (
                    <Tree 
                        data={rawNodes} language={language} formCode={formCode}
                        idField="id" parentField="parentId" displayField="title" activeField="isActive"
                        selectedId={selectedNode?.id}
                        onSelect={handleSelectNode}
                        onAddRoot={access.canCreate ? () => handlePrepareNewNode(null) : undefined}
                        onAddChild={access.canCreate ? (node) => handlePrepareNewNode(node) : undefined}
                        onDelete={access.canDelete ? (node) => setDeleteConfirm({ isOpen: true, data: node }) : undefined}
                    />
                )}
             </div>
             {access.canCreate && (
                 <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <Button variant="primary" className="w-full shadow-sm" icon={Plus} onClick={() => handlePrepareNewNode(null)}>
                        {t('تعریف هزینه سطح اول (ریشه)', 'Add Root Cost Type')}
                    </Button>
                 </div>
             )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-3 flex items-center">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                   <FileText size={16} className="text-indigo-500" />
                   {isEditMode ? t('ویرایش مشخصات', 'Edit Details') : t('ثبت هزینه جدید', 'Add New Cost Type')}
                </h2>
             </div>
             
             <div className="flex-1 overflow-y-auto p-5">
                 <div className="max-w-2xl mx-auto space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <TextField 
                            formCode={formCode} 
                            label={t('کد هزینه', 'Cost Code')} 
                            value={formData.code} 
                            onChange={e => setFormData({...formData, code: e.target.value})} 
                            isRtl={isRtl} 
                            dir="ltr"
                            placeholder="مثال: PR-01"
                        />
                        <SelectField 
                            formCode={formCode} 
                            label={t('مجموعه والد', 'Parent Node')} 
                            value={formData.parentId} 
                            onChange={e => setFormData({...formData, parentId: e.target.value})} 
                            isRtl={isRtl} 
                            options={[{value: '', label: t('بدون والد (سطح ریشه)', 'Root Level (No Parent)')}, ...parentNodeOptions]} 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <TextField 
                            formCode={formCode} 
                            label={t('عنوان فارسی', 'Persian Title')} 
                            value={formData.titleFa} 
                            onChange={e => setFormData({...formData, titleFa: e.target.value})} 
                            isRtl={isRtl} 
                            required 
                            placeholder="مثال: هزینه‌های پرسنلی"
                        />
                        <TextField 
                            formCode={formCode} 
                            label={t('عنوان انگلیسی', 'English Title')} 
                            value={formData.titleEn} 
                            onChange={e => setFormData({...formData, titleEn: e.target.value})} 
                            isRtl={isRtl} 
                            dir="ltr"
                            placeholder="e.g. Personnel Costs"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{t('وضعیت فعالیت', 'Activity Status')}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('هزینه‌های غیرفعال در لیست‌های انتخاب فرم‌های عملیاتی نمایش داده نمی‌شوند.', 'Inactive costs will not appear in selection dropdowns.')}
                                </p>
                            </div>
                            <ToggleField 
                                formCode={formCode} 
                                label={formData.isActive ? t('فعال', 'Active') : t('غیرفعال', 'Inactive')} 
                                checked={formData.isActive} 
                                onChange={val => setFormData({...formData, isActive: val})} 
                                isRtl={isRtl} 
                            />
                        </div>
                    </div>

                 </div>
             </div>

             <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-end gap-3">
                 <Button variant="outline" icon={Plus} onClick={() => handlePrepareNewNode(null)}>
                     {t('انصراف / جدید', 'Cancel / New')}
                 </Button>
                 {access.canEdit && (
                     <Button variant="primary" icon={Save} onClick={handleSave} isLoading={isLoading} className="px-6 shadow-md shadow-indigo-200 dark:shadow-none">
                         {t('ذخیره اطلاعات', 'Save Details')}
                     </Button>
                 )}
             </div>
          </div>
          
        </div>

        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, data: null })} title={t('تایید عملیات حذف', 'Confirm Deletion')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 mb-1">
               <AlertTriangle size={22} />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1">
               <Lock size={12}/> {t('هشدار: غیرقابل بازگشت', 'WARNING: IRREVERSIBLE')}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mt-2">
              {t(`آیا از حذف نوع هزینه "${deleteConfirm.data?.title}" اطمینان دارید؟`, `Are you sure you want to delete "${deleteConfirm.data?.title}"?`)}
            </p>
            <div className="flex gap-2 mt-5 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button variant="primary" onClick={executeDelete} isLoading={isLoading} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 border-red-600 dark:border-red-500 shadow-lg shadow-red-100 dark:shadow-none">{t('تایید حذف', 'Delete Now')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  CostTypes.formCode = 'COST_TYPES';
  window.CostTypes = CostTypes;
})();