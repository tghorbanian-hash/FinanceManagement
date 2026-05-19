/* Filename: financial/ChartofAccounts.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo, useCallback, useRef } = React;

  const FallbackIcon = ({ size = 16 }) => React.createElement('span', { style: { display: 'inline-block', width: size, height: size } });
  const LucideIcons = window.LucideIcons || {};
  const {
    Network = FallbackIcon, Plus = FallbackIcon, Edit = FallbackIcon, Trash2 = FallbackIcon, Save = FallbackIcon,
    Copy = FallbackIcon, ArrowLeft = FallbackIcon, ArrowRight = FallbackIcon, Users = FallbackIcon, AlertTriangle = FallbackIcon,
    Lock = FallbackIcon, Eye = FallbackIcon, Check = FallbackIcon, Shield = FallbackIcon, Info = FallbackIcon, RefreshCw = FallbackIcon
  } = LucideIcons;

  const ChartofAccounts = ({ language = 'fa', formCode = 'CHART_OF_ACCOUNTS' }) => {
    const FallbackComponent = () => null;

    const Core = window.DSCore || window.DesignSystem || {};
    const { Button = FallbackComponent, PageHeader = FallbackComponent, Card = FallbackComponent, Badge = FallbackComponent } = Core;

    const Forms = window.DSForms || window.DesignSystem || {};
    const { TextField = FallbackComponent, SelectField = FallbackComponent, ToggleField = FallbackComponent, DatePicker = FallbackComponent } = Forms;

    const Grid = window.DSGrid || window.DesignSystem || {};
    const { DataGrid = FallbackComponent, AdvancedFilter = FallbackComponent } = Grid;

    const Feedback = window.DSFeedback || window.DesignSystem || {};
    const { Modal = FallbackComponent, Toast = FallbackComponent, Alert = FallbackComponent } = Feedback;

    const TreeSystem = window.DSTree || window.DesignSystem || {};
    const { Tree = FallbackComponent } = TreeSystem;

    const isRtl = language === 'fa';
    const t = useCallback((fa, en) => isRtl ? fa : en, [isRtl]);

    const supabase = window.supabase;
    const currentUser = window.NavigationSystem?.currentUser?.name || 'مدیر سیستم';

    const securityCtx = window.SecurityManager?.useSecurity ? window.SecurityManager.useSecurity() : null;
    const access = useMemo(() => {
      const rawActions = securityCtx ? securityCtx.getActions(formCode) : null;
      return rawActions || { canView: true, canCreate: true, canEdit: true, canDelete: true, canPrint: true };
    }, [securityCtx, formCode]);

    // UI & Navigation states
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'designer'
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'permissions' | 'summary'
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, data: null });

    // Chart List states
    const [charts, setCharts] = useState([]);
    const [chartFilters, setChartFilters] = useState({});
    const [chartsGridState, setChartsGridState] = useState(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [chartFormData, setChartFormData] = useState({});
    
    // Copy Chart states
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copyFormData, setCopyFormData] = useState({ sourceId: null, code: '', title: '' });

    // Designer states
    const [activeChart, setActiveChart] = useState(null);
    const [rawAccounts, setRawAccounts] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [nodeFormData, setNodeFormData] = useState({});
    const [nodeDepth, setNodeDepth] = useState(1);

    // Global lookups
    const [currencies, setCurrencies] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [systemRoles, setSystemRoles] = useState([]);
    const [userRolesMapping, setUserRolesMapping] = useState([]);

    // Account Permissions states
    const [accountPermissions, setAccountPermissions] = useState([]);
    const [permFormData, setPermFormData] = useState({ granteeType: 'user', granteeId: '', accessLevel: 'view' });

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
        console.error('Action log failed:', err);
      }
    }, [supabase, currentUser]);

    // Fetch master charts
    const fetchCharts = useCallback(async () => {
      setIsLoading(true);
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('fm_coa_charts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setCharts(data || []);
      } catch (err) {
        showToast(t('خطا در دریافت اطلاعات ساختارهای حساب', 'Error fetching charts'), 'error');
      } finally {
        setIsLoading(false);
      }
    }, [supabase, showToast, t]);

    // Fetch shared lookups
    const fetchLookups = useCallback(async () => {
      try {
        if (!supabase) return;
        const [currRes, userRes, roleRes, userRoleMapRes] = await Promise.all([
          supabase.from('fm_currencies').select('id, code, name_fa, name_en'),
          supabase.from('sec_users').select('id, username, is_active'),
          supabase.from('sec_roles').select('id, name, title'),
          supabase.from('sec_user_roles').select('user_id, role_id')
        ]);

        if (currRes.data) setCurrencies(currRes.data);
        if (userRes.data) setSystemUsers(userRes.data.filter(u => u.is_active));
        if (roleRes.data) setSystemRoles(roleRes.data);
        if (userRoleMapRes.data) setUserRolesMapping(userRoleMapRes.data);
      } catch (err) {
        console.error('Error fetching lookups:', err);
      }
    }, [supabase]);

    useEffect(() => {
      if (access.canView) {
        fetchCharts();
        fetchLookups();
      }
    }, [fetchCharts, fetchLookups, access.canView]);

    // Calculate node depth hierarchy
    const calculateDepth = useCallback((nodes, parentId) => {
      let depth = 1;
      let currentParentId = parentId;
      while (currentParentId) {
        const pNode = nodes.find(n => n.id === currentParentId);
        if (pNode) {
          depth += 1;
          currentParentId = pNode.parentId;
        } else {
          break;
        }
      }
      return depth;
    }, []);

    // Generate unique suggestion code for account elements
    const suggestNextCode = useCallback((nodes, parentId, depth, chart) => {
      const siblings = nodes.filter(n => n.parentId === (parentId || null));
      let parentPrefix = '';
      if (parentId) {
        const pNode = nodes.find(n => n.id === parentId);
        if (pNode) parentPrefix = pNode.code || '';
      }

      let segmentLength = parseInt(chart.len_group || 1, 10);
      if (depth === 2) segmentLength = parseInt(chart.len_general || 2, 10);
      if (depth === 3) segmentLength = parseInt(chart.len_subsidiary || 3, 10);
      if (depth === 4) segmentLength = parseInt(chart.len_detail || 4, 10);

      let maxSuffixNum = 0;
      siblings.forEach(s => {
        const sCode = s.code || '';
        if (sCode.startsWith(parentPrefix)) {
          const suffix = sCode.substring(parentPrefix.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxSuffixNum) {
            maxSuffixNum = num;
          }
        }
      });

      const nextNumStr = String(maxSuffixNum + 1).padStart(segmentLength, '0');
      return parentPrefix + nextNumStr;
    }, []);

    // Load full structure inside the designer view
    const fetchDesignerData = async (chartId, retainNodeId = null) => {
      try {
        if (!supabase) return;
        const [accRes, permRes] = await Promise.all([
          supabase.from('fm_coa_accounts').select('*').eq('chart_id', chartId).order('code', { ascending: true }),
          supabase.from('fm_coa_permissions').select('*')
        ]);

        if (accRes.error) throw accRes.error;

        const mapped = (accRes.data || []).map(a => ({
          id: a.id,
          parentId: a.parent_id,
          code: a.code,
          titleFa: a.title_fa,
          titleEn: a.title_en,
          title: isRtl ? `${a.code} - ${a.title_fa}` : `${a.code} - ${a.title_en || a.title_fa}`,
          currencyId: a.currency_id,
          isActive: a.is_active,
          accountType: a.account_type,
          controlInventory: a.control_inventory
        }));

        // Node reactivity for cascading activation labels
        const isChainInactive = (pId, list) => {
          if (!pId) return false;
          const parent = list.find(l => l.id === pId);
          if (!parent) return false;
          if (!parent.isActive) return true;
          return isChainInactive(parent.parentId, list);
        };

        mapped.forEach(m => {
          const base = isRtl ? `${m.code} - ${m.titleFa}` : `${m.code} - ${m.titleEn || m.titleFa}`;
          const isParentDead = isChainInactive(m.parentId, mapped);
          if (!m.isActive || isParentDead) {
            m.title = `${base} ${t('(غیرفعال)', '(Inactive)')}`;
          }
        });

        setRawAccounts(mapped);
        if (permRes.data) {
          setAccountPermissions(permRes.data);
        }

        if (retainNodeId) {
          const match = mapped.find(m => m.id === retainNodeId);
          if (match) {
            setSelectedNodeId(match.id);
            setNodeFormData({ ...match });
            setNodeDepth(calculateDepth(mapped, match.parentId));
            setIsCreatingNode(false);
          }
        }
      } catch (err) {
        showToast(t('خطا در بارگذاری ساختار کدینگ', 'Error loading account codes'), 'error');
      }
    };

    const filteredCharts = useMemo(() => {
      let res = [...charts];
      if (chartFilters.code) res = res.filter(c => (c.code || '').toLowerCase().includes(chartFilters.code.toLowerCase()));
      if (chartFilters.title) res = res.filter(c => (c.title || '').toLowerCase().includes(chartFilters.title.toLowerCase()));
      return res;
    }, [charts, chartFilters]);

    // Open structure manager dialog
    const handleOpenChartModal = (chart = null) => {
      if (chart) {
        setChartFormData({ ...chart });
      } else {
        setChartFormData({
          code: '', title: '', is_active: true, start_date: '', end_date: '',
          len_group: '1', len_general: '2', len_subsidiary: '3', len_detail: '4'
        });
      }
      setIsChartModalOpen(true);
    };

    const handleSaveChart = async () => {
      if (!chartFormData.code || !chartFormData.title) {
        return showToast(t('وارد کردن کد و عنوان اجباری است', 'Code and Title are required'), 'error');
      }
      try {
        const payload = {
          code: chartFormData.code,
          title: chartFormData.title,
          start_date: chartFormData.start_date || null,
          end_date: chartFormData.end_date || null,
          is_active: chartFormData.is_active,
          len_group: parseInt(chartFormData.len_group || 1, 10),
          len_general: parseInt(chartFormData.len_general || 2, 10),
          len_subsidiary: parseInt(chartFormData.len_subsidiary || 3, 10),
          len_detail: parseInt(chartFormData.len_detail || 4, 10)
        };

        if (chartFormData.id) {
          const { error } = await supabase.from('fm_coa_charts').update(payload).eq('id', chartFormData.id);
          if (error) throw error;
          await logAction('ساختار حساب‌ها', chartFormData.id, 'update', `ویرایش ساختار کلان: ${payload.title}`);
        } else {
          const { data, error } = await supabase.from('fm_coa_charts').insert([payload]).select();
          if (error) throw error;
          if (data && data[0]) {
            await logAction('ساختار حساب‌ها', data[0].id, 'create', `ایجاد ساختار کلان جدید: ${payload.title}`);
          }
        }
        setIsChartModalOpen(false);
        fetchCharts();
        showToast(t('ساختار با موفقیت ذخیره شد', 'Structure saved successfully'));
      } catch (err) {
        showToast(t('خطا در ذخیره اطلاعات ساختار', 'Error saving chart definition'), 'error');
      }
    };

    // Copy whole tree architecture to a new structure setup
    const handleOpenCopyModal = (chart) => {
      setCopyFormData({ sourceId: chart.id, code: `${chart.code}_COPY`, title: `${chart.title} - ${t('کپی', 'Copy')}` });
      setIsCopyModalOpen(true);
    };

    const handleExecuteCopy = async () => {
      if (!copyFormData.code || !copyFormData.title) return;
      setIsLoading(true);
      try {
        const { data: srcChart, error: sErr } = await supabase.from('fm_coa_charts').select('*').eq('id', copyFormData.sourceId).single();
        if (sErr || !srcChart) throw new Error('Source chart missing');

        const { data: newChart, error: iErr } = await supabase.from('fm_coa_charts').insert([{
          code: copyFormData.code,
          title: copyFormData.title,
          start_date: srcChart.start_date,
          end_date: srcChart.end_date,
          is_active: srcChart.is_active,
          len_group: srcChart.len_group,
          len_general: srcChart.len_general,
          len_subsidiary: srcChart.len_subsidiary,
          len_detail: srcChart.len_detail
        }]).select().single();

        if (iErr || !newChart) throw iErr;

        const { data: srcAccounts, error: aErr } = await supabase.from('fm_coa_accounts').select('*').eq('chart_id', copyFormData.sourceId).order('created_at', { ascending: true });
        if (aErr) throw aErr;

        if (srcAccounts && srcAccounts.length > 0) {
          const idMapping = {};
          for (const acc of srcAccounts) {
            const mappedParentId = acc.parent_id ? idMapping[acc.parent_id] : null;
            const { data: insertedAcc, error: accInsErr } = await supabase.from('fm_coa_accounts').insert([{
              chart_id: newChart.id,
              parent_id: mappedParentId,
              code: acc.code,
              title_fa: acc.title_fa,
              title_en: acc.title_en,
              currency_id: acc.currency_id,
              is_active: acc.is_active,
              account_type: acc.account_type,
              control_inventory: acc.control_inventory
            }]).select().single();

            if (!accInsErr && insertedAcc) {
              idMapping[acc.id] = insertedAcc.id;
            }
          }
        }

        await logAction('ساختار حساب‌ها', newChart.id, 'create', `کپی برداری ساختار از شناسه ${copyFormData.sourceId}`);
        setIsCopyModalOpen(false);
        fetchCharts();
        showToast(t('ساختار حساب با تمامی زیرمجموعه‌ها کپی شد', 'Chart structure copied completely'));
      } catch (err) {
        showToast(t('خطا در فرآیند کپی ساختار', 'Error duplicating structure'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenDesigner = (chart) => {
      setActiveChart(chart);
      setSelectedNodeId(null);
      setIsCreatingNode(false);
      setNodeFormData({});
      setViewMode('designer');
      setActiveTab('details');
      fetchDesignerData(chart.id);
    };

    const handleSelectTreeNode = (node) => {
      setSelectedNodeId(node.id);
      setNodeFormData({ ...node });
      setIsCreatingNode(false);
      setNodeDepth(calculateDepth(rawAccounts, node.parentId));
    };

    const handleAddTreeRoot = () => {
      if (!access.canCreate) return;
      const suggested = suggestNextCode(rawAccounts, null, 1, activeChart);
      setSelectedNodeId(null);
      setNodeDepth(1);
      setNodeFormData({ code: suggested, titleFa: '', titleEn: '', parentId: null, currencyId: '', isActive: true, accountType: 'main', controlInventory: false });
      setIsCreatingNode(true);
    };

    const handleAddTreeChild = (parentNode) => {
      if (!access.canCreate) return;
      const currentPDepth = calculateDepth(rawAccounts, parentNode.id);
      if (currentPDepth >= 4) {
        return showToast(t('امکان تعریف گره جدید فراتر از سطح ۴ (تفصیل) وجود ندارد', 'Cannot add nodes beyond Level 4 (Detail)'), 'error');
      }
      const nextDepth = currentPDepth + 1;
      const suggested = suggestNextCode(rawAccounts, parentNode.id, nextDepth, activeChart);
      
      setSelectedNodeId(null);
      setNodeDepth(nextDepth);
      setNodeFormData({ code: suggested, titleFa: '', titleEn: '', parentId: parentNode.id, currencyId: parentNode.currencyId || '', isActive: true, accountType: 'main', controlInventory: false });
      setIsCreatingNode(true);
    };

    const validateNodeUniqueness = () => {
      const pId = nodeFormData.parentId || null;
      const siblings = rawAccounts.filter(n => n.parentId === pId && n.id !== nodeFormData.id);

      const dupFa = siblings.some(s => (s.titleFa || '').trim() === (nodeFormData.titleFa || '').trim());
      if (dupFa) {
        showToast(t('عنوان فارسی در این سطح تکراری است', 'Duplicate Persian title at this level'), 'error');
        return false;
      }

      const enVal = (nodeFormData.titleEn || '').trim();
      if (enVal !== '') {
        const dupEn = siblings.some(s => (s.titleEn || '').trim() === enVal);
        if (dupEn) {
          showToast(t('عنوان انگلیسی در این سطح تکراری است', 'Duplicate English title at this level'), 'error');
          return false;
        }
      }

      const codeDup = rawAccounts.some(n => n.id !== nodeFormData.id && n.code === nodeFormData.code);
      if (codeDup) {
        showToast(t('کد حساب وارد شده در کل ساختار تکراری است', 'Account code must be unique globally'), 'error');
        return false;
      }

      return true;
    };

    const handleSaveNodeForm = async () => {
      if (!nodeFormData.titleFa || !nodeFormData.code) {
        return showToast(t('فیلدهای کد و عنوان فارسی الزامی هستند', 'Code and Persian title are required'), 'error');
      }

      if (!validateNodeUniqueness()) return;

      try {
        const payload = {
          chart_id: activeChart.id,
          parent_id: nodeFormData.parentId || null,
          code: nodeFormData.code,
          title_fa: nodeFormData.titleFa,
          title_en: nodeFormData.titleEn,
          currency_id: nodeFormData.currencyId || null,
          is_active: nodeFormData.isActive,
          account_type: nodeFormData.accountType,
          control_inventory: nodeFormData.controlInventory
        };

        let targetId = null;
        if (isCreatingNode) {
          const { data, error } = await supabase.from('fm_coa_accounts').insert([payload]).select();
          if (error) throw error;
          if (data && data[0]) {
            targetId = data[0].id;
            await logAction('حساب کدینگ', targetId, 'create', `ایجاد حساب: ${payload.code} - ${payload.title_fa}`);
          }
        } else {
          if (nodeFormData.parentId === selectedNodeId) {
            return showToast(t('گره نمی‌تواند زیرمجموعه خودش قرار گیرد', 'A node cannot be a child of itself'), 'error');
          }
          const { error } = await supabase.from('fm_coa_accounts').update(payload).eq('id', selectedNodeId);
          if (error) throw error;
          targetId = selectedNodeId;
          await logAction('حساب کدینگ', targetId, 'update', `ویرایش حساب: ${payload.code} - ${payload.title_fa}`);
        }

        await fetchDesignerData(activeChart.id, targetId);
        showToast(t('اطلاعات حساب با موفقیت ثبت شد', 'Account specifications updated successfully'));
      } catch (err) {
        showToast(t('خطا در ذخیره اطلاعات گره حساب', 'Error saving account specification'), 'error');
      }
    };

    const handleDeleteNode = (node) => {
      const hasChildren = rawAccounts.some(n => n.parentId === node.id);
      if (hasChildren) {
        return showToast(t('این حساب دارای زیرمجموعه است و حذف آن امکان‌پذیر نیست', 'Account has children and cannot be removed'), 'error');
      }
      setDeleteConfirm({ isOpen: true, type: 'node', data: node });
    };

    const executeDelete = async () => {
      try {
        if (deleteConfirm.type === 'chart') {
          const { error } = await supabase.from('fm_coa_charts').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
          fetchCharts();
        } else if (deleteConfirm.type === 'node') {
          const { error } = await supabase.from('fm_coa_accounts').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
          await logAction('حساب کدینگ', deleteConfirm.data.id, 'delete', `حذف حساب: ${deleteConfirm.data.code}`);
          await fetchDesignerData(activeChart.id);
          setSelectedNodeId(null);
          setNodeFormData({});
          setIsCreatingNode(false);
        } else if (deleteConfirm.type === 'permission') {
          const { error } = await supabase.from('fm_coa_permissions').delete().eq('id', deleteConfirm.data.id);
          if (error) throw error;
          await fetchDesignerData(activeChart.id, selectedNodeId);
        }
        showToast(t('رکورد با موفقیت حذف شد', 'Deleted successfully'));
        setDeleteConfirm({ isOpen: false, type: null, data: null });
      } catch (err) {
        showToast(t('امکان حذف رکورد به دلیل وابستگی‌های جانبی وجود ندارد', 'Deletion failed due to existing relationships'), 'error');
        setDeleteConfirm({ isOpen: false, type: null, data: null });
      }
    };

    // Permissions logic
    const activeNodePermissions = useMemo(() => {
      if (!selectedNodeId) return [];
      return accountPermissions.filter(p => p.account_id === selectedNodeId);
    }, [accountPermissions, selectedNodeId]);

    const handleAddPermission = async () => {
      if (!permFormData.granteeId || !selectedNodeId) return;
      const duplicate = activeNodePermissions.some(p => p.grantee_type === permFormData.granteeType && p.grantee_id === permFormData.granteeId);
      if (duplicate) {
        return showToast(t('این دسترسی قبلاً برای حساب ثبت شده است', 'Access role/user already specified'), 'error');
      }

      try {
        const { error } = await supabase.from('fm_coa_permissions').insert([{
          account_id: selectedNodeId,
          grantee_type: permFormData.granteeType,
          grantee_id: permFormData.granteeId,
          access_level: permFormData.accessLevel
        }]);
        if (error) throw error;

        await fetchDesignerData(activeChart.id, selectedNodeId);
        setPermFormData({ granteeType: 'user', granteeId: '', accessLevel: 'view' });
        showToast(t('دسترسی جدید اعمال شد', 'Permission granted'));
      } catch (err) {
        showToast(t('خطا در ذخیره دسترسی', 'Error adding permission'), 'error');
      }
    };

    // Consolidated users list compilation
    const consolidatedUsersList = useMemo(() => {
      if (!selectedNodeId) return [];
      const result = [];

      systemUsers.forEach(user => {
        let maxAccess = null; // 'full' or 'view'
        const reasons = [];

        // 1. Direct permission check
        const directPerm = activeNodePermissions.find(p => p.grantee_type === 'user' && p.grantee_id === user.id);
        if (directPerm) {
          maxAccess = directPerm.access_level;
          reasons.push(t('دسترسی مستقیم', 'Direct Access'));
        }

        // 2. Role inheritance check
        const userRoles = userRolesMapping.filter(m => m.user_id === user.id).map(m => m.role_id);
        const rolePerms = activeNodePermissions.filter(p => p.grantee_type === 'role' && userRoles.includes(p.grantee_id));

        rolePerms.forEach(rp => {
          const roleObj = systemRoles.find(r => r.id === rp.grantee_id);
          const rTitle = roleObj ? (roleObj.title || roleObj.name) : t('نقش سیستم', 'System Role');
          reasons.push(`${t('ارث‌بری از نقش:', 'Inherited via Role:')} ${rTitle}`);
          
          if (!maxAccess || (maxAccess === 'view' && rp.access_level === 'full')) {
            maxAccess = rp.access_level;
          }
        });

        if (maxAccess) {
          result.push({
            id: user.id,
            username: user.username,
            accessLevel: maxAccess,
            reason: reasons.join(' / ')
          });
        }
      });

      return result;
    }, [selectedNodeId, systemUsers, activeNodePermissions, userRolesMapping, systemRoles, t]);

    const chartColumns = [
      { field: 'code', header_fa: 'کد ساختار', header_en: 'Code', width: '110px' },
      { field: 'title', header_fa: 'عنوان ساختار کلان', header_en: 'Structure Title', width: '240px' },
      { field: 'start_date', header_fa: 'تاریخ شروع موثر', header_en: 'Effective Start', width: '120px', type: 'date' },
      { field: 'end_date', header_fa: 'تاریخ پایان موثر', header_en: 'Effective End', width: '120px', type: 'date' },
      { field: 'is_active', header_fa: 'وضعیت', header_en: 'Active', type: 'toggle', width: '90px' }
    ];

    const permColumns = [
      {
        field: 'grantee_type', header_fa: 'نوع گیرنده', header_en: 'Type', width: '110px',
        render: (v) => <Badge variant="slate" size="sm">{v === 'user' ? t('کاربر', 'User') : t('نقش', 'Role')}</Badge>
      },
      {
        field: 'grantee_id', header_fa: 'نام کاربری / عنوان نقش', header_en: 'Name/Title', width: '220px',
        render: (v, row) => {
          if (row.grantee_type === 'user') {
            return systemUsers.find(u => u.id === v)?.username || v;
          } else {
            const role = systemRoles.find(r => r.id === v);
            return role ? (role.title || role.name) : v;
          }
        }
      },
      {
        field: 'access_level', header_fa: 'سطح دسترسی', header_en: 'Access Level', width: '130px',
        render: (v) => (
          <Badge variant={v === 'full' ? 'indigo' : 'amber'} size="sm">
            {v === 'full' ? t('کامل (ویرایش و حذف)', 'Full Access') : t('فقط مشاهده', 'View Only')}
          </Badge>
        )
      }
    ];

    const consolidatedColumns = [
      { field: 'username', header_fa: 'نام کاربری', header_en: 'Username', width: '140px' },
      {
        field: 'accessLevel', header_fa: 'نهایت سطح دسترسی', header_en: 'Effective Access', width: '150px',
        render: (v) => (
          <Badge variant={v === 'full' ? 'indigo' : 'amber'} size="sm">
            {v === 'full' ? t('کامل', 'Full Access') : t('فقط مشاهده', 'View Only')}
          </Badge>
        )
      },
      { field: 'reason', header_fa: 'نحوه تخصیص و ارث‌بری', header_en: 'Inheritance/Reason', width: '300px' }
    ];

    const viewConfig = useMemo(() => ({
      pageId: 'coa_charts_main',
      currentState: () => ({ viewMode, chartFilters, chartsGridState }),
      onApplyState: (state) => {
        if (state) {
          if (state.viewMode) setViewMode(state.viewMode);
          if (state.chartFilters) setChartFilters(state.chartFilters);
          if (state.chartsGridState) setChartsGridState(state.chartsGridState);
        } else {
          setViewMode('list');
          setChartFilters({});
          setChartsGridState(null);
        }
      }
    }), [viewMode, chartFilters, chartsGridState]);

    const levelLabels = {
      1: t('سطح ۱ - گروه حساب', 'Level 1 - Account Group'),
      2: t('سطح ۲ - حساب کل', 'Level 2 - General Ledger'),
      3: t('سطح ۳ - حساب معین', 'Level 3 - Subsidiary Ledger'),
      4: t('سطح ۴ - حساب تفصیل', 'Level 4 - Detail Account')
    };

    return (
      <div className="p-4 h-full flex flex-col font-sans bg-slate-50/50 dark:bg-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader
          title={t('ساختار و درخت حساب‌ها (Coding)', 'Chart of Accounts Setup')}
          icon={Network} language={language}
          description={t('مدیریت مدل‌های کدینگ مالی و تخصیص سطوح دسترسی کاربران', 'Define accounting structures, levels, and access profiles')}
          breadcrumbs={[{ label: t('مدیریت مالی', 'Financial Setup') }, { label: t('کدینگ حساب‌ها', 'Chart of Accounts') }]}
          viewConfig={viewConfig}
        />

        {viewMode === 'list' ? (
          <div className="flex-1 min-h-0 flex flex-col gap-3 mt-2 animate-in fade-in duration-500">
            <AdvancedFilter
              fields={[
                { name: 'code', label: t('کد ساختار', 'Structure Code'), type: 'text' },
                { name: 'title', label: t('عنوان ساختار', 'Structure Title'), type: 'text' }
              ]}
              initialValues={chartFilters} onFilter={setChartFilters} onClear={() => setChartFilters({})} language={language}
            />
            <div className="flex-1 min-h-0">
              <DataGrid
                data={filteredCharts} columns={chartColumns} language={language} formCode={formCode}
                gridState={chartsGridState} onGridStateChange={setChartsGridState}
                onAdd={access.canCreate ? () => handleOpenChartModal() : undefined}
                actions={[
                  { id: 'design', icon: Network, tooltip: t('طراحی درخت حساب‌ها', 'Design Tree Structure'), onClick: (row) => handleOpenDesigner(row), className: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50' },
                  { id: 'copy', icon: Copy, tooltip: t('کپی ساختار کلان', 'Duplicate Entire Structure'), onClick: (row) => handleOpenCopyModal(row), className: 'text-emerald-600 dark:text-emerald-400' },
                  { id: 'update', icon: Edit, tooltip: t('ویرایش', 'Edit Definition'), onClick: (row) => handleOpenChartModal(row), requiredAccess: 'edit' },
                  { id: 'delete', icon: Trash2, tooltip: t('حذف', 'Delete Structure'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'chart', data: row }), requiredAccess: 'delete', className: 'text-red-500 hover:text-red-600' }
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={isRtl ? ArrowRight : ArrowLeft} onClick={() => setViewMode('list')}>{t('بازگشت به لیست', 'Back')}</Button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1">
                  {t('پیکربندی درخت حساب:', 'Coding Setup:')} <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{activeChart?.title}</span>
                </h2>
              </div>
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchDesignerData(activeChart.id, selectedNodeId)} className="h-8 w-8 px-0" />
            </div>

            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
              {/* Tree navigation pane (Left/Right depending on language layout) */}
              <div className={`w-full md:w-[40%] flex flex-col bg-slate-50/40 dark:bg-slate-900/10 border-b md:border-b-0 ${isRtl ? 'md:border-l' : 'md:border-r'} border-slate-200 dark:border-slate-700 overflow-y-auto`}>
                <Tree
                  data={rawAccounts} language={language} formCode={formCode}
                  idField="id" parentField="parentId" displayField="title" secondaryField="code" activeField="isActive"
                  selectedId={selectedNodeId}
                  onSelect={handleSelectTreeNode}
                  onAddRoot={access.canCreate ? handleAddTreeRoot : undefined}
                  onAddChild={access.canCreate ? handleAddTreeChild : undefined}
                  onDelete={access.canDelete ? handleDeleteNode : undefined}
                />
              </div>

              {/* Workspace workspace card tabs layout */}
              <div className="flex-1 flex flex-col overflow-auto p-4 gap-3 bg-slate-50/50 dark:bg-slate-900/20">
                {selectedNodeId || isCreatingNode ? (
                  <Card noPadding={true} className="flex-1 border border-slate-200 dark:border-slate-700 flex flex-col min-h-0 bg-white dark:bg-slate-800 shadow-sm">
                    {/* Inner workspace tab header lines */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 px-3 pt-2 gap-1 shrink-0">
                      <button onClick={() => setActiveTab('details')} className={`px-4 py-2 font-bold text-xs border-b-2 transition-all ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        {t('مشخصات و الزامات حساب', 'Account Parameters')}
                      </button>
                      {!isCreatingNode && (
                        <>
                          <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 font-bold text-xs border-b-2 transition-all ${activeTab === 'permissions' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {t('تعریف قوانین دسترسی', 'Access Grantees')}
                          </button>
                          <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 font-bold text-xs border-b-2 transition-all ${activeTab === 'summary' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-t-lg shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {t('مجموع کاربران مجاز سیستم', 'Consolidated User Scope')}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto min-h-0">
                      {activeTab === 'details' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <Alert type="info" icon={Info} message={<span>{t('سطح گره جاری:', 'Current Element Hierarchy Level:')} <strong className="text-indigo-600 dark:text-indigo-300">{levelLabels[nodeDepth]}</strong></span>} />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextField size="sm" formCode={formCode} label={t('کد حساب (ترکیبی اتوماتیک)', 'Account Code')} value={nodeFormData.code || ''} onChange={(e) => setNodeFormData({ ...nodeFormData, code: e.target.value })} isRtl={isRtl} required dir="ltr" />
                            <SelectField size="sm" formCode={formCode} label={t('ارز مبنای تراکنش', 'Transaction Base Currency')} value={nodeFormData.currencyId || ''} onChange={(e) => setNodeFormData({ ...nodeFormData, currencyId: e.target.value })} options={[{ value: '', label: t('بدون محدودیت ارزی', 'No Currency Restriction') }, ...currencies.map(c => ({ value: c.id, label: `${c.code} - ${isRtl ? c.name_fa : c.name_en}` }))]} isRtl={isRtl} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextField size="sm" formCode={formCode} label={t('عنوان فارسی حساب', 'Persian Title')} value={nodeFormData.titleFa || ''} onChange={(e) => setNodeFormData({ ...nodeFormData, titleFa: e.target.value })} isRtl={isRtl} required />
                            <TextField size="sm" formCode={formCode} label={t('عنوان انگلیسی حساب', 'English Title')} value={nodeFormData.titleEn || ''} onChange={(e) => setNodeFormData({ ...nodeFormData, titleEn: e.target.value })} isRtl={isRtl} dir="ltr" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <SelectField size="sm" formCode={formCode} label={t('نوع حساب', 'Account Category')} value={nodeFormData.accountType || 'main'} onChange={(e) => setNodeFormData({ ...nodeFormData, accountType: e.target.value })} options={[{ value: 'main', label: t('حساب اصلی', 'Main Account') }, { value: 'intermediate', label: t('حساب واسط / کنترلی', 'Intermediate Account') }]} isRtl={isRtl} />
                            <div className="flex flex-col justify-end gap-3 pb-1">
                              <ToggleField size="sm" formCode={formCode} label={t('کنترل موجودی طی دوره مالی', 'Validate Balance Constraints During Period')} checked={!!nodeFormData.controlInventory} onChange={(v) => setNodeFormData({ ...nodeFormData, controlInventory: v })} isRtl={isRtl} />
                              <ToggleField size="sm" formCode={formCode} label={t('حساب فعال و قابل استفاده باشد', 'Account Active & Exposed')} checked={nodeFormData.isActive !== false} onChange={(v) => setNodeFormData({ ...nodeFormData, isActive: v })} isRtl={isRtl} />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setIsCreatingNode(false); setSelectedNodeId(null); setNodeFormData({}); }}>{t('انصراف', 'Cancel')}</Button>
                            {access.canEdit && <Button size="sm" variant="primary" icon={Save} onClick={handleSaveNodeForm}>{t('ذخیره تغییرات حساب', 'Save Account')}</Button>}
                          </div>
                        </div>
                      )}

                      {activeTab === 'permissions' && (
                        <div className="space-y-4 flex flex-col h-full min-h-0 animate-in fade-in duration-200">
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <SelectField size="sm" label={t('نوع گیرنده دسترسی', 'Grantee Type')} value={permFormData.granteeType} onChange={(e) => setPermFormData({ ...permFormData, granteeType: e.target.value, granteeId: '' })} options={[{ value: 'user', label: t('کاربر مشخص', 'Specific User') }, { value: 'role', label: t('نقش کلان سیستم', 'System Role Group') }]} isRtl={isRtl} />
                            
                            <SelectField size="sm" label={t('انتخاب هدف', 'Select Target')} value={permFormData.granteeId} onChange={(e) => setPermFormData({ ...permFormData, granteeId: e.target.value })} options={[{ value: '', label: t('انتخاب کنید...', 'Select...') }, ...(permFormData.granteeType === 'user' ? systemUsers.map(u => ({ value: u.id, label: u.username })) : systemRoles.map(r => ({ value: r.id, label: r.title || r.name })))]} isRtl={isRtl} />
                            
                            <SelectField size="sm" label={t('محدوده سطح دسترسی', 'Access Level')} value={permFormData.accessLevel} onChange={(e) => setPermFormData({ ...permFormData, accessLevel: e.target.value })} options={[{ value: 'view', label: t('فقط مشاهده اطلاعات حساب', 'View Only') }, { value: 'full', label: t('کامل (ثبت، ویرایش و حذف)', 'Full Control') }]} isRtl={isRtl} />
                            
                            <Button size="sm" variant="primary" icon={Plus} onClick={handleAddPermission}>{t('افزودن دسترسی', 'Grant Access')}</Button>
                          </div>

                          <div className="flex-1 min-h-[250px]">
                            <DataGrid
                              data={activeNodePermissions} columns={permColumns} language={language} formCode={formCode}
                              actions={[{ id: 'delete', icon: Trash2, tooltip: t('حذف دسترسی', 'Revoke Permission'), onClick: (row) => setDeleteConfirm({ isOpen: true, type: 'permission', data: row }), className: 'text-red-500 hover:text-red-600' }]}
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === 'summary' && (
                        <div className="space-y-3 flex flex-col h-full min-h-0 animate-in fade-in duration-200">
                          <Alert type="warning" icon={Shield} message={t('لیست زیر مجموع تمامی کاربرانی است که به صورت مستقیم یا از طریق تفویض نقش‌های خود، اجازه تعامل با این حساب را کسب کرده‌اند.', 'Consolidated aggregate list of all operators with computed effective system access level.')} />
                          <div className="flex-1 min-h-[300px]">
                            <DataGrid data={consolidatedUsersList} columns={consolidatedColumns} language={language} formCode={formCode} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-3 text-[12px] font-medium p-8">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"><Network size={26} className="text-slate-300 dark:text-slate-600"/></div>
                    <span>{t('جهت بررسی پارامترها، قوانین ارث‌بری یا دسترسی، یک حساب را از ساختار درخت انتخاب کنید.', 'Select an account item node from the left tree setup to manage permissions or parameters.')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Master Setup Metadata Modal */}
        <Modal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} title={chartFormData.id ? t('ویرایش مشخصات ساختار کلان', 'Edit Structure Definition') : t('تعریف ساختار کلان حساب جدید', 'New Chart Model Setup')} language={language} width="max-w-2xl">
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField size="sm" formCode={formCode} label={t('کد ساختار حساب', 'Structure Code')} value={chartFormData.code || ''} onChange={e => setChartFormData({ ...chartFormData, code: e.target.value })} isRtl={isRtl} required dir="ltr" />
              <TextField size="sm" formCode={formCode} label={t('عنوان مدل کدینگ', 'Coding Model Title')} value={chartFormData.title || ''} onChange={e => setChartFormData({ ...chartFormData, title: e.target.value })} isRtl={isRtl} required />
              <DatePicker size="sm" formCode={formCode} label={t('تاریخ شروع اعتبار کلان', 'Effective From')} value={chartFormData.start_date || ''} onChange={val => setChartFormData({ ...chartFormData, start_date: val })} isRtl={isRtl} />
              <DatePicker size="sm" formCode={formCode} label={t('تاریخ پایان اعتبار کلان', 'Effective To')} value={chartFormData.end_date || ''} onChange={val => setChartFormData({ ...chartFormData, end_date: val })} isRtl={isRtl} />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1"><Info size={14} className="text-indigo-500" /> {t('تنظیم طول سگمنت‌های کدینگ جهت پیشنهاد اتوماتیک کدهای درخت', 'Segment Formatting Setup for Auto Suggested Increments')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <TextField size="sm" type="number" formCode={formCode} label={t('طول کد گروه', 'Group Code Len')} value={chartFormData.len_group || '1'} onChange={e => setChartFormData({ ...chartFormData, len_group: e.target.value })} isRtl={isRtl} dir="ltr" />
                <TextField size="sm" type="number" formCode={formCode} label={t('طول کد کل', 'GL Code Len')} value={chartFormData.len_general || '2'} onChange={e => setChartFormData({ ...chartFormData, len_general: e.target.value })} isRtl={isRtl} dir="ltr" />
                <TextField size="sm" type="number" formCode={formCode} label={t('طول کد معین', 'Subsidiary Len')} value={chartFormData.len_subsidiary || '3'} onChange={e => setChartFormData({ ...chartFormData, len_subsidiary: e.target.value })} isRtl={isRtl} dir="ltr" />
                <TextField size="sm" type="number" formCode={formCode} label={t('طول کد تفصیل', 'Detail Len')} value={chartFormData.len_detail || '4'} onChange={e => setChartFormData({ ...chartFormData, len_detail: e.target.value })} isRtl={isRtl} dir="ltr" />
              </div>
            </div>

            <div className="flex items-center pt-1">
              <ToggleField size="sm" formCode={formCode} label={t('ساختار فعال و معتبر باشد', 'Is Active Setup')} checked={chartFormData.is_active !== false} onChange={val => setChartFormData({ ...chartFormData, is_active: val })} isRtl={isRtl} />
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button size="sm" variant="outline" onClick={() => setIsChartModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              {access.canEdit && <Button size="sm" variant="primary" icon={Save} onClick={handleSaveChart}>{t('ذخیره ساختار کلان', 'Save Setup')}</Button>}
            </div>
          </div>
        </Modal>

        {/* Copy Structure Modal */}
        <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title={t('کپی‌برداری کامل از ساختار حساب', 'Duplicate Account Code Hierarchy')} language={language} width="max-w-md">
          <div className="p-4 flex flex-col gap-4">
            <Alert type="info" message={t('با انجام این عملیات، تمامی نودهای درخت حسابهای ساختار مبدا، عینا به همراه متدهای کدینگ در قالب یک ساختار جدید تکثیر خواهند شد.', 'This procedure copies all ledger nodes recursively, creating a duplicate tree mapping.')} />
            <TextField size="sm" formCode={formCode} label={t('کد ساختار جدید', 'New Code Target')} value={copyFormData.code} onChange={e => setCopyFormData({ ...copyFormData, code: e.target.value })} isRtl={isRtl} required dir="ltr" />
            <TextField size="sm" formCode={formCode} label={t('عنوان ساختار جدید', 'New Title Target')} value={copyFormData.title} onChange={e => setCopyFormData({ ...copyFormData, title: e.target.value })} isRtl={isRtl} required />
            
            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <Button size="sm" variant="outline" onClick={() => setIsCopyModalOpen(false)}>{t('انصراف', 'Cancel')}</Button>
              <Button size="sm" variant="primary" icon={Copy} onClick={handleExecuteCopy} isLoading={isLoading}>{t('شروع فرآیند کپی پیوندها', 'Execute Duplication')}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Overlay */}
        <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, type: null, data: null })} title={t('تایید حذف قطعی رکورد', 'Confirm Permanent Revocation')} language={language} width="max-w-sm">
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 mb-1"><AlertTriangle size={22} /></div>
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1"><Lock size={12}/> {t('هشدار: غیرقابل بازگشت', 'WARNING: IRREVERSIBLE')}</div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mt-1">
              {deleteConfirm.type === 'chart' && t(`آیا از حذف کامل ساختار کلان "${deleteConfirm.data?.title}" و تمامی کدهای متصل به آن اطمینان دارید؟`, `Are you sure you want to delete structure "${deleteConfirm.data?.title}" and all nested accounts?`)}
              {deleteConfirm.type === 'node' && t(`آیا از حذف حساب کدینگ "${deleteConfirm.data?.titleFa}" اطمینان دارید؟`, `Are you sure you want to delete account component "${deleteConfirm.data?.titleFa}"?`)}
              {deleteConfirm.type === 'permission' && t('آیا از حذف این ردیف دسترسی اطمینان دارید؟', 'Are you sure you want to revoke this explicit access right?')}
            </p>
            <div className="flex gap-2 mt-4 w-full">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeleteConfirm({ isOpen: false, type: null, data: null })}>{t('انصراف', 'Cancel')}</Button>
              <Button size="sm" variant="primary" onClick={executeDelete} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-700 border-red-600 dark:border-red-500 shadow-lg">{t('تایید حذف نهایی', 'Delete Now')}</Button>
            </div>
          </div>
        </Modal>

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      </div>
    );
  };

  ChartofAccounts.formCode = 'CHART_OF_ACCOUNTS';
  window.ChartofAccounts = ChartofAccounts;
})();