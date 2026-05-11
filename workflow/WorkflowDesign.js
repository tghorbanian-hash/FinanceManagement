/* Filename: workflow/WorkflowDesign.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    GitMerge = FallbackIcon, Plus = FallbackIcon, Trash2 = FallbackIcon, Save = FallbackIcon, 
    PlayCircle = FallbackIcon, StopCircle = FallbackIcon, CheckSquare = FallbackIcon, Diamond = FallbackIcon,
    ArrowLeft = FallbackIcon, ArrowRight = FallbackIcon, Database = FallbackIcon, Settings2 = FallbackIcon, 
    Layers = FallbackIcon, Users = FallbackIcon, X = FallbackIcon, ListTree = FallbackIcon, ArrowRightLeft = FallbackIcon,
    Info = FallbackIcon
  } = LucideIcons;

  const WorkflowDesign = ({ definition, systemEntities = [], onBack, language = 'fa' }) => {
    const FallbackComponent = () => null;
    const Core = window.DSCore || window.DesignSystem || {};
    const { 
      Button = FallbackComponent, PageHeader = FallbackComponent, TextField = FallbackComponent, 
      SelectField = FallbackComponent, ToggleField = FallbackComponent, Tabs = FallbackComponent,
      DatePicker = FallbackComponent
    } = Core;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Toast = FallbackComponent } = Feedback;

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const supabase = window.supabase;
    const currentUser = window.NavigationSystem?.currentUser?.name || 'مدیر سیستم';

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
    const [activeTab, setActiveTab] = useState('base');
    const [editingDef, setEditingDef] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedElement, setSelectedElement] = useState(null);

    const [domainFilter, setDomainFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');

    const showToast = useCallback((message, type = 'success') => {
      setToast({ isVisible: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
    }, []);

    useEffect(() => {
        if (definition) {
            setEditingDef({
                ...definition,
                bpmn_data: definition.bpmn_data || { nodes: [], flows: [] }
            });
            
            if (definition.entity_type && systemEntities.length > 0) {
                const ent = systemEntities.find(e => e.entity_code === definition.entity_type);
                if (ent) {
                    setDomainFilter(ent.domain_name || '');
                    setModuleFilter(ent.module_name || '');
                }
            }
        } else {
            setEditingDef({
                id: null,
                title: '',
                entity_type: '',
                is_active: false,
                version: 1,
                factor_field: '',
                factor_value: '',
                effective_start_date: '',
                effective_end_date: '',
                bpmn_data: {
                    nodes: [
                        { id: `start_${generateId()}`, type: 'START_EVENT', name: t('شروع فرآیند', 'Process Start') }
                    ],
                    flows: []
                }
            });
            setDomainFilter('');
            setModuleFilter('');
        }
    }, [definition, systemEntities]);

    const handleSaveDefinition = async () => {
        try {
            setIsSaving(true);
            if (!editingDef.title || !editingDef.entity_type) {
                showToast(t('لطفاً عنوان و موجودیت را مشخص کنید.', 'Please provide title and entity type.'), 'error');
                setIsSaving(false);
                return;
            }

            const payload = {
                title: editingDef.title,
                entity_type: editingDef.entity_type,
                is_active: editingDef.is_active,
                factor_field: editingDef.factor_field,
                factor_value: editingDef.factor_value,
                effective_start_date: editingDef.effective_start_date || null,
                effective_end_date: editingDef.effective_end_date || null,
                bpmn_data: editingDef.bpmn_data,
                updated_at: new Date().toISOString()
            };

            if (editingDef.id) {
                const { error } = await supabase.schema('wf').from('wf_definitions').update(payload).eq('id', editingDef.id);
                if (error) throw error;
                showToast(t('طراحی گردش کار با موفقیت بروزرسانی شد.', 'Workflow design updated successfully.'));
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

    const addNode = (type) => {
        let name = '';
        if (type === 'USER_TASK') name = t('فعالیت کاربر جدید', 'New User Task');
        if (type === 'EXCLUSIVE_GATEWAY') name = t('دروازه شرطی', 'Exclusive Gateway');
        if (type === 'END_EVENT') name = t('پایان فرآیند', 'Process End');
        
        const newNode = { id: `node_${generateId()}`, type, name, task_type: 'APPROVAL', assignee_roles: '', required_fields: '' };
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, nodes: [...editingDef.bpmn_data.nodes, newNode] } });
        setSelectedElement({ type: 'node', id: newNode.id });
    };

    const addFlow = () => {
        const newFlow = { id: `flow_${generateId()}`, sourceRef: '', targetRef: '', name: t('مسیر جدید', 'New Flow'), condition: '' };
        setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, flows: [...editingDef.bpmn_data.flows, newFlow] } });
        setSelectedElement({ type: 'flow', id: newFlow.id });
    };

    const updateElement = (elementType, id, field, value) => {
        if (elementType === 'node') {
            const newNodes = editingDef.bpmn_data.nodes.map(n => n.id === id ? { ...n, [field]: value } : n);
            setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, nodes: newNodes } });
        } else {
            const newFlows = editingDef.bpmn_data.flows.map(f => f.id === id ? { ...f, [field]: value } : f);
            setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, flows: newFlows } });
        }
    };

    const deleteElement = (elementType, id) => {
        if (elementType === 'node') {
            const newNodes = editingDef.bpmn_data.nodes.filter(n => n.id !== id);
            const newFlows = editingDef.bpmn_data.flows.filter(f => f.sourceRef !== id && f.targetRef !== id);
            setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, nodes: newNodes, flows: newFlows } });
        } else {
            const newFlows = editingDef.bpmn_data.flows.filter(f => f.id !== id);
            setEditingDef({ ...editingDef, bpmn_data: { ...editingDef.bpmn_data, flows: newFlows } });
        }
        setSelectedElement(null);
    };

    const getNodeIcon = (type) => {
        if (type === 'START_EVENT') return <PlayCircle size={16} className="text-emerald-500" />;
        if (type === 'END_EVENT') return <StopCircle size={16} className="text-rose-500" />;
        if (type === 'EXCLUSIVE_GATEWAY') return <Diamond size={16} className="text-amber-500" />;
        return <CheckSquare size={16} className="text-indigo-500" />;
    };

    const getNodeName = (id) => {
        const node = editingDef?.bpmn_data.nodes.find(n => n.id === id);
        return node ? node.name : t('نامشخص', 'Unknown');
    };

    const uniqueDomains = useMemo(() => {
        const domains = [...new Set(systemEntities.map(e => e.domain_name).filter(Boolean))];
        return domains.map(d => ({ value: d, label: d }));
    }, [systemEntities]);

    const uniqueModules = useMemo(() => {
        if (!domainFilter) return [];
        const modules = [...new Set(systemEntities.filter(e => e.domain_name === domainFilter).map(e => e.module_name).filter(Boolean))];
        return modules.map(m => ({ value: m, label: m }));
    }, [systemEntities, domainFilter]);

    const filteredEntities = useMemo(() => {
        let list = systemEntities;
        if (domainFilter) list = list.filter(e => e.domain_name === domainFilter);
        if (moduleFilter) list = list.filter(e => e.module_name === moduleFilter);
        return list.map(e => ({
            value: e.entity_code,
            label: isRtl ? e.name_fa : e.name_en
        }));
    }, [systemEntities, domainFilter, moduleFilter, isRtl]);

    const builderTabs = [
        { id: 'base', label: t('تنظیمات پایه', 'Base Settings'), icon: Settings2 },
        { id: 'process', label: t('طراحی فرآیند (BPMN)', 'Process Designer (BPMN)'), icon: GitMerge }
    ];

    if (!editingDef) return null;

    const selectedNode = selectedElement?.type === 'node' ? editingDef.bpmn_data.nodes.find(n => n.id === selectedElement.id) : null;
    const selectedFlow = selectedElement?.type === 'flow' ? editingDef.bpmn_data.flows.find(f => f.id === selectedElement.id) : null;

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

                <div className="flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-900/20 flex flex-col relative">
                    {activeTab === 'base' && (
                        <div className="p-6 overflow-y-auto custom-scrollbar w-full h-full">
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 h-full">
                                
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                    <h3 className="text-[13px] font-black text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 pb-2 mb-2">{t('موجودیت هدف', 'Target Entity')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <SelectField label={t('حوزه سیستمی', 'Domain')} value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setModuleFilter(''); setEditingDef({...editingDef, entity_type: ''}); }} options={[{value: '', label: t('همه حوزه‌ها...', 'All Domains...')}, ...uniqueDomains]} isRtl={isRtl} size="md" />
                                        <SelectField label={t('ماژول', 'Module')} value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setEditingDef({...editingDef, entity_type: ''}); }} options={[{value: '', label: t('همه ماژول‌ها...', 'All Modules...')}, ...uniqueModules]} isRtl={isRtl} size="md" disabled={!domainFilter && uniqueModules.length === 0} />
                                        <SelectField label={t('موجودیت سیستمی', 'Entity')} value={editingDef.entity_type} onChange={(e) => setEditingDef({...editingDef, entity_type: e.target.value})} options={[{value: '', label: t('انتخاب موجودیت...', 'Select Entity...')}, ...filteredEntities]} isRtl={isRtl} required size="md" />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                    <h3 className="text-[13px] font-black text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 pb-2 mb-2">{t('اطلاعات و تنظیمات گردش کار', 'Workflow Configuration')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="lg:col-span-2">
                                            <TextField label={t('عنوان گردش کار', 'Workflow Title')} value={editingDef.title} onChange={(e) => setEditingDef({...editingDef, title: e.target.value})} isRtl={isRtl} required size="md" />
                                        </div>
                                        <TextField label={t('ورژن', 'Version')} value={`v${editingDef.version || 1}.0`} isRtl={isRtl} disabled size="md" />
                                        <div className="flex items-end pb-1"><ToggleField label={t('وضعیت فعال بودن', 'Active Status')} checked={editingDef.is_active} onChange={(val) => setEditingDef({...editingDef, is_active: val})} isRtl={isRtl} /></div>
                                        
                                        <TextField label={t('فیلد فاکتور (شرط شروع)', 'Factor Field (Condition)')} value={editingDef.factor_field || ''} onChange={(e) => setEditingDef({...editingDef, factor_field: e.target.value})} isRtl={isRtl} size="md" placeholder={t('مثلا: loan_type', 'e.g. loan_type')} />
                                        <TextField label={t('مقدار فاکتور', 'Factor Value')} value={editingDef.factor_value || ''} onChange={(e) => setEditingDef({...editingDef, factor_value: e.target.value})} isRtl={isRtl} size="md" placeholder={t('مثلا: فرزندآوری', 'e.g. Childbirth')} />
                                        
                                        <DatePicker label={t('تاریخ موثر شروع', 'Effective Start Date')} value={editingDef.effective_start_date || ''} onChange={(val) => setEditingDef({...editingDef, effective_start_date: val})} isRtl={isRtl} language={language} size="md" />
                                        <DatePicker label={t('تاریخ موثر پایان', 'Effective End Date')} value={editingDef.effective_end_date || ''} onChange={(val) => setEditingDef({...editingDef, effective_end_date: val})} isRtl={isRtl} language={language} size="md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'process' && (
                        <div className="flex flex-1 min-h-0 animate-in fade-in">
                            <div className={`w-80 shrink-0 bg-white dark:bg-slate-800 border-${isRtl ? 'l' : 'r'} border-slate-200 dark:border-slate-700 flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10`}>
                                <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('ابزارهای طراحی', 'Design Tools')}</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" icon={CheckSquare} onClick={() => addNode('USER_TASK')} className="!text-[10px] justify-start bg-white">{t('فعالیت', 'Task')}</Button>
                                        <Button variant="outline" size="sm" icon={Diamond} onClick={() => addNode('EXCLUSIVE_GATEWAY')} className="!text-[10px] justify-start bg-white">{t('دروازه', 'Gateway')}</Button>
                                        <Button variant="outline" size="sm" icon={StopCircle} onClick={() => addNode('END_EVENT')} className="!text-[10px] justify-start bg-white">{t('پایان', 'End')}</Button>
                                        <Button variant="outline" size="sm" icon={ArrowRightLeft} onClick={addFlow} className="!text-[10px] justify-start bg-white text-indigo-600 border-indigo-200">{t('مسیر انتقال', 'Flow')}</Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 px-1 mb-1">
                                            <Layers size={14} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{t('گره‌های فرآیند', 'Process Nodes')}</span>
                                        </div>
                                        {editingDef.bpmn_data.nodes.map(node => (
                                            <div key={node.id} onClick={() => setSelectedElement({ type: 'node', id: node.id })} className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedElement?.id === node.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 hover:shadow-sm'}`}>
                                                <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">{getNodeIcon(node.type)}</div>
                                                <span className={`text-[11px] truncate flex-1 ${selectedElement?.id === node.id ? 'font-black text-indigo-700 dark:text-indigo-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>{node.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-1.5 px-1 mb-1">
                                            <GitMerge size={14} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{t('مسیرهای انتقال', 'Sequence Flows')}</span>
                                        </div>
                                        {editingDef.bpmn_data.flows.length === 0 && <span className="text-[10px] text-slate-400 px-2 italic">{t('مسیری تعریف نشده', 'No flows defined')}</span>}
                                        {editingDef.bpmn_data.flows.map(flow => (
                                            <div key={flow.id} onClick={() => setSelectedElement({ type: 'flow', id: flow.id })} className={`flex flex-col gap-1 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedElement?.id === flow.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 hover:shadow-sm'}`}>
                                                <span className={`text-[11px] truncate ${selectedElement?.id === flow.id ? 'font-black text-indigo-700 dark:text-indigo-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>{flow.name || t('بدون نام', 'Unnamed')}</span>
                                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                                                    <span className="truncate max-w-[80px]">{getNodeName(flow.sourceRef) || '?'}</span>
                                                    {isRtl ? <ArrowLeft size={10} className="text-slate-300"/> : <ArrowRight size={10} className="text-slate-300"/>}
                                                    <span className="truncate max-w-[80px]">{getNodeName(flow.targetRef) || '?'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar flex items-start justify-center">
                                {!selectedElement ? (
                                    <div className="flex flex-col items-center justify-center text-center max-w-sm mt-20 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
                                        <ListTree size={40} className="text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1.5} />
                                        <h4 className="text-[14px] font-black text-slate-700 dark:text-slate-200">{t('تنظیمات اجزای فرآیند', 'Process Element Settings')}</h4>
                                        <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">{t('برای مشاهده و ویرایش جزئیات، یکی از گره‌ها یا مسیرها را از منوی سمت راست انتخاب کنید.', 'Select a node or flow from the sidebar to view and edit its details.')}</p>
                                    </div>
                                ) : selectedNode ? (
                                    <div className="w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    {getNodeIcon(selectedNode.type)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-slate-100">{t('تنظیمات گره', 'Node Settings')}</span>
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selectedNode.type}</span>
                                                </div>
                                            </div>
                                            {selectedNode.type !== 'START_EVENT' && (
                                                <button onClick={() => deleteElement('node', selectedNode.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-transparent hover:border-rose-200">
                                                    <Trash2 size={16} strokeWidth={2.5}/>
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col gap-5">
                                            <TextField label={t('عنوان نمایشی گره', 'Node Display Name')} value={selectedNode.name} onChange={(e) => updateElement('node', selectedNode.id, 'name', e.target.value)} isRtl={isRtl} required size="md" />
                                            
                                            {selectedNode.type === 'USER_TASK' && (
                                                <div className="flex flex-col gap-5 pt-5 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in">
                                                    <SelectField label={t('نوع فعالیت کاربر', 'User Task Type')} value={selectedNode.task_type || 'APPROVAL'} onChange={(e) => updateElement('node', selectedNode.id, 'task_type', e.target.value)} options={[
                                                        {value: 'APPROVAL', label: t('بررسی و تایید/رد', 'Review & Approve/Reject')},
                                                        {value: 'DATA_ENTRY', label: t('تکمیل اطلاعات فرم', 'Form Data Entry')}
                                                    ]} isRtl={isRtl} size="md" />
                                                    
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Users size={14} className="text-amber-500"/> {t('نقش‌ها/کاربران مجاز برای این کار', 'Assignee Roles/Users')}</span>
                                                        <input type="text" value={selectedNode.assignee_roles || ''} onChange={(e) => updateElement('node', selectedNode.id, 'assignee_roles', e.target.value)} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400" placeholder={t('مثلا: مدیر مالی, کارشناس فروش', 'e.g. Finance Manager')} />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Database size={14} className="text-emerald-500"/> {t('فیلدهای فرم که در این مرحله باید تغییر کنند (اجباری)', 'Required Fields to Update')}</span>
                                                        <input type="text" value={selectedNode.required_fields || ''} onChange={(e) => updateElement('node', selectedNode.id, 'required_fields', e.target.value)} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400" placeholder={t('شناسه فیلدها با کاما (مثلا: amount, description)', 'Field IDs (e.g. amount, description)')} />
                                                        <span className="text-[9px] text-slate-400 font-bold px-1">{t('در صورتی که نوع فعالیت "تکمیل اطلاعات" باشد، کاربر مجبور به پر کردن این فیلدها خواهد بود.', 'If Data Entry, user must fill these fields.')}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedNode.type === 'EXCLUSIVE_GATEWAY' && (
                                                <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3 mt-2">
                                                    <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                                    <span className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed font-bold">
                                                        {t('دروازه شرطی (Gateway) برای انشعاب مسیرها بر اساس شروط خاص استفاده می‌شود. برای تعریف شروط، مسیرهای خروجی از این گره را انتخاب کرده و شرط آنها را بنویسید.', 'Exclusive Gateway branches paths based on conditions. Select the outgoing flows from this node to define the conditions.')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : selectedFlow ? (
                                    <div className="w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-indigo-500">
                                                    <ArrowRightLeft size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-slate-100">{t('تنظیمات مسیر انتقال', 'Sequence Flow Settings')}</span>
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">SEQUENCE_FLOW</span>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteElement('flow', selectedFlow.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-transparent hover:border-rose-200">
                                                <Trash2 size={16} strokeWidth={2.5}/>
                                            </button>
                                        </div>
                                        <div className="p-6 flex flex-col gap-6">
                                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('گره مبدا', 'Source Node')}</span>
                                                    <select value={selectedFlow.sourceRef} onChange={(e) => updateElement('flow', selectedFlow.id, 'sourceRef', e.target.value)} className="w-full text-[12px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg h-10 px-2 outline-none text-slate-700 dark:text-slate-200 focus:border-indigo-400 shadow-sm">
                                                        <option value="">{t('انتخاب گره مبدا...', 'Select Source...')}</option>
                                                        {editingDef.bpmn_data.nodes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="text-slate-300 dark:text-slate-600 mt-5">{isRtl ? <ArrowLeft size={20} strokeWidth={2.5}/> : <ArrowRight size={20} strokeWidth={2.5}/>}</div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('گره مقصد', 'Target Node')}</span>
                                                    <select value={selectedFlow.targetRef} onChange={(e) => updateElement('flow', selectedFlow.id, 'targetRef', e.target.value)} className="w-full text-[12px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg h-10 px-2 outline-none text-slate-700 dark:text-slate-200 focus:border-indigo-400 shadow-sm">
                                                        <option value="">{t('انتخاب گره مقصد...', 'Select Target...')}</option>
                                                        {editingDef.bpmn_data.nodes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <TextField label={t('عنوان دکمه/مسیر (جهت نمایش به کاربر)', 'Flow/Button Label')} value={selectedFlow.name} onChange={(e) => updateElement('flow', selectedFlow.id, 'name', e.target.value)} isRtl={isRtl} required size="md" />

                                            {selectedFlow.sourceRef && editingDef.bpmn_data.nodes.find(n => n.id === selectedFlow.sourceRef)?.type === 'EXCLUSIVE_GATEWAY' && (
                                                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in">
                                                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5"><Diamond size={14}/> {t('شرط عبور از دروازه (Expression)', 'Gateway Condition')}</span>
                                                    <input type="text" value={selectedFlow.condition || ''} onChange={(e) => updateElement('flow', selectedFlow.id, 'condition', e.target.value)} className="w-full h-10 px-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg text-[12px] font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400" placeholder={t('مثلا: amount > 50000', 'e.g. amount > 50000')} dir="ltr" />
                                                    <span className="text-[9px] text-slate-400 font-bold px-1">{t('در صورتی که این شرط برقرار باشد، سیستم این مسیر را انتخاب می‌کند.', 'If this condition evaluates to true, this path is taken.')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
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