/* Filename: workflow/WorkflowManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    GitMerge = FallbackIcon, Plus = FallbackIcon, Edit = FallbackIcon, Trash2 = FallbackIcon, 
    Save = FallbackIcon, Play = FallbackIcon, Square = FallbackIcon, CheckCircle2 = FallbackIcon,
    ArrowLeft = FallbackIcon, ArrowRight = FallbackIcon, Database = FallbackIcon, Settings2 = FallbackIcon,
    Users = FallbackIcon, GripHorizontal = FallbackIcon, X = FallbackIcon
  } = LucideIcons;

  const WorkflowManagement = ({ language = 'fa' }) => {
    const FallbackComponent = () => null;
    const Core = window.DSCore || window.DesignSystem || {};
    const { 
      Button = FallbackComponent, PageHeader = FallbackComponent, Badge = FallbackComponent,
      TextField = FallbackComponent, SelectField = FallbackComponent, ToggleField = FallbackComponent, Tabs = FallbackComponent
    } = Core;
    
    const Grid = window.DSGrid || window.DesignSystem || {};
    const { DataGrid = FallbackComponent } = Grid;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Modal = FallbackComponent, Toast = FallbackComponent, Dialog = FallbackComponent } = Feedback;

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const supabase = window.supabase;
    const currentUser = window.NavigationSystem?.currentUser?.name || 'مدیر سیستم';

    const [definitions, setDefinitions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
    
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('base');
    const [editingDef, setEditingDef] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const supportedEntities = [
        { value: 'fm_vouchers', label: t('اسناد حسابداری', 'Accounting Vouchers') },
        { value: 'fm_payment_requests', label: t('درخواست‌های پرداخت', 'Payment Requests') },
        { value: 'fm_invoices', label: t('فاکتورهای فروش', 'Sales Invoices') }
    ];

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    const fetchDefinitions = async () => {
      setIsLoading(true);
      try {
        if (!supabase) throw new Error("Supabase is not initialized");
        const { data, error } = await supabase
          .schema('wf')
          .from('wf_definitions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setDefinitions(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        showToast(t('خطا در دریافت لیست گردش کارها', 'Error fetching workflows'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchDefinitions();
    }, []);

    const openBuilder = (def = null) => {
        if (def) {
            setEditingDef({
                ...def,
                bpmn_data: def.bpmn_data || { states: [], transitions: [] }
            });
        } else {
            setEditingDef({
                id: null,
                title: '',
                entity_type: 'fm_vouchers',
                is_active: false,
                bpmn_data: {
                    states: [
                        { id: generateId(), label: t('پیش‌نویس', 'Draft'), type: 'START' },
                        { id: generateId(), label: t('تایید نهایی', 'Approved'), type: 'END' }
                    ],
                    transitions: []
                }
            });
        }
        setActiveTab('base');
        setIsBuilderOpen(true);
    };

    const handleSaveDefinition = async () => {
        try {
            if (!editingDef.title || !editingDef.entity_type) {
                showToast(t('لطفاً عنوان و موجودیت را مشخص کنید.', 'Please provide title and entity type.'), 'error');
                return;
            }
            if (editingDef.bpmn_data.states.length < 2) {
                showToast(t('حداقل دو وضعیت (شروع و پایان) الزامی است.', 'At least two states are required.'), 'error');
                return;
            }

            const payload = {
                title: editingDef.title,
                entity_type: editingDef.entity_type,
                is_active: editingDef.is_active,
                bpmn_data: editingDef.bpmn_data,
                updated_at: new Date().toISOString()
            };

            if (editingDef.id) {
                const { error } = await supabase.schema('wf').from('wf_definitions').update(payload).eq('id', editingDef.id);
                if (error) throw error;
                showToast(t('گردش کار با موفقیت بروزرسانی شد.', 'Workflow updated successfully.'));
            } else {
                payload.created_by = currentUser;
                const { error } = await supabase.schema('wf').from('wf_definitions').insert([payload]);
                if (error) throw error;
                showToast(t('گردش کار جدید با موفقیت ایجاد شد.', 'New workflow created successfully.'));
            }
            setIsBuilderOpen(false);
            fetchDefinitions();
        } catch (err) {
            console.error("Save error:", err);
            showToast(t('خطا در ذخیره اطلاعات گردش کار', 'Error saving workflow data'), 'error');
        }
    };

    const executeDelete = async () => {
        try {
            if (!deleteConfirm) return;
            const { error } = await supabase.schema('wf').from('wf_definitions').delete().eq('id', deleteConfirm);
            if (error) throw error;
            showToast(t('گردش کار با موفقیت حذف شد.', 'Workflow deleted successfully.'));
            setDeleteConfirm(null);
            fetchDefinitions();
        } catch (err) {
            console.error("Delete error:", err);
            showToast(t('خطا در حذف گردش کار (ممکن است دارای سوابق اجرایی باشد)', 'Error deleting workflow (might have active instances)'), 'error');
            setDeleteConfirm(null);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const { error } = await supabase.schema('wf').from('wf_definitions').update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            showToast(t('وضعیت گردش کار تغییر کرد.', 'Workflow status updated.'));
            fetchDefinitions();
        } catch (err) {
            console.error("Status error:", err);
            showToast(t('خطا در تغییر وضعیت', 'Error changing status'), 'error');
        }
    };

    const columns = [
        { field: 'title', header_fa: 'عنوان گردش کار', header_en: 'Title', width: '250px', render: (v) => <span className="font-black text-slate-800 dark:text-slate-100">{v}</span> },
        { field: 'entity_type', header_fa: 'موجودیت هدف', header_en: 'Target Entity', width: '180px', render: (v) => {
            const ent = supportedEntities.find(e => e.value === v);
            return <div className="flex items-center gap-1.5"><Database size={12} className="text-slate-400" /><span className="text-[11px] font-bold">{ent ? ent.label : v}</span></div>;
        }},
        { field: 'version', header_fa: 'نسخه', header_en: 'Version', width: '80px', render: (v) => <Badge variant="slate" size="sm" className="font-mono">v{v}.0</Badge> },
        { field: 'is_active', header_fa: 'وضعیت', header_en: 'Status', width: '100px', render: (v, row) => (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleStatus(row.id, v)}>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${v ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${v ? (isRtl ? '-translate-x-4' : 'translate-x-4') : ''}`}></div>
                </div>
                <span className={`text-[10px] font-bold ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{v ? t('فعال', 'Active') : t('غیرفعال', 'Inactive')}</span>
            </div>
        )}
    ];

    const getStateIcon = (type) => {
        if (type === 'START') return <Play size={14} className="text-emerald-500" />;
        if (type === 'END') return <CheckCircle2 size={14} className="text-rose-500" />;
        return <Square size={14} className="text-indigo-500" />;
    };

    const addState = () => {
        const newStates = [...editingDef.bpmn_data.states, { id: generateId(), label: t('وضعیت جدید', 'New State'), type: 'MIDDLE' }];
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, states: newStates } });
    };

    const removeState = (stateId) => {
        const newStates = editingDef.bpmn_data.states.filter(s => s.id !== stateId);
        const newTransitions = editingDef.bpmn_data.transitions.filter(t => t.from !== stateId && t.to !== stateId);
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, states: newStates, transitions: newTransitions } });
    };

    const updateState = (stateId, field, value) => {
        const newStates = editingDef.bpmn_data.states.map(s => s.id === stateId ? { ...s, [field]: value } : s);
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, states: newStates } });
    };

    const addTransition = () => {
        const newTransitions = [...editingDef.bpmn_data.transitions, { id: generateId(), from: '', to: '', action: t('اقدام جدید', 'New Action'), roles: '' }];
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, transitions: newTransitions } });
    };

    const removeTransition = (transId) => {
        const newTransitions = editingDef.bpmn_data.transitions.filter(t => t.id !== transId);
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, transitions: newTransitions } });
    };

    const updateTransition = (transId, field, value) => {
        const newTransitions = editingDef.bpmn_data.transitions.map(t => t.id === transId ? { ...t, [field]: value } : t);
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, transitions: newTransitions } });
    };

    const builderTabs = [
        { id: 'base', label: t('تنظیمات پایه', 'Base Settings'), icon: Settings2 },
        { id: 'states', label: t('ایستگاه‌ها (وضعیت‌ها)', 'States (Nodes)'), icon: Database },
        { id: 'transitions', label: t('مسیرها و اکشن‌ها', 'Transitions & Actions'), icon: GitMerge }
    ];

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت و طراحی گردش کارها (BPMS)', 'Workflow Management (BPMS)')}
          icon={GitMerge} language={language}
          breadcrumbs={[{ label: t('عملیات سیستم', 'System Operations') }, { label: t('گردش کارها', 'Workflows') }]}
        >
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openBuilder()} className="shadow-sm">
                {t('طراحی گردش کار جدید', 'Design New Workflow')}
            </Button>
        </PageHeader>

        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col mt-4">
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 h-full">
                    <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[12px]">{t('در حال دریافت اطلاعات...', 'Loading data...')}</span>
                </div>
            ) : (
                <DataGrid 
                    data={definitions} 
                    columns={columns} 
                    language={language}
                    selectable={false}
                    actions={[
                        { icon: Edit, tooltip: t('ویرایش و طراحی', 'Edit & Design'), onClick: (row) => openBuilder(row), className: 'text-slate-400 hover:text-indigo-600' },
                        { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm(row.id), className: 'text-slate-400 hover:text-red-600' }
                    ]}
                />
            )}
        </div>

        <Modal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} title={editingDef?.id ? t('ویرایش گردش کار', 'Edit Workflow') : t('طراحی گردش کار جدید', 'Design New Workflow')} language={language} width="max-w-4xl">
            {editingDef && (
                <div className="flex flex-col h-[70vh] bg-slate-50/50 dark:bg-slate-900">
                    <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <Tabs tabs={builderTabs} activeTab={activeTab} onChange={setActiveTab} />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {activeTab === 'base' && (
                            <div className="max-w-2xl mx-auto flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                    <TextField label={t('عنوان گردش کار', 'Workflow Title')} value={editingDef.title} onChange={(e) => setEditingDef({...editingDef, title: e.target.value})} isRtl={isRtl} required size="md" />
                                    <SelectField label={t('موجودیت هدف (فرم متصل)', 'Target Entity')} value={editingDef.entity_type} onChange={(e) => setEditingDef({...editingDef, entity_type: e.target.value})} options={supportedEntities} isRtl={isRtl} required size="md" />
                                    <div className="pt-2">
                                        <ToggleField label={t('فعال‌سازی بلافاصله پس از ذخیره', 'Activate immediately after save')} checked={editingDef.is_active} onChange={(val) => setEditingDef({...editingDef, is_active: val})} isRtl={isRtl} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'states' && (
                            <div className="max-w-3xl mx-auto flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-indigo-800 dark:text-indigo-300">{t('تعریف ایستگاه‌های توقف فرم', 'Define Form Stops (States)')}</span>
                                        <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70">{t('فرم در طول مسیر خود در کدام وضعیت‌ها قرار می‌گیرد؟', 'Which states does the form reside in during its path?')}</span>
                                    </div>
                                    <Button variant="primary" size="sm" icon={Plus} onClick={addState}>{t('افزودن وضعیت', 'Add State')}</Button>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    {editingDef.bpmn_data.states.map((state, idx) => (
                                        <div key={state.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500"><GripHorizontal size={16} /></div>
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                                                {getStateIcon(state.type)}
                                            </div>
                                            <div className="flex-1">
                                                <input type="text" value={state.label} onChange={(e) => updateState(state.id, 'label', e.target.value)} className="w-full bg-transparent border-none outline-none text-[12px] font-black text-slate-700 dark:text-slate-200 px-2 py-1 focus:bg-slate-50 dark:focus:bg-slate-900/50 rounded-md transition-colors" placeholder={t('نام وضعیت...', 'State name...')} />
                                            </div>
                                            <div className="w-32 shrink-0">
                                                <select value={state.type} onChange={(e) => updateState(state.id, 'type', e.target.value)} className="w-full text-[11px] font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg h-8 px-2 outline-none text-slate-600 dark:text-slate-300">
                                                    <option value="START">{t('نقطه شروع', 'Start Node')}</option>
                                                    <option value="MIDDLE">{t('ایستگاه میانی', 'Middle Node')}</option>
                                                    <option value="END">{t('نقطه پایان', 'End Node')}</option>
                                                </select>
                                            </div>
                                            <button onClick={() => removeState(state.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors shrink-0">
                                                <X size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'transitions' && (
                            <div className="max-w-4xl mx-auto flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-emerald-800 dark:text-emerald-300">{t('تعریف مسیرهای انتقال و دکمه‌های اکشن', 'Define Transitions & Actions')}</span>
                                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70">{t('چگونه از یک وضعیت به وضعیت دیگر برویم و چه کسی مجاز است؟', 'How to move between states and who is allowed?')}</span>
                                    </div>
                                    <Button variant="outline" className="border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50" size="sm" icon={GitMerge} onClick={addTransition}>{t('افزودن مسیر', 'Add Transition')}</Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {editingDef.bpmn_data.transitions.length === 0 && (
                                        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-[12px] font-bold">
                                            {t('هنوز هیچ مسیر انتقالی تعریف نشده است.', 'No transitions defined yet.')}
                                        </div>
                                    )}
                                    {editingDef.bpmn_data.transitions.map((trans, idx) => (
                                        <div key={trans.id} className="flex flex-col gap-2 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 bottom-0 w-1 bg-indigo-500 left-0"></div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                    <select value={trans.from} onChange={(e) => updateTransition(trans.id, 'from', e.target.value)} className="w-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md h-8 px-2 outline-none">
                                                        <option value="">{t('مبدا (از وضعیت...)', 'From State...')}</option>
                                                        {editingDef.bpmn_data.states.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                    </select>
                                                    <div className="text-slate-300 dark:text-slate-600 shrink-0">{isRtl ? <ArrowLeft size={16} strokeWidth={2.5}/> : <ArrowRight size={16} strokeWidth={2.5}/>}</div>
                                                    <select value={trans.to} onChange={(e) => updateTransition(trans.id, 'to', e.target.value)} className="w-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md h-8 px-2 outline-none">
                                                        <option value="">{t('مقصد (به وضعیت...)', 'To State...')}</option>
                                                        {editingDef.bpmn_data.states.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                    </select>
                                                </div>
                                                <button onClick={() => removeTransition(trans.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors shrink-0">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 mt-1">
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-md shrink-0"><Play size={12}/></div>
                                                    <input type="text" value={trans.action} onChange={(e) => updateTransition(trans.id, 'action', e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md h-8 px-2.5 text-[11px] font-bold outline-none focus:border-indigo-400" placeholder={t('عنوان دکمه (مثلا: تایید و ارسال)', 'Button Label (e.g., Approve & Send)')} />
                                                </div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-md shrink-0"><Users size={12}/></div>
                                                    <input type="text" value={trans.roles} onChange={(e) => updateTransition(trans.id, 'roles', e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md h-8 px-2.5 text-[11px] font-bold outline-none focus:border-indigo-400" placeholder={t('نقش‌های مجاز (با کاما جدا کنید)', 'Allowed Roles (comma separated)')} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-bold hidden sm:block">
                            {activeTab === 'base' ? t('گام ۱ از ۳', 'Step 1 of 3') : activeTab === 'states' ? t('گام ۲ از ۳', 'Step 2 of 3') : t('گام ۳ از ۳', 'Step 3 of 3')}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsBuilderOpen(false)}>{t('انصراف', 'Cancel')}</Button>
                            <Button variant="primary" size="sm" icon={Save} onClick={handleSaveDefinition} className="px-6 shadow-sm">{t('ذخیره و ثبت گردش کار', 'Save Workflow')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>

        <Dialog 
            isOpen={!!deleteConfirm} 
            title={t('حذف گردش کار', 'Delete Workflow')}
            type="error"
            confirmLabel={t('بله، حذف شود', 'Yes, Delete')}
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={executeDelete}
            language={language}
        >
            {t('آیا از حذف این گردش کار اطمینان دارید؟ در صورتی که این گردش کار دارای سوابق اجرایی در سیستم باشد، حذف آن امکان‌پذیر نخواهد بود.', 'Are you sure you want to delete this workflow? If it has active instances, deletion will fail.')}
        </Dialog>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.WorkflowManagement = WorkflowManagement;
})();