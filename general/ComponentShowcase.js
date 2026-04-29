/* Filename: general/ComponentShowcase.js */
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Trash2, Paperclip, Printer, Table, BoxSelect, Search, Save, Mail, User, LayoutGrid, FileText, ChevronRight, ChevronLeft, Check, Copy, Plus, Settings, X, FileSpreadsheet, FileDown, Layers, ListTree } from 'lucide-react';

const ComponentShowcase = ({ language = 'fa' }) => {
  const { DataGrid, Button, TextField, SelectField, ToggleField, CheckboxField, LOVField, Card, Badge, PageHeader, AdvancedFilter, Modal, AttachmentManager, Tabs, Tree, TreeGrid } = window.DesignSystem || {};
  const isRtl = language === 'fa';
  const t = (fa, en) => isRtl ? fa : en;

  const [activeShowcaseTab, setActiveShowcaseTab] = useState('tree');
  const [currentView, setCurrentView] = useState('list'); 
  const [mockData, setMockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [selectedRow, setSelectedRow] = useState(null);
  const [lineItems, setLineItems] = useState([]); 
  const [editingLineItemId, setEditingLineItemId] = useState(null);
  const [editingLineData, setEditingLineData] = useState(null);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tree Showcase State
  const [treeMode, setTreeMode] = useState('standard'); // 'standard' or 'grid'
  const [treeData, setTreeData] = useState([
    { id: 1, parentId: null, code: '1', title: 'دارایی‌ها', nature: 'بدهکار' },
    { id: 2, parentId: 1, code: '11', title: 'دارایی‌های جاری', nature: 'بدهکار' },
    { id: 3, parentId: 2, code: '1101', title: 'موجودی نقد و بانک', nature: 'بدهکار' },
    { id: 4, parentId: 2, code: '1102', title: 'حساب‌های دریافتنی', nature: 'بدهکار' },
    { id: 5, parentId: 1, code: '12', title: 'دارایی‌های غیرجاری', nature: 'بدهکار' },
    { id: 6, parentId: null, code: '2', title: 'بدهی‌ها', nature: 'بستانکار' },
    { id: 7, parentId: 6, code: '21', title: 'بدهی‌های جاری', nature: 'بستانکار' },
    { id: 8, parentId: 7, code: '2101', title: 'حساب‌های پرداختنی', nature: 'بستانکار' },
  ]);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(null);
  const [treeFormData, setTreeFormData] = useState({ code: '', title: '', nature: '' });
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [newTargetParentId, setNewTargetParentId] = useState(null);
  const [selectedTreeGridIds, setSelectedTreeGridIds] = useState([]);

  const showcaseTabs = [
    { id: 'grid_form', label: t('امکانات گرید و فرم', 'Grid & Form Features'), icon: Table },
    { id: 'tree', label: t('درخت', 'Tree'), icon: ListTree },
    { id: 'components', label: t('کامپوننت‌های کوچک', 'Small Components'), icon: BoxSelect }
  ];

  const lovDepartments = [
    { code: '101', title: 'مالی', structure: 'معاونت اداری و مالی', isActive: true },
    { code: '102', title: 'فروش', structure: 'معاونت بازرگانی', isActive: true },
    { code: '103', title: 'تدارکات', structure: 'معاونت پشتیبانی', isActive: true },
    { code: '104', title: 'منابع انسانی', structure: 'معاونت اداری و مالی', isActive: false },
    { code: '105', title: 'تولید', structure: 'معاونت کارخانه', isActive: true },
  ];

  const lovAccounts = [
    { code: '1010', title: 'موجودی نقد و بانک', group: 'دارایی جاری' },
    { code: '1020', title: 'حساب‌های دریافتنی', group: 'دارایی جاری' },
    { code: '2010', title: 'حساب‌های پرداختنی', group: 'بدهی جاری' },
    { code: '4010', title: 'درآمد فروش محصول', group: 'درآمدها' },
    { code: '5010', title: 'هزینه حقوق و دستمزد', group: 'هزینه‌ها' },
  ];

  const lovDeptColumns = [
    { field: 'code', header_fa: 'کد', header_en: 'Code', width: '80px', type: 'text' },
    { field: 'title', header_fa: 'عنوان', header_en: 'Title', width: '150px', type: 'text' },
    { field: 'structure', header_fa: 'ساختار مرتبط', header_en: 'Structure', width: '150px', type: 'text' },
    { field: 'isActive', header_fa: 'فعال', header_en: 'Active', width: '80px', type: 'toggle' },
  ];

  const lovAccColumns = [
    { field: 'code', header_fa: 'کد حساب', header_en: 'Code', width: '80px', type: 'text' },
    { field: 'title', header_fa: 'عنوان حساب', header_en: 'Title', width: '200px', type: 'text' },
    { field: 'group', header_fa: 'گروه حساب', header_en: 'Group', width: '150px', type: 'text' },
  ];

  useEffect(() => {
    const data = [];
    const statuses = ['تایید شده', 'در حال بررسی', 'پیش‌نویس', 'رد شده'];
    const types = ['بدهکار', 'بستانکار'];

    for (let i = 1; i <= 100; i++) {
      const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
      const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '/');
      const status = statuses[i % 4];
      data.push({
        id: 1000 + i, 
        docDate: formattedDate, 
        department: lovDepartments[i % 5], 
        description: `بابت خرید/فروش اقلام شماره ${Math.floor(Math.random() * 9000) + 1000} مربوط به پروژه`,
        type: types[i % 2], 
        amount: (Math.floor(Math.random() * 50000) * 1000).toLocaleString(), 
        status: status,
        isActive: i % 2 === 0,
        isControlled: i % 3 === 0,
        isReadOnly: status === 'تایید شده',
        attachments: i % 3 === 0 ? [{ id: 1, name: 'factor.pdf', size: 1024000 }, { id: 2, name: 'receipt.jpg', size: 512000 }] : []
      });
    }
    setMockData(data);
    setFilteredData(data);
  }, []);

  const gridColumns = [
    { field: 'id', header_fa: 'شماره سند', header_en: 'Doc ID', type: 'number', width: '90px' },
    { field: 'isActive', header_fa: 'فعال', header_en: 'Active', type: 'toggle', width: '70px' },
    { field: 'isControlled', header_fa: 'کنترل شده', header_en: 'Controlled', type: 'checkbox', width: '80px' },
    { field: 'docDate', header_fa: 'تاریخ ثبت', header_en: 'Date', type: 'date', width: '100px' },
    { field: 'department', header_fa: 'واحد سازمانی', header_en: 'Department', width: '130px', render: (val) => val?.title },
    { field: 'description', header_fa: 'شرح سند', header_en: 'Description', type: 'text', width: '250px' },
    { field: 'amount', header_fa: 'مبلغ (ریال)', header_en: 'Amount (IRR)', type: 'text', width: '130px' },
    { 
      field: 'status', header_fa: 'وضعیت', header_en: 'Status', type: 'badge', width: '110px',
      badgeColor: (val) => {
        if(val === 'تایید شده') return 'success';
        if(val === 'رد شده') return 'danger';
        if(val === 'در حال بررسی') return 'blue';
        if(val === 'پیش‌نویس') return 'orange';
        return 'gray';
      }
    },
  ];

  const handleOpenForm = (row = null) => {
    setSelectedRow(row || { id: '', docDate: '', department: null, description: '', amount: '', status: 'پیش‌نویس', isActive: true, isControlled: false });
    
    setLineItems(row ? [
      { id: 1, account: lovAccounts[0], costCenter: 'تهران', docDate: row.docDate, debit: row.amount, credit: '0', note: 'بابت فاکتور فروش شماره 1020' },
      { id: 2, account: lovAccounts[3], costCenter: 'مرکزی', docDate: row.docDate, debit: '0', credit: row.amount, note: 'شناسایی درآمد' }
    ] : []);
    
    setEditingLineItemId(null);
    setCurrentView('form');
  };

  const handleSaveForm = () => {
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setCurrentView('list'); }, 1000);
  };

  const handleBulkDelete = (selectedIds) => {
    if (window.confirm(t(`آیا از حذف ${selectedIds.length} مورد انتخاب شده اطمینان دارید؟`, `Are you sure you want to delete ${selectedIds.length} selected items?`))) {
      const updated = mockData.filter(r => !selectedIds.includes(r.id));
      setMockData(updated); setFilteredData(updated);
    }
  };

  const gridActions = [
    { icon: Eye, tooltip: t('مشاهده جزئیات (مودال)', 'View Details'), onClick: (r) => { setSelectedRow(r); setViewModalOpen(true); }, className: 'hover:text-blue-600' },
    { icon: Edit, tooltip: t('ویرایش (ورود به فرم)', 'Edit'), onClick: handleOpenForm, className: 'hover:text-emerald-600' },
    { 
      icon: Paperclip, tooltip: t('ضمائم', 'Attachments'), onClick: (r) => { setSelectedRow(r); setAttachModalOpen(true); }, 
      className: (row) => row.attachments?.length > 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'hover:text-indigo-600' 
    },
    { icon: FileSpreadsheet, tooltip: t('خروجی اکسل', 'Export'), onClick: (row) => alert(`${t('خروجی اکسل', 'Export')} ID: ${row.id}`), className: 'hover:text-emerald-600' },
    { icon: Trash2, tooltip: t('حذف', 'Delete'), onClick: (row) => alert(`${t('حذف', 'Delete')} ID: ${row.id}`), className: 'hover:text-red-600' },
  ];

  const advancedFilterFields = [
    { name: 'id', label: t('شماره سند', 'Doc ID'), type: 'number' },
    { name: 'docDate', label: t('تاریخ سند', 'Date'), type: 'date' },
    { name: 'department', label: t('واحد سازمانی', 'Department'), type: 'lov', lovData: lovDepartments, lovColumns: lovDeptColumns },
    { name: 'status', label: t('وضعیت', 'Status'), type: 'select', options: [{ value: 'تایید شده', label: t('تایید شده', 'Approved') }, { value: 'در حال بررسی', label: t('در حال بررسی', 'In Review') }, { value: 'رد شده', label: t('رد شده', 'Rejected') }]},
  ];

  const handleAdvancedFilter = (values) => {
    let result = [...mockData];
    Object.keys(values).forEach(key => {
      const filterVal = values[key]?.title ? values[key].title.toLowerCase() : values[key]?.toString().toLowerCase();
      if (!filterVal) return;
      result = result.filter(row => {
        const rowVal = row[key]?.title ? row[key].title.toLowerCase() : row[key]?.toString().toLowerCase();
        return rowVal && rowVal.includes(filterVal);
      });
    });
    setFilteredData(result);
  };

  const lineItemColumns = [
    { field: 'id', header_fa: 'ردیف', header_en: 'Row', width: '60px', render: (val, row, idx) => <span className="px-2 font-mono">{idx + 1}</span> },
    { 
      field: 'account', header_fa: 'حساب معین', header_en: 'Account', width: '200px', 
      render: (val, row) => editingLineItemId === row.id 
        ? <LOVField size="sm" displayValue={editingLineData.account?.title} onChange={(r) => setEditingLineData({...editingLineData, account: r})} data={lovAccounts} columns={lovAccColumns} isRtl={isRtl} wrapperClassName="m-0" />
        : val?.title 
    },
    { 
      field: 'costCenter', header_fa: 'مرکز هزینه', header_en: 'Cost Center', width: '130px', 
      render: (val, row) => editingLineItemId === row.id 
        ? <SelectField size="sm" value={editingLineData.costCenter} onChange={(e) => setEditingLineData({...editingLineData, costCenter: e.target.value})} options={[{value:'مرکزی',label:'مرکزی'}, {value:'تهران',label:'تهران'}]} isRtl={isRtl} wrapperClassName="m-0" />
        : val 
    },
    { 
      field: 'docDate', header_fa: 'تاریخ ردیف', header_en: 'Date', width: '120px', type: 'date',
      render: (val, row) => editingLineItemId === row.id 
        ? <TextField size="sm" type="date" value={editingLineData.docDate} onChange={(e) => setEditingLineData({...editingLineData, docDate: e.target.value})} isRtl={isRtl} dir="ltr" wrapperClassName="m-0" />
        : val 
    },
    { 
      field: 'debit', header_fa: 'بدهکار (ریال)', header_en: 'Debit', width: '130px', 
      render: (val, row) => editingLineItemId === row.id 
        ? <TextField size="sm" type="number" value={editingLineData.debit} onChange={(e) => setEditingLineData({...editingLineData, debit: e.target.value})} isRtl={isRtl} dir="ltr" wrapperClassName="m-0" />
        : val 
    },
    { 
      field: 'credit', header_fa: 'بستانکار (ریال)', header_en: 'Credit', width: '130px', 
      render: (val, row) => editingLineItemId === row.id 
        ? <TextField size="sm" type="number" value={editingLineData.credit} onChange={(e) => setEditingLineData({...editingLineData, credit: e.target.value})} isRtl={isRtl} dir="ltr" wrapperClassName="m-0" />
        : val 
    },
    { 
      field: 'note', header_fa: 'شرح ردیف', header_en: 'Line Note', width: '250px', 
      render: (val, row) => editingLineItemId === row.id 
        ? <TextField size="sm" value={editingLineData.note} onChange={(e) => setEditingLineData({...editingLineData, note: e.target.value})} isRtl={isRtl} wrapperClassName="m-0" />
        : val 
    },
  ];

  const handleAddLineItem = () => {
    const newId = Date.now();
    const newRow = { id: newId, account: null, costCenter: '', docDate: selectedRow?.docDate || '', debit: '', credit: '', note: '' };
    setLineItems([newRow, ...lineItems]);
    setEditingLineItemId(newId);
    setEditingLineData(newRow);
  };

  const lineItemActions = [
    { icon: Check, tooltip: t('تایید', 'Save'), hidden: (row) => editingLineItemId !== row.id, onClick: (row) => {
      setLineItems(lineItems.map(item => item.id === editingLineItemId ? editingLineData : item));
      setEditingLineItemId(null);
    }, className: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
    { icon: X, tooltip: t('انصراف', 'Cancel'), hidden: (row) => editingLineItemId !== row.id, onClick: () => setEditingLineItemId(null), className: 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200' },
    
    { icon: Edit, tooltip: t('ویرایش', 'Edit'), hidden: (row) => editingLineItemId === row.id, onClick: (row) => {
      setEditingLineItemId(row.id);
      setEditingLineData({...row});
    }, className: 'hover:text-emerald-600' },
    { icon: Copy, tooltip: t('کپی ردیف', 'Duplicate'), hidden: (row) => editingLineItemId === row.id, onClick: (row, idx) => {
      const newItems = [...lineItems];
      const newId = Date.now();
      newItems.splice(idx + 1, 0, { ...row, id: newId });
      setLineItems(newItems);
      setEditingLineItemId(newId);
      setEditingLineData({ ...row, id: newId });
    }, className: 'hover:text-blue-600' },
    { icon: Trash2, tooltip: t('حذف ردیف', 'Delete'), hidden: (row) => editingLineItemId === row.id, onClick: (row, idx) => setLineItems(lineItems.filter((_, i) => i !== idx)), className: 'hover:text-red-600' },
  ];

  const handleRowReorder = (sourceIdx, destIdx) => {
    const reordered = Array.from(lineItems);
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(destIdx, 0, moved);
    setLineItems(reordered);
  };

  // --- Tree Event Handlers ---
  const handleSelectTreeNode = (node) => {
    setSelectedTreeNodeId(node.id);
    setTreeFormData({ ...node });
    setIsCreatingNode(false);
    setNewTargetParentId(null);
  };

  const handleAddTreeRoot = () => {
    setSelectedTreeNodeId(null);
    setTreeFormData({ code: '', title: '', nature: '' });
    setIsCreatingNode(true);
    setNewTargetParentId(null);
  };

  const handleAddTreeChild = (parentNode) => {
    setSelectedTreeNodeId(parentNode.id); // visually selecting parent
    setTreeFormData({ code: '', title: '', nature: parentNode.nature }); // Default to parent's nature
    setIsCreatingNode(true);
    setNewTargetParentId(parentNode.id);
  };

  const getDescendantIds = (nodes, parentId) => {
    let ids = [];
    const children = nodes.filter(n => n.parentId === parentId);
    children.forEach(child => {
      ids.push(child.id);
      ids = ids.concat(getDescendantIds(nodes, child.id));
    });
    return ids;
  };

  const handleDeleteTreeNode = (node) => {
    const descendants = getDescendantIds(treeData, node.id);
    if (descendants.length > 0) {
      if (!window.confirm(t('این نود دارای زیرمجموعه است. آیا از حذف آن و تمامی زیرمجموعه‌ها اطمینان دارید؟', 'This node has children. Are you sure you want to delete it and all its descendants?'))) return;
    } else {
      if (!window.confirm(t('آیا از حذف این مورد اطمینان دارید؟', 'Are you sure you want to delete this item?'))) return;
    }
    
    const idsToDelete = [node.id, ...descendants];
    const newTreeData = treeData.filter(n => !idsToDelete.includes(n.id));
    setTreeData(newTreeData);
    
    if (selectedTreeNodeId === node.id || idsToDelete.includes(selectedTreeNodeId)) {
      if (node.parentId) {
        const parent = newTreeData.find(n => n.id === node.parentId);
        if (parent) handleSelectTreeNode(parent);
        else { setSelectedTreeNodeId(null); setTreeFormData({}); setIsCreatingNode(false); }
      } else {
        setSelectedTreeNodeId(null); setTreeFormData({}); setIsCreatingNode(false);
      }
    }
  };

  const handleSaveTreeForm = () => {
    if (isCreatingNode) {
      const newNode = { ...treeFormData, id: Date.now(), parentId: newTargetParentId };
      setTreeData([...treeData, newNode]);
      setIsCreatingNode(false);
      handleSelectTreeNode(newNode);
    } else {
      setTreeData(treeData.map(n => n.id === selectedTreeNodeId ? { ...n, ...treeFormData } : n));
    }
  };

  const handleCancelTreeForm = () => {
    if (isCreatingNode) {
      setIsCreatingNode(false);
      if (newTargetParentId) {
        const parent = treeData.find(n => n.id === newTargetParentId);
        if (parent) handleSelectTreeNode(parent);
      } else {
        setSelectedTreeNodeId(null); setTreeFormData({});
      }
    } else {
      const originalNode = treeData.find(n => n.id === selectedTreeNodeId);
      if (originalNode) setTreeFormData({ ...originalNode });
    }
  };

  if (!DataGrid || !Button || !PageHeader || !AdvancedFilter || !Modal || !AttachmentManager || !LOVField || !Tabs || !Tree || !TreeGrid) return <div className="p-8 text-slate-500 font-bold">در حال بارگذاری سیستم طراحی...</div>;

  return (
    <div className="p-6 h-full flex flex-col font-sans bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
      
      <PageHeader 
        title={t('کاتالوگ کامپوننت‌ها (Showcase)', 'Component Showcase')}
        icon={LayoutGrid} language={language}
        breadcrumbs={[{ label: t('میز کار', 'Workspace') }, { label: t('تنظیمات پایه', 'Base Setup') }, { label: t('سیستم طراحی', 'Design System') }]}
      />

      <Tabs tabs={showcaseTabs} activeTab={activeShowcaseTab} onChange={setActiveShowcaseTab} />

      {activeShowcaseTab === 'grid_form' && (
        <>
          {currentView === 'list' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
              <AdvancedFilter fields={advancedFilterFields} onFilter={handleAdvancedFilter} onClear={() => setFilteredData(mockData)} language={language} />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  data={filteredData} 
                  columns={gridColumns} 
                  actions={gridActions} 
                  language={language} 
                  onAdd={() => handleOpenForm()}
                  onRowDoubleClick={handleOpenForm}
                  onDownloadSample={() => alert(t('دانلود نمونه فایل اکسل', 'Download Excel Sample'))}
                  selectable={true}
                  bulkActions={[
                    { label: t('حذف همه انتخاب شده‌ها', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: handleBulkDelete },
                    { label: t('تایید اسناد', 'Approve Selected'), icon: Check, variant: 'outline', onClick: () => alert('Approved') }
                  ]}
                />
              </div>
            </div>
          )}

          {currentView === 'form' && selectedRow && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden min-h-0">
              <Card 
                title={selectedRow.id ? `${t('ویرایش سند حسابداری شماره', 'Edit Document #')} ${selectedRow.id}` : t('ایجاد سند حسابداری جدید', 'Create New Document')}
                noPadding={true}
                className="flex-1 flex flex-col border border-slate-200 shadow-sm min-h-0"
                headerClassName="bg-white border-b-2 border-indigo-100 h-14"
                action={
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" icon={Paperclip} onClick={() => setAttachModalOpen(true)} title={t('ضمائم', 'Attachments')} />
                    <Button size="sm" variant="ghost" icon={Printer} onClick={() => alert('Print Preview')} title={t('چاپ', 'Print')} />
                    <Button size="sm" variant="outline" icon={isRtl ? ChevronRight : ChevronLeft} onClick={() => setCurrentView('list')}>{t('بازگشت', 'Back')}</Button>
                    <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                    <Button size="sm" variant="primary" icon={Save} isLoading={isSubmitting} onClick={handleSaveForm}>{t('ذخیره اطلاعات', 'Save Changes')}</Button>
                  </div>
                }
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/50 min-h-0">
                  <div className="w-full flex flex-col gap-3 h-full">
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 shrink-0">
                      <Card title={t('اطلاعات اصلی', 'General Info')} noPadding className="xl:col-span-2 border border-slate-200 shadow-sm" headerClassName="h-10 bg-white" isCollapsible language={language}>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                          <TextField size="sm" label={t('شماره سند', 'Doc ID')} value={selectedRow.id || 'جدید'} disabled isRtl={isRtl} />
                          <TextField size="sm" label={t('تاریخ ثبت', 'Date')} value={selectedRow.docDate} onChange={(e) => setSelectedRow({...selectedRow, docDate: e.target.value})} isRtl={isRtl} type="date" />
                          <div className="lg:col-span-2">
                            <LOVField size="sm" label={t('واحد سازمانی', 'Department')} displayValue={selectedRow.department?.title} onChange={(row) => setSelectedRow({...selectedRow, department: row})} data={lovDepartments} columns={lovDeptColumns} isRtl={isRtl} />
                          </div>
                          <TextField size="sm" label={t('مبلغ کل (ریال)', 'Amount')} value={selectedRow.amount} onChange={(e) => setSelectedRow({...selectedRow, amount: e.target.value})} isRtl={isRtl} dir="ltr" wrapperClassName="lg:col-span-1" />
                          <TextField size="sm" label={t('شرح سند', 'Description')} value={selectedRow.description} onChange={(e) => setSelectedRow({...selectedRow, description: e.target.value})} isRtl={isRtl} wrapperClassName="lg:col-span-3" />
                        </div>
                      </Card>

                      <Card title={t('تنظیمات عملیاتی', 'Operational Settings')} noPadding className="border border-slate-200 shadow-sm" headerClassName="h-10 bg-white" isCollapsible language={language}>
                        <div className="p-3 flex flex-col gap-4 bg-white h-full justify-center">
                          <ToggleField size="sm" label={t('وضعیت فعال بودن سند در سیستم', 'Document is Active')} checked={selectedRow.isActive} onChange={(val) => setSelectedRow({...selectedRow, isActive: val})} isRtl={isRtl} />
                          <CheckboxField size="sm" label={t('این سند کنترل مضاعف شده است', 'Controlled Document')} checked={selectedRow.isControlled} onChange={(val) => setSelectedRow({...selectedRow, isControlled: val})} isRtl={isRtl} />
                        </div>
                      </Card>
                    </div>

                    <Card 
                      title={t('اقلام سند (Inline Edit)', 'Line Items')} 
                      noPadding className="border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[400px]" headerClassName="h-10 bg-white shrink-0" 
                    >
                      <div className="flex-1 flex flex-col min-h-0">
                        <DataGrid 
                          data={lineItems} 
                          columns={lineItemColumns} 
                          actions={lineItemActions}
                          language={language}
                          selectable={true}
                          rowReorderable={true}
                          onRowReorder={handleRowReorder}
                          onAdd={handleAddLineItem}
                          onDownloadSample={() => alert(t('دانلود نمونه فایل اکسل', 'Download Excel Sample'))}
                          bulkActions={[{ label: t('حذف ردیف‌های انتخاب شده', 'Delete Selected'), icon: Trash2, variant: 'danger-outline', onClick: (ids) => setLineItems(lineItems.filter(l => !ids.includes(l.id))) }]}
                        />
                      </div>
                    </Card>

                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {activeShowcaseTab === 'tree' && (
        <div className="flex-1 flex flex-col animate-in fade-in min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><ListTree size={18}/></div>
              <span className="text-[13px] font-black text-slate-800">{t('مدیریت ساختار سلسله‌مراتبی', 'Hierarchical Structure Management')}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setTreeMode('standard')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-colors ${treeMode === 'standard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('نمایش درختی', 'Tree View')}</button>
              <button onClick={() => setTreeMode('grid')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-colors ${treeMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('نمایش درخت-جدول', 'TreeGrid View')}</button>
            </div>
          </div>

          {treeMode === 'standard' ? (
            <div className="flex-1 flex gap-4 min-h-0">
              <div className="w-1/2 md:w-2/3 h-full min-h-0 shadow-sm">
                <Tree 
                  data={treeData}
                  idField="id" parentField="parentId" displayField="title" secondaryField="code"
                  selectedId={selectedTreeNodeId}
                  onSelect={handleSelectTreeNode}
                  onAddChild={handleAddTreeChild}
                  onAddRoot={handleAddTreeRoot}
                  onDelete={handleDeleteTreeNode}
                  onExport={() => alert(t('خروجی اکسل درخت', 'Export Tree Excel'))}
                  onImport={(file) => alert(`${t('فایل انتخاب شد:', 'File selected:')} ${file.name}`)}
                  onDownloadSample={() => alert(t('دانلود نمونه فایل درخت', 'Download Tree Sample Excel'))}
                  language={language}
                />
              </div>
              <div className="w-1/2 md:w-1/3 h-full min-h-0 flex flex-col">
                <Card 
                  title={isCreatingNode ? (newTargetParentId ? t('ایجاد زیرمجموعه جدید', 'Create New Child') : t('ایجاد ریشه جدید', 'Create New Root')) : (selectedTreeNodeId ? t('ویرایش اطلاعات', 'Edit Information') : t('اطلاعات جزئی', 'Details'))}
                  className="h-full border border-slate-200 shadow-sm"
                  headerClassName="bg-slate-50/80"
                  action={
                    (selectedTreeNodeId || isCreatingNode) && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" icon={Trash2} className="!text-red-500 hover:!bg-red-50" onClick={() => !isCreatingNode && handleDeleteTreeNode(treeData.find(n => n.id === selectedTreeNodeId))} disabled={isCreatingNode} title={t('حذف', 'Delete')}/>
                      </div>
                    )
                  }
                >
                  {(selectedTreeNodeId || isCreatingNode) ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 space-y-4">
                        <TextField size="sm" label={t('کد حساب', 'Account Code')} value={treeFormData.code || ''} onChange={(e) => setTreeFormData({...treeFormData, code: e.target.value})} isRtl={isRtl} required dir="ltr"/>
                        <TextField size="sm" label={t('عنوان حساب', 'Account Title')} value={treeFormData.title || ''} onChange={(e) => setTreeFormData({...treeFormData, title: e.target.value})} isRtl={isRtl} required />
                        <SelectField size="sm" label={t('ماهیت حساب', 'Account Nature')} value={treeFormData.nature || ''} onChange={(e) => setTreeFormData({...treeFormData, nature: e.target.value})} options={[{value:'بدهکار',label:'بدهکار'}, {value:'بستانکار',label:'بستانکار'}]} isRtl={isRtl} />
                        {isCreatingNode && newTargetParentId && (
                          <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800 flex items-center gap-1.5">
                            <Layers size={14}/>
                            <span>{t('در حال ایجاد زیرمجموعه برای:', 'Creating child for:')} <strong>{treeData.find(n => n.id === newTargetParentId)?.title}</strong></span>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                        <Button size="sm" variant="ghost" onClick={handleCancelTreeForm}>{t('لغو', 'Cancel')}</Button>
                        <Button size="sm" variant="primary" icon={Save} onClick={handleSaveTreeForm}>{t('ذخیره تغییرات', 'Save Changes')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 text-[12px] font-medium">
                      <div className="p-3 bg-slate-50 rounded-full"><ListTree size={24} className="text-slate-300"/></div>
                      <span>{t('نودی انتخاب نشده است', 'No node selected')}</span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 shadow-sm border border-slate-200 rounded-lg bg-white p-1">
              <TreeGrid 
                data={treeData}
                idField="id" parentField="parentId"
                columns={[
                  { field: 'title', header_fa: 'عنوان حساب', header_en: 'Title', width: '300px' },
                  { field: 'code', header_fa: 'کد حساب', header_en: 'Code', width: '150px' },
                  { field: 'nature', header_fa: 'ماهیت', header_en: 'Nature', width: '150px', render: (val) => <Badge variant={val === 'بدهکار' ? 'indigo' : 'orange'}>{val}</Badge> }
                ]}
                actions={[
                  { icon: Edit, tooltip: t('ویرایش', 'Edit'), onClick: (row) => { setTreeMode('standard'); handleSelectTreeNode(row); }, className: 'hover:text-emerald-600' }
                ]}
                selectable={true}
                selectedIds={selectedTreeGridIds}
                onSelectChange={setSelectedTreeGridIds}
                onAddChild={(row) => { setTreeMode('standard'); handleAddTreeChild(row); }}
                onAddRoot={() => { setTreeMode('standard'); handleAddTreeRoot(); }}
                onDelete={handleDeleteTreeNode}
                onExport={() => alert(t('خروجی اکسل درخت-جدول', 'Export TreeGrid Excel'))}
                onImport={(file) => alert(`${t('فایل انتخاب شد:', 'File selected:')} ${file.name}`)}
                onDownloadSample={() => alert(t('دانلود نمونه فایل', 'Download Sample Excel'))}
                language={language}
              />
            </div>
          )}
        </div>
      )}

      {activeShowcaseTab === 'components' && (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm border-dashed">
          <span className="text-slate-400 font-bold">{t('محل قرارگیری کامپوننت‌های کوچک...', 'Small components placeholder...')}</span>
        </div>
      )}

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`${t('جزئیات سند حسابداری شماره', 'Document Details #')} ${selectedRow?.id || ''}`} width="max-w-5xl" language={language} showMaximize={true}>
        {selectedRow && (
          <div className="space-y-3 p-4">
            <Card title={t('اطلاعات کلی سند', 'General Information')} noPadding={true} className="border border-slate-200" headerClassName="h-10">
              <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white">
                <TextField size="sm" label={t('شماره سند', 'Doc ID')} value={selectedRow.id} disabled isRtl={isRtl} />
                <TextField size="sm" label={t('تاریخ ثبت', 'Date')} value={selectedRow.docDate} disabled isRtl={isRtl} dir="ltr" />
                <LOVField size="sm" label={t('واحد سازمانی', 'Department')} displayValue={selectedRow.department?.title} disabled data={lovDepartments} columns={lovDeptColumns} isRtl={isRtl} />
                <TextField size="sm" label={t('مبلغ کل (ریال)', 'Amount')} value={selectedRow.amount} disabled isRtl={isRtl} dir="ltr" />
                
                <TextField size="sm" label={t('شرح سند', 'Description')} value={selectedRow.description} disabled isRtl={isRtl} wrapperClassName="md:col-span-3" />
                
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">{t('وضعیت سند', 'Status')}</label>
                  <div className="flex items-center h-8">
                    <Badge variant={selectedRow.status === 'تایید شده' ? 'success' : selectedRow.status === 'رد شده' ? 'danger' : selectedRow.status === 'در حال بررسی' ? 'blue' : selectedRow.status === 'پیش‌نویس' ? 'orange' : 'gray'}>
                      {selectedRow.status}
                    </Badge>
                  </div>
                </div>

                <div className="md:col-span-4 flex items-center gap-6 pt-2 border-t border-slate-100">
                  <ToggleField size="sm" label={t('فعال', 'Active')} checked={selectedRow.isActive} disabled isRtl={isRtl} />
                  <CheckboxField size="sm" label={t('کنترل شده', 'Controlled')} checked={selectedRow.isControlled} disabled isRtl={isRtl} />
                </div>
              </div>
            </Card>

            <Card title={t('اقلام سند', 'Line Items')} noPadding={true} className="border border-slate-200" headerClassName="h-10">
              <div className="h-[250px]">
                <DataGrid 
                  data={[
                    { id: 1, account: lovAccounts[0], costCenter: 'تهران', docDate: selectedRow.docDate, debit: selectedRow.amount, credit: '0', note: 'بابت فاکتور فروش شماره 1020' },
                    { id: 2, account: lovAccounts[3], costCenter: 'مرکزی', docDate: selectedRow.docDate, debit: '0', credit: selectedRow.amount, note: 'شناسایی درآمد' }
                  ]}
                  columns={[
                    { field: 'id', header_fa: 'ردیف', header_en: 'Row', width: '60px' },
                    { field: 'account', header_fa: 'حساب معین', header_en: 'Account', width: '180px', render: val => val?.title },
                    { field: 'costCenter', header_fa: 'مرکز هزینه', header_en: 'Cost Center', width: '140px' },
                    { field: 'docDate', header_fa: 'تاریخ ردیف', header_en: 'Date', width: '100px', type: 'date' },
                    { field: 'debit', header_fa: 'بدهکار (ریال)', header_en: 'Debit', width: '120px' },
                    { field: 'credit', header_fa: 'بستانکار (ریال)', header_en: 'Credit', width: '120px' },
                    { field: 'note', header_fa: 'شرح ردیف', header_en: 'Line Note', width: '250px' }
                  ]}
                  language={language}
                />
              </div>
            </Card>
          </div>
        )}
      </Modal>

      <Modal isOpen={attachModalOpen} onClose={() => setAttachModalOpen(false)} title={`${t('ضمائم سند شماره', 'Attachments for Doc #')} ${selectedRow?.id || ''}`} width="max-w-xl" language={language} showMaximize={false}>
        {selectedRow && (
          <div className="p-4 h-[350px]">
            <AttachmentManager 
              files={selectedRow.attachments} 
              onUpload={(newFiles) => {
                const uploaded = newFiles.map((f, i) => ({ id: Date.now() + i, name: f.name, size: f.size }));
                const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: [...(r.attachments || []), ...uploaded] } : r);
                setMockData(updatedData); setFilteredData(updatedData);
                setSelectedRow(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
              }} 
              onDelete={(file) => {
                const updatedData = mockData.map(r => r.id === selectedRow.id ? { ...r, attachments: r.attachments.filter(a => a.id !== file.id) } : r);
                setMockData(updatedData); setFilteredData(updatedData);
                setSelectedRow(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== file.id) }));
              }} 
              onDownload={(file) => alert(`Downloading: ${file.name}`)}
              readOnly={selectedRow.isReadOnly} 
              language={language} 
            />
          </div>
        )}
      </Modal>

    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;