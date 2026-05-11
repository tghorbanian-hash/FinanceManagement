/* Filename: workflow/WorkflowDesign.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    GitMerge = FallbackIcon, Save = FallbackIcon, 
    PlayCircle = FallbackIcon, StopCircle = FallbackIcon, CheckSquare = FallbackIcon, Diamond = FallbackIcon,
    ArrowLeft = FallbackIcon, ArrowRight = FallbackIcon, Settings2 = FallbackIcon, 
    Trash2 = FallbackIcon, Layers = FallbackIcon
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
    const [activeTab, setActiveTab] = useState('process');
    const [editingDef, setEditingDef] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedElement, setSelectedElement] = useState(null);

    const [domainFilter, setDomainFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');

    const canvasRef = useRef(null);
    const [draggingNode, setDraggingNode] = useState(null);
    const [connectingStart, setConnectingStart] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
                factor_operator: '=',
                factor_value: '',
                effective_start_date: '',
                effective_end_date: '',
                bpmn_data: {
                    nodes: [
                        { id: `start_${generateId()}`, type: 'START_EVENT', name: t('شروع', 'Start'), position: { x: 100, y: 300 } }
                    ],
                    flows: []
                }
            });
            setDomainFilter('');
            setModuleFilter('');
        }
    }, [definition?.id, systemEntities.length]); 

    const handleSaveDefinition = async () => {
        try {
            setIsSaving(true);
            if (!editingDef.title || !editingDef.entity_type) {
                showToast(t('لطفاً در تب تنظیمات پایه، عنوان و موجودیت را مشخص کنید.', 'Please provide title and entity type in base settings.'), 'error');
                setIsSaving(false);
                return;
            }

            const payload = {
                title: editingDef.title,
                entity_type: editingDef.entity_type,
                is_active: editingDef.is_active,
                factor_field: editingDef.factor_field,
                factor_operator: editingDef.factor_operator || '=',
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

    const operatorOptions = [
        {value: '=', label: '='}, {value: '!=', label: '!='}, {value: '>', label: '>'},
        {value: '<', label: '<'}, {value: '>=', label: '>='}, {value: '<=', label: '<='},
        {value: 'IN', label: 'IN (...)'}, {value: 'NOT IN', label: 'NOT IN (...)'}
    ];

    const builderTabs = [
        { id: 'process', label: t('طراحی فرآیند (Visual)', 'Process Designer'), icon: GitMerge },
        { id: 'base', label: t('تنظیمات پایه و شروط', 'Base Settings & Rules'), icon: Settings2 }
    ];

    const addNodeToCanvas = (type, x, y) => {
        let name = '';
        if (type === 'USER_TASK') name = t('فعالیت جدید', 'New Task');
        if (type === 'EXCLUSIVE_GATEWAY') name = t('دروازه شرطی', 'Gateway');
        if (type === 'END_EVENT') name = t('پایان', 'End');
        if (type === 'START_EVENT') name = t('شروع', 'Start');
        
        const newNode = { id: `node_${generateId()}`, type, name, position: { x, y } };
        setEditingDef(prev => ({ ...prev, bpmn_data: { ...prev.bpmn_data, nodes: [...prev.bpmn_data.nodes, newNode] } }));
        setSelectedElement({ type: 'node', id: newNode.id });
    };

    const addFlow = (sourceRef, targetRef) => {
        if (sourceRef === targetRef) return;
        const exists = editingDef.bpmn_data.flows.find(f => f.sourceRef === sourceRef && f.targetRef === targetRef);
        if (exists) return;

        const newFlow = { id: `flow_${generateId()}`, sourceRef, targetRef, name: '', condition: '', action_label: '' };
        setEditingDef(prev => ({ ...prev, bpmn_data: { ...prev.bpmn_data, flows: [...prev.bpmn_data.flows, newFlow] } }));
        setSelectedElement({ type: 'flow', id: newFlow.id });
    };

    const deleteSelected = () => {
        if (!selectedElement) return;
        if (selectedElement.type === 'node') {
            setEditingDef(prev => ({
                ...prev,
                bpmn_data: {
                    nodes: prev.bpmn_data.nodes.filter(n => n.id !== selectedElement.id),
                    flows: prev.bpmn_data.flows.filter(f => f.sourceRef !== selectedElement.id && f.targetRef !== selectedElement.id)
                }
            }));
        } else {
            setEditingDef(prev => ({
                ...prev,
                bpmn_data: {
                    ...prev.bpmn_data,
                    flows: prev.bpmn_data.flows.filter(f => f.id !== selectedElement.id)
                }
            }));
        }
        setSelectedElement(null);
    };

    const updateSelectedNodeName = (name) => {
        if (!selectedElement || selectedElement.type !== 'node') return;
        setEditingDef(prev => ({
            ...prev,
            bpmn_data: {
                ...prev.bpmn_data,
                nodes: prev.bpmn_data.nodes.map(n => n.id === selectedElement.id ? { ...n, name } : n)
            }
        }));
    };

    const handleCanvasDragOver = (e) => e.preventDefault();

    const handleCanvasDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType');
        if (!type || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addNodeToCanvas(type, x, y);
    };

    const handleCanvasMouseMove = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (draggingNode) {
            setEditingDef(prev => ({
                ...prev,
                bpmn_data: {
                    ...prev.bpmn_data,
                    nodes: prev.bpmn_data.nodes.map(n => n.id === draggingNode ? { ...n, position: { x, y } } : n)
                }
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
        setConnectingStart(null);
    };

    const getNodeStyle = (type) => {
        if (type === 'START_EVENT') return 'w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-400 text-emerald-600';
        if (type === 'END_EVENT') return 'w-12 h-12 rounded-full bg-rose-50 border-4 border-rose-400 text-rose-600';
        if (type === 'EXCLUSIVE_GATEWAY') return 'w-14 h-14 bg-amber-50 border-2 border-amber-400 text-amber-600 rotate-45';
        return 'w-32 h-16 rounded-xl bg-white border-2 border-indigo-400 text-indigo-700 shadow-sm';
    };

    if (!editingDef) return null;

    const selectedNode = selectedElement?.type === 'node' ? editingDef.bpmn_data.nodes.find(n => n.id === selectedElement.id) : null;

    return (
      <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 font-sans animate-in fade-in zoom-in-95 duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={editingDef.id ? t('ویرایش و طراحی گردش کار', 'Edit Workflow Design') : t('طراحی گردش کار جدید', 'Design New Workflow')}
          icon={GitMerge} language={language}
          breadcrumbs={[{ label: t('مدیریت گردش کارها', 'Workflow Management') }, { label: t('محیط طراح', 'Designer') }]}
        >
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={isRtl ? ArrowRight : ArrowLeft} onClick={() => onBack(false)} className="shadow-sm bg-white dark:bg-slate-800">
                    {t('بازگشت', 'Back')}
                </Button>
                <Button variant="primary" size="sm" icon={Save} onClick={handleSaveDefinition} disabled={isSaving} className="shadow-sm px-6">
                    {isSaving ? t('در حال ذخیره...', 'Saving...') : t('ذخیره گردش کار', 'Save Workflow')}
                </Button>
            </div>
        </PageHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4 mt-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
                    <Tabs tabs={builderTabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 flex relative">
                    
                    {activeTab === 'base' && (
                        <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
                            <div className="w-full flex flex-col gap-4 animate-in fade-in">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 w-full">
                                    <h3 className="text-[12px] font-black text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 pb-2">{t('موجودیت هدف', 'Target Entity')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        <SelectField label={t('حوزه سیستمی', 'Domain')} value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setModuleFilter(''); setEditingDef({...editingDef, entity_type: ''}); }} options={[{value: '', label: t('همه حوزه‌ها...', 'All Domains...')}, ...uniqueDomains]} isRtl={isRtl} size="sm" />
                                        <SelectField label={t('ماژول', 'Module')} value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setEditingDef({...editingDef, entity_type: ''}); }} options={[{value: '', label: t('همه ماژول‌ها...', 'All Modules...')}, ...uniqueModules]} isRtl={isRtl} size="sm" disabled={!domainFilter && uniqueModules.length === 0} />
                                        <div className="lg:col-span-2">
                                            <SelectField label={t('موجودیت سیستمی', 'Entity')} value={editingDef.entity_type} onChange={(e) => setEditingDef({...editingDef, entity_type: e.target.value})} options={[{value: '', label: t('انتخاب موجودیت...', 'Select Entity...')}, ...filteredEntities]} isRtl={isRtl} required size="sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 w-full">
                                    <h3 className="text-[12px] font-black text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 pb-2">{t('تنظیمات گردش کار', 'Workflow Config')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div className="lg:col-span-2">
                                            <TextField label={t('عنوان گردش کار', 'Workflow Title')} value={editingDef.title} onChange={(e) => setEditingDef({...editingDef, title: e.target.value})} isRtl={isRtl} required size="sm" />
                                        </div>
                                        <TextField label={t('ورژن', 'Version')} value={`v${editingDef.version || 1}.0`} isRtl={isRtl} disabled size="sm" />
                                        <DatePicker label={t('تاریخ شروع', 'Start Date')} value={editingDef.effective_start_date || ''} onChange={(val) => setEditingDef({...editingDef, effective_start_date: val})} isRtl={isRtl} language={language} size="sm" />
                                        <DatePicker label={t('تاریخ پایان', 'End Date')} value={editingDef.effective_end_date || ''} onChange={(val) => setEditingDef({...editingDef, effective_end_date: val})} isRtl={isRtl} language={language} size="sm" />
                                        <div className="flex items-center mt-6 px-2">
                                            <ToggleField label={t('فعال در سیستم', 'Active in System')} checked={editingDef.is_active} onChange={(val) => setEditingDef({...editingDef, is_active: val})} isRtl={isRtl} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 w-full">
                                    <div className="flex flex-col border-b border-slate-100 dark:border-slate-700/50 pb-2">
                                        <h3 className="text-[12px] font-black text-slate-700 dark:text-slate-200">{t('شروط شروع (فاکتورها)', 'Start Condition (Factors)')}</h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t('در صورت تنظیم، گردش کار فقط برای رکوردهایی اعمال می‌شود که این شرط را برآورده کنند.', 'If set, applies only to records matching this condition.')}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        <div className="lg:col-span-2">
                                            <TextField label={t('نام فیلد (مثلا: loan_type)', 'Field Name')} value={editingDef.factor_field || ''} onChange={(e) => setEditingDef({...editingDef, factor_field: e.target.value})} isRtl={isRtl} size="sm" />
                                        </div>
                                        <SelectField label={t('عملگر', 'Operator')} value={editingDef.factor_operator || '='} onChange={(e) => setEditingDef({...editingDef, factor_operator: e.target.value})} isRtl={isRtl} size="sm" options={operatorOptions} />
                                        <div className="lg:col-span-2">
                                            <TextField label={t('مقدار', 'Value')} value={editingDef.factor_value || ''} onChange={(e) => setEditingDef({...editingDef, factor_value: e.target.value})} isRtl={isRtl} size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'process' && (
                        <>
                            {/* Palette Sidebar */}
                            <div className={`w-16 shrink-0 bg-white dark:bg-slate-800 border-${isRtl ? 'l' : 'r'} border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 gap-4 z-20 shadow-sm`}>
                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 [writing-mode:vertical-rl] rotate-180 mb-2">{t('ابزارها', 'Tools')}</div>
                                
                                <div draggable onDragStart={(e) => e.dataTransfer.setData('nodeType', 'START_EVENT')} className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-50 flex items-center justify-center cursor-grab hover:shadow-md transition-shadow text-emerald-500" title={t('گره شروع', 'Start Event')}>
                                    <PlayCircle size={20} />
                                </div>
                                <div draggable onDragStart={(e) => e.dataTransfer.setData('nodeType', 'USER_TASK')} className="w-10 h-10 rounded-xl border-2 border-indigo-400 bg-white flex items-center justify-center cursor-grab hover:shadow-md transition-shadow text-indigo-500" title={t('فعالیت', 'Task')}>
                                    <CheckSquare size={18} />
                                </div>
                                <div draggable onDragStart={(e) => e.dataTransfer.setData('nodeType', 'EXCLUSIVE_GATEWAY')} className="w-10 h-10 border-2 border-amber-400 bg-amber-50 flex items-center justify-center cursor-grab hover:shadow-md transition-shadow text-amber-500 rotate-45" title={t('دروازه شرطی', 'Gateway')}>
                                    <Diamond size={18} className="-rotate-45" />
                                </div>
                                <div draggable onDragStart={(e) => e.dataTransfer.setData('nodeType', 'END_EVENT')} className="w-10 h-10 rounded-full border-4 border-rose-400 bg-rose-50 flex items-center justify-center cursor-grab hover:shadow-md transition-shadow text-rose-500" title={t('گره پایان', 'End Event')}>
                                    <StopCircle size={18} />
                                </div>
                            </div>

                            {/* Canvas Area */}
                            <div 
                                className="flex-1 relative overflow-hidden outline-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]"
                                ref={canvasRef}
                                onDragOver={handleCanvasDragOver}
                                onDrop={handleCanvasDrop}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                onClick={() => setSelectedElement(null)}
                                dir="ltr" /* Force LTR for precise mouse math */
                            >
                                {/* SVG Layer for edges */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                        </marker>
                                        <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                                        </marker>
                                    </defs>
                                    
                                    {editingDef.bpmn_data.flows.map(flow => {
                                        const sourceNode = editingDef.bpmn_data.nodes.find(n => n.id === flow.sourceRef);
                                        const targetNode = editingDef.bpmn_data.nodes.find(n => n.id === flow.targetRef);
                                        if (!sourceNode || !targetNode) return null;
                                        
                                        const isSelected = selectedElement?.id === flow.id;
                                        const d = `M ${sourceNode.position.x} ${sourceNode.position.y} L ${targetNode.position.x} ${targetNode.position.y}`;
                                        
                                        return (
                                            <g key={flow.id} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'flow', id: flow.id }); }}>
                                                <path d={d} stroke="transparent" strokeWidth="15" fill="none" />
                                                <path 
                                                    d={d} 
                                                    stroke={isSelected ? '#6366f1' : '#64748b'} 
                                                    strokeWidth={isSelected ? "3" : "2"} 
                                                    fill="none" 
                                                    markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                                                    className="transition-all"
                                                />
                                            </g>
                                        );
                                    })}
                                    
                                    {connectingStart && (
                                        <path 
                                            d={`M ${editingDef.bpmn_data.nodes.find(n=>n.id===connectingStart)?.position.x} ${editingDef.bpmn_data.nodes.find(n=>n.id===connectingStart)?.position.y} L ${mousePos.x} ${mousePos.y}`} 
                                            stroke="#94a3b8" 
                                            strokeWidth="2" 
                                            strokeDasharray="5,5" 
                                            fill="none" 
                                        />
                                    )}
                                </svg>

                                {/* Nodes Layer */}
                                {editingDef.bpmn_data.nodes.map(node => {
                                    const isSelected = selectedElement?.id === node.id;
                                    const styleClass = getNodeStyle(node.type);
                                    
                                    return (
                                        <div 
                                            key={node.id}
                                            className={`absolute flex items-center justify-center flex-col z-10 transition-shadow ${isSelected ? 'ring-4 ring-indigo-500/30' : 'hover:ring-2 ring-slate-300'}`}
                                            style={{ left: node.position.x, top: node.position.y, transform: 'translate(-50%, -50%)' }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'node', id: node.id }); }}
                                            onMouseDown={(e) => {
                                                if (e.target.classList.contains('connector')) return;
                                                e.stopPropagation();
                                                setDraggingNode(node.id);
                                                setSelectedElement({ type: 'node', id: node.id });
                                            }}
                                            onMouseUp={(e) => {
                                                if (connectingStart && connectingStart !== node.id) {
                                                    addFlow(connectingStart, node.id);
                                                }
                                            }}
                                        >
                                            <div className={`${styleClass} flex items-center justify-center relative cursor-move bg-white shadow-sm`}>
                                                {node.type === 'EXCLUSIVE_GATEWAY' ? (
                                                    <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                                                        <Diamond size={20} />
                                                    </div>
                                                ) : (
                                                    <div className="px-2 text-center text-[10px] font-black leading-tight break-words max-w-full overflow-hidden select-none" dir={isRtl ? 'rtl' : 'ltr'}>
                                                        {node.name}
                                                    </div>
                                                )}
                                                
                                                {/* Connection Handle */}
                                                <div 
                                                    className="connector absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                                                    onMouseDown={(e) => { e.stopPropagation(); setConnectingStart(node.id); }}
                                                    style={node.type === 'EXCLUSIVE_GATEWAY' ? { right: '-10px', top: '-10px', transform: 'none' } : {}}
                                                />
                                            </div>
                                            
                                            {node.type === 'EXCLUSIVE_GATEWAY' && (
                                                <div className="absolute top-full mt-2 text-[10px] font-black bg-white/80 px-2 py-0.5 rounded shadow-sm border border-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                                    {node.name}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mini Settings Panel overlay */}
                            {selectedElement && (
                                <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-4`}>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                            <Layers size={14} className="text-indigo-500"/>
                                            {selectedElement.type === 'node' ? t('تنظیمات گره', 'Node Settings') : t('تنظیمات مسیر', 'Flow Settings')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={deleteSelected} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14}/></button>
                                            <button onClick={() => setSelectedElement(null)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><X size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col gap-4">
                                        {selectedElement.type === 'node' && selectedNode ? (
                                            <>
                                                <TextField label={t('عنوان نمایشی', 'Display Name')} value={selectedNode.name} onChange={(e) => updateSelectedNodeName(e.target.value)} isRtl={isRtl} size="sm" />
                                                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">{t('تنظیمات پیشرفته (قوانین، فیلدها و فرم‌ها) در مراحل بعدی توسعه اضافه خواهد شد.', 'Advanced settings (rules, fields, forms) will be added in next phases.')}</div>
                                            </>
                                        ) : selectedFlow ? (
                                            <div className="text-[11px] text-slate-500 text-center py-4">{t('مسیر انتقال انتخاب شد.', 'Sequence Flow selected.')}</div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </>
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