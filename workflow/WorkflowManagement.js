/* Filename: workflow/WorkflowManagement.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useCallback } = React;
  
  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const { 
    GitMerge = FallbackIcon, Plus = FallbackIcon, Edit = FallbackIcon, Trash2 = FallbackIcon, 
    RefreshCw = FallbackIcon, Database = FallbackIcon
  } = LucideIcons;

  const WorkflowManagement = ({ language = 'fa' }) => {
    const FallbackComponent = () => null;
    const Core = window.DSCore || window.DesignSystem || {};
    const { 
      Button = FallbackComponent, PageHeader = FallbackComponent, Badge = FallbackComponent
    } = Core;
    
    const Grid = window.DSGrid || window.DesignSystem || {};
    const { DataGrid = FallbackComponent } = Grid;
    
    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Toast = FallbackComponent, Dialog = FallbackComponent } = Feedback;

    const isRtl = language === 'fa';
    const t = (fa, en) => isRtl ? fa : en;

    const supabase = window.supabase;

    const [viewMode, setViewMode] = useState('list'); // 'list' | 'design'
    const [definitions, setDefinitions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
    const [activeDef, setActiveDef] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

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
      if (viewMode === 'list') {
          fetchDefinitions();
      }
    }, [viewMode]);

    const handleNewWorkflow = () => {
        setActiveDef(null);
        setViewMode('design');
    };

    const handleEditWorkflow = (def) => {
        setActiveDef(def);
        setViewMode('design');
    };

    const handleDesignBack = (shouldRefresh) => {
        setViewMode('list');
        if (shouldRefresh) {
            fetchDefinitions();
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

    if (viewMode === 'design') {
        const Designer = window.WorkflowDesign;
        if (!Designer) {
            return (
                <div className="p-8 text-center text-rose-500 font-bold font-sans">
                    {t('خطا: کامپوننت WorkflowDesign یافت نشد.', 'Error: WorkflowDesign component not found.')}
                </div>
            );
        }
        return <Designer definition={activeDef} onBack={handleDesignBack} language={language} />;
    }

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader 
          title={t('مدیریت گردش کارها (BPMS)', 'Workflow Management (BPMS)')}
          icon={GitMerge} language={language}
          breadcrumbs={[{ label: t('عملیات سیستم', 'System Operations') }, { label: t('گردش کارها', 'Workflows') }]}
        >
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDefinitions} className="shadow-sm bg-white dark:bg-slate-800">
                    {t('بروزرسانی', 'Refresh')}
                </Button>
                <Button variant="primary" size="sm" icon={Plus} onClick={handleNewWorkflow} className="shadow-sm">
                    {t('طراحی گردش کار جدید', 'Design New Workflow')}
                </Button>
            </div>
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
                        { icon: Edit, tooltip: t('ویرایش و طراحی', 'Edit & Design'), onClick: (row) => handleEditWorkflow(row), className: 'text-slate-400 hover:text-indigo-600' },
                        { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => setDeleteConfirm(row.id), className: 'text-slate-400 hover:text-red-600' }
                    ]}
                />
            )}
        </div>

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