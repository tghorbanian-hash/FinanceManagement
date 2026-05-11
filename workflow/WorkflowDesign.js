/* Filename: workflow/WorkflowDesign.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    GitMerge = FallbackIcon, Plus = FallbackIcon, Trash2 = FallbackIcon, Save = FallbackIcon, 
    Play = FallbackIcon, Square = FallbackIcon, CheckCircle2 = FallbackIcon, ArrowLeft = FallbackIcon, 
    ArrowRight = FallbackIcon, Database = FallbackIcon, Settings2 = FallbackIcon, Users = FallbackIcon, 
    GripHorizontal = FallbackIcon, X = FallbackIcon
  } = LucideIcons;

  const WorkflowDesign = ({ definition, onBack, language = 'fa' }) => {
    const FallbackComponent = () => null;
    const Core = window.DSCore || window.DesignSystem || {};
    const { 
      Button = FallbackComponent, PageHeader = FallbackComponent, TextField = FallbackComponent, 
      SelectField = FallbackComponent, ToggleField = FallbackComponent, Tabs = FallbackComponent
    } = Core;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Toast = FallbackComponent } = Feedback;

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const supabase = window.supabase;
    const currentUser = window.NavigationSystem?.currentUser?.name || 'مدیر سیستم';

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const supportedEntities = [
        { value: 'fm_vouchers', label: t('اسناد حسابداری', 'Accounting Vouchers') },
        { value: 'fm_payment_requests', label: t('درخواست‌های پرداخت', 'Payment Requests') },
        { value: 'fm_invoices', label: t('فاکتورهای فروش', 'Sales Invoices') }
    ];

    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
    const [activeTab, setActiveTab] = useState('base');
    const [editingDef, setEditingDef] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    useEffect(() => {
        if (definition) {
            setEditingDef({
                ...definition,
                bpmn_data: definition.bpmn_data || { states: [], transitions: [] }
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
    }, [definition]);

    const handleSaveDefinition = async () => {
        try {
            setIsSaving(true);
            if (!editingDef.title || !editingDef.entity_type) {
                showToast(t('لطفاً عنوان و موجودیت را مشخص کنید.', 'Please provide title and entity type.'), 'error');
                setIsSaving(false);
                return;
            }
            if (editingDef.bpmn_data.states.length < 2) {
                showToast(t('حداقل دو وضعیت (شروع و پایان) الزامی است.', 'At least two states are required.'), 'error');
                setIsSaving(false);
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
            
            setTimeout(() => {
                onBack(true);
            }, 1000);

        } catch (err) {
            console.error("Save error:", err);
            showToast(t('خطا در ذخیره اطلاعات گردش کار', 'Error saving workflow data'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

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

    if (!editingDef) return null;

    return (
      <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 font-sans animate-in fade-in zoom-in-95 duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={editingDef.id ? t('ویرایش و طراحی گردش کار', 'Edit Workflow Design') : t('طراحی گردش کار جدید', 'Design New Workflow')}
          icon={GitMerge} language={language}
          breadcrumbs={[{ label: t('مدیریت گردش کارها', 'Workflow Management') }, { label: t('محیط طراح', 'Designer') }]}
        >
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={isRtl ? ArrowRight : ArrowLeft} onClick={() => onBack(false)} className="shadow-sm bg-white dark:bg-slate-800">
                    {t('بازگشت به فهرست', 'Back to List')}
                </Button>
                <Button variant="primary" size="sm" icon={Save} onClick={handleSaveDefinition} disabled={isSaving} className="shadow-sm px-6">
                    {isSaving ? t('در حال ذخیره...', 'Saving...') : t('ذخیره گردش کار', 'Save Workflow')}
                </Button>
            </div>
        </PageHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4 mt-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
                    <Tabs tabs={builderTabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 dark:bg-slate-900/20">
                    {activeTab === 'base' && (
                        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col gap-1 mb-2">
                                <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-100">{t('مشخصات پایه گردش کار', 'Basic Workflow Details')}</h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('اطلاعات کلی و موجودیت هدف این گردش کار را تعریف کنید.', 'Define general info and target entity for this workflow.')}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-5">
                                <TextField label={t('عنوان گردش کار', 'Workflow Title')} value={editingDef.title} onChange={(e) => setEditingDef({...editingDef, title: e.target.value})} isRtl={isRtl} required size="md" />
                                <SelectField label={t('موجودیت هدف (فرم متصل)', 'Target Entity')} value={editingDef.entity_type} onChange={(e) => setEditingDef({...editingDef, entity_type: e.target.value})} options={supportedEntities} isRtl={isRtl} required size="md" />
                                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-700/50">
                                    <ToggleField label={t('فعال‌سازی بلافاصله پس از ذخیره', 'Activate immediately after save')} checked={editingDef.is_active} onChange={(val) => setEditingDef({...editingDef, is_active: val})} isRtl={isRtl} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'states' && (
                        <div className="max-w-4xl mx-auto flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-black text-indigo-800 dark:text-indigo-300">{t('تعریف ایستگاه‌های توقف فرم', 'Define Form Stops (States)')}</span>
                                    <span className="text-[11px] font-medium text-indigo-600/80 dark:text-indigo-400/80">{t('فرم در طول مسیر خود در کدام وضعیت‌ها قرار می‌گیرد؟ (حداقل یک شروع و یک پایان نیاز است)', 'Which states does the form reside in during its path?')}</span>
                                </div>
                                <Button variant="primary" size="sm" icon={Plus} onClick={addState} className="shadow-sm">{t('افزودن وضعیت جدید', 'Add New State')}</Button>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {editingDef.bpmn_data.states.map((state, idx) => (
                                    <div key={state.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group">
                                        <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500"><GripHorizontal size={18} /></div>
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0 shadow-inner">
                                            {getStateIcon(state.type)}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('نام وضعیت', 'State Name')}</span>
                                            <input type="text" value={state.label} onChange={(e) => updateState(state.id, 'label', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none text-[12px] font-black text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-md transition-colors" placeholder={t('نام وضعیت...', 'State name...')} />
                                        </div>
                                        <div className="w-40 shrink-0 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('نوع وضعیت', 'State Type')}</span>
                                            <select value={state.type} onChange={(e) => updateState(state.id, 'type', e.target.value)} className="w-full text-[11px] font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md h-[30px] px-2 outline-none text-slate-700 dark:text-slate-300 focus:border-indigo-400 dark:focus:border-indigo-500">
                                                <option value="START">{t('نقطه شروع (Start)', 'Start Node')}</option>
                                                <option value="MIDDLE">{t('ایستگاه میانی (Middle)', 'Middle Node')}</option>
                                                <option value="END">{t('نقطه پایان (End)', 'End Node')}</option>
                                            </select>
                                        </div>
                                        <div className="shrink-0 pt-4 px-1">
                                            <button onClick={() => removeState(state.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all" title={t('حذف وضعیت', 'Delete State')}>
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'transitions' && (
                        <div className="max-w-5xl mx-auto flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-black text-emerald-800 dark:text-emerald-300">{t('تعریف مسیرهای انتقال و دکمه‌های اکشن', 'Define Transitions & Actions')}</span>
                                    <span className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80">{t('فرم چگونه بین وضعیت‌ها حرکت کند و چه نقش‌هایی مجوز فشردن دکمه‌ها را دارند؟', 'How to move between states and who is allowed?')}</span>
                                </div>
                                <Button variant="outline" className="border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 shadow-sm" size="sm" icon={GitMerge} onClick={addTransition}>{t('افزودن مسیر جدید', 'Add New Transition')}</Button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {editingDef.bpmn_data.transitions.length === 0 && (
                                    <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
                                        <GitMerge size={32} className="opacity-30 mb-3" />
                                        <span className="text-[13px] font-black">{t('هنوز هیچ مسیر انتقالی تعریف نشده است.', 'No transitions defined yet.')}</span>
                                        <span className="text-[11px] mt-1">{t('برای شروع روی دکمه "افزودن مسیر جدید" کلیک کنید.', 'Click Add New Transition to start.')}</span>
                                    </div>
                                )}
                                {editingDef.bpmn_data.transitions.map((trans, idx) => (
                                    <div key={trans.id} className="flex flex-col gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                                        <div className="absolute top-0 bottom-0 w-1.5 bg-indigo-400 dark:bg-indigo-500 left-0"></div>
                                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                <select value={trans.from} onChange={(e) => updateTransition(trans.id, 'from', e.target.value)} className="w-full text-[12px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md h-[34px] px-2 outline-none text-slate-700 dark:text-slate-200 focus:border-indigo-400">
                                                    <option value="">{t('مبدا (از وضعیت...)', 'From State...')}</option>
                                                    {editingDef.bpmn_data.states.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                </select>
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-indigo-400 shadow-sm">
                                                    {isRtl ? <ArrowLeft size={16} strokeWidth={2.5}/> : <ArrowRight size={16} strokeWidth={2.5}/>}
                                                </div>
                                                <select value={trans.to} onChange={(e) => updateTransition(trans.id, 'to', e.target.value)} className="w-full text-[12px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md h-[34px] px-2 outline-none text-slate-700 dark:text-slate-200 focus:border-indigo-400">
                                                    <option value="">{t('مقصد (به وضعیت...)', 'To State...')}</option>
                                                    {editingDef.bpmn_data.states.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => removeTransition(trans.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors shrink-0 border border-transparent hover:border-rose-100 dark:hover:border-rose-800/50">
                                                <Trash2 size={18} strokeWidth={2} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 mt-1">
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1"><Play size={12} className="text-indigo-400"/> {t('عنوان دکمه (نمایش در فرم)', 'Button Label (Shown on form)')}</span>
                                                <input type="text" value={trans.action} onChange={(e) => updateTransition(trans.id, 'action', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg h-9 px-3 text-[12px] font-bold outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors text-slate-800 dark:text-slate-100" placeholder={t('مثلا: تایید و ارسال به مدیر', 'e.g., Approve & Send to Manager')} />
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1"><Users size={12} className="text-amber-500"/> {t('نقش‌های مجاز (کاما جدا)', 'Allowed Roles (comma separated)')}</span>
                                                <input type="text" value={trans.roles} onChange={(e) => updateTransition(trans.id, 'roles', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg h-9 px-3 text-[12px] font-bold outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-colors text-slate-800 dark:text-slate-100" placeholder={t('مثلا: کارشناس مالی, مدیر ارشد', 'e.g., Finance Expert, Senior Manager')} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  window.WorkflowDesign = WorkflowDesign;
})();