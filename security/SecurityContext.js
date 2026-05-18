/* Filename: security/SecurityContext.js */
(() => {
  const React = window.React;
  const { createContext, useState, useEffect, useContext, useCallback, useMemo } = React;

  const SecurityContext = createContext(null);

  const SecurityProvider = ({ children, userSession }) => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isFullAccess, setIsFullAccess] = useState(false);

    useEffect(() => {
      const loadPermissions = async () => {
        if (!userSession || !userSession.id) {
          setLoading(false);
          return;
        }

        const username = userSession.username?.toLowerCase();
        
        if (username === 'admin' || username === 'superadmin') {
          setIsFullAccess(true);
          setLoading(false);
          return;
        }

        try {
          const supabase = window.supabase;
          
          // ۱. واکشی نقش‌های کاربر
          const { data: userRoles } = await supabase
            .from('sec_user_roles')
            .select('role_id')
            .eq('user_id', userSession.id);

          const roleIds = userRoles ? userRoles.map(ur => ur.role_id) : [];

          // ۲. واکشی دسترسی‌های مستقیم و دسترسی‌های نقش از جدول واحد sec_permissions
          const { data: userPerms } = await supabase
            .from('sec_permissions')
            .select('*')
            .eq('user_id', userSession.id);

          let rolePerms = [];
          if (roleIds.length > 0) {
            const { data: rPerms } = await supabase
              .from('sec_permissions')
              .select('*')
              .in('role_id', roleIds);
            if (rPerms) rolePerms = rPerms;
          }

          // ۳. واکشی منوها برای تبدیل menu_id به unique_code
          const { data: menus } = await supabase.from('menus').select('id, unique_code');

          const merged = {};

          const processPerm = (p) => {
            const menu = menus?.find(m => m.id === p.menu_id);
            if (!menu || !menu.unique_code) return;
            
            const code = menu.unique_code.trim().toLowerCase();
            
            if (!merged[code]) {
              merged[code] = {
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_print: false,
                data_scope: {} 
              };
            }
            
            const actions = typeof p.actions === 'string' ? JSON.parse(p.actions || '[]') : (p.actions || []);
            
            // اگر رکوردی وجود دارد، حداقل دسترسی مشاهده منو باید باز شود
            merged[code].can_view = true;
            
            if (actions.includes('read')) merged[code].can_view = true;
            if (actions.includes('create')) merged[code].can_create = true;
            if (actions.includes('update')) merged[code].can_edit = true;
            if (actions.includes('delete')) merged[code].can_delete = true;
            if (actions.includes('print') || actions.includes('export')) merged[code].can_print = true;
            
            // تجمیع Data Scopes
            const scopes = typeof p.data_scopes === 'string' ? JSON.parse(p.data_scopes || '{}') : (p.data_scopes || {});
            Object.keys(scopes).forEach(key => {
                if (!merged[code].data_scope[key]) merged[code].data_scope[key] = [];
                merged[code].data_scope[key] = [...new Set([...merged[code].data_scope[key], ...scopes[key]])];
            });
          };

          if (rolePerms) rolePerms.forEach(processPerm);
          if (userPerms) userPerms.forEach(processPerm);

          setPermissions(merged);
        } catch (err) {
          console.error("Error loading permissions:", err);
        } finally {
          setLoading(false);
        }
      };

      loadPermissions();
    }, [userSession]);

    const hasAccess = useCallback((formCode) => {
      if (isFullAccess) return true;
      if (!formCode) return false;
      const target = formCode.trim().toLowerCase();
      return !!(permissions[target] && permissions[target].can_view);
    }, [isFullAccess, permissions]);

    const getActions = useCallback((formCode) => {
      if (isFullAccess) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: true, canPrint: true };
      }
      if (!formCode) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false, canPrint: false };
      }
      const target = formCode.trim().toLowerCase();
      const p = permissions[target];
      if (!p) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false, canPrint: false };
      }
      return { 
        canView: p.can_view, 
        canCreate: p.can_create, 
        canEdit: p.can_edit, 
        canDelete: p.can_delete, 
        canPrint: p.can_print 
      };
    }, [isFullAccess, permissions]);

    const getDataScope = useCallback((formCode) => {
      if (isFullAccess) return ['*']; 
      if (!formCode) return [];
      const target = formCode.trim().toLowerCase();
      const p = permissions[target];
      return p && p.data_scope ? p.data_scope : {};
    }, [isFullAccess, permissions]);

    const value = useMemo(() => ({
      isFullAccess,
      permissions,
      loading,
      hasAccess,
      getActions,
      getDataScope
    }), [isFullAccess, permissions, loading, hasAccess, getActions, getDataScope]);

    if (loading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 font-sans" dir="rtl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-[14px] font-bold text-slate-500 dark:text-slate-400">در حال بررسی سطوح دسترسی و امنیت...</p>
          </div>
        </div>
      );
    }

    return React.createElement(SecurityContext.Provider, { value }, children);
  };

  const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
      throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
  };

  window.SecurityManager = {
    SecurityContext,
    SecurityProvider,
    useSecurity
  };
})();