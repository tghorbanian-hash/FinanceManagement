/* Filename: security/SecurityContext.js */
(() => {
  const React = window.React;
  const { createContext, useState, useEffect, useContext } = React;

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
          
          const { data: userPerms, error: err1 } = await supabase
            .from('sec_user_permissions')
            .select('*')
            .eq('user_id', userSession.id);

          const { data: userRoles, error: err2 } = await supabase
            .from('sec_user_roles')
            .select('role_id')
            .eq('user_id', userSession.id);

          let rolePerms = [];
          if (userRoles && userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.role_id);
            const { data: rPerms, error: err3 } = await supabase
              .from('sec_role_permissions')
              .select('*')
              .in('role_id', roleIds);
            if (rPerms) {
              rolePerms = rPerms;
            }
          }

          const merged = {};

          const mergeRow = (row) => {
            const code = row.form_code;
            if (!merged[code]) {
              merged[code] = {
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_print: false,
                data_scope: [] 
              };
            }
            
            if (row.can_view) merged[code].can_view = true;
            if (row.can_create) merged[code].can_create = true;
            if (row.can_edit) merged[code].can_edit = true;
            if (row.can_delete) merged[code].can_delete = true;
            if (row.can_print) merged[code].can_print = true;
            
            if (row.data_scope) {
              let scopes = [];
              if (Array.isArray(row.data_scope)) {
                scopes = row.data_scope;
              } else if (typeof row.data_scope === 'string') {
                scopes = row.data_scope.split(',').map(s => s.trim());
              }
              merged[code].data_scope = [...new Set([...merged[code].data_scope, ...scopes])];
            }
          };

          if (rolePerms) rolePerms.forEach(mergeRow);
          if (userPerms) userPerms.forEach(mergeRow);

          setPermissions(merged);
        } catch (err) {
          console.error("Error loading permissions:", err);
        } finally {
          setLoading(false);
        }
      };

      loadPermissions();
    }, [userSession]);

    const hasAccess = (formCode) => {
      if (isFullAccess) return true;
      return !!(permissions[formCode] && permissions[formCode].can_view);
    };

    const getActions = (formCode) => {
      if (isFullAccess) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: true, canPrint: true };
      }
      const p = permissions[formCode];
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
    };

    const getDataScope = (formCode) => {
      if (isFullAccess) return ['*']; 
      const p = permissions[formCode];
      return p && p.data_scope && p.data_scope.length > 0 ? p.data_scope : [];
    };

    const value = {
      isFullAccess,
      permissions,
      loading,
      hasAccess,
      getActions,
      getDataScope
    };

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