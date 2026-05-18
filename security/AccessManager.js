/* Filename: security/AccessManager.js */
(() => {
  let isInitialized = false;
  let isAdminUser = false;
  let userPermissions = {};

  const init = async (userId, username) => {
    const supabase = window.supabase;
    isAdminUser = (username === 'admin' || username === 'superadmin');
    
    if (isAdminUser) {
      isInitialized = true;
      return true;
    }

    try {
      const { data: userRoles } = await supabase
        .from('sec_user_roles')
        .select('role_id')
        .eq('user_id', userId);
        
      const roleIds = userRoles ? userRoles.map(ur => ur.role_id) : [];

      let query = supabase.from('sec_permissions').select('*');
      
      if (roleIds.length > 0) {
        query = query.or(`user_id.eq.${userId},role_id.in.(${roleIds.join(',')})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: perms } = await query;
      const merged = {};
      
      if (perms) {
        perms.forEach(p => {
          const menuId = p.menu_id;
          if (!merged[menuId]) {
            merged[menuId] = { actions: new Set(), scopes: {} };
          }
          
          const pActions = typeof p.actions === 'string' ? JSON.parse(p.actions || '[]') : (p.actions || []);
          pActions.forEach(a => merged[menuId].actions.add(a));
          
          const pScopes = typeof p.data_scopes === 'string' ? JSON.parse(p.data_scopes || '{}') : (p.data_scopes || {});
          Object.keys(pScopes).forEach(scopeKey => {
            if (!merged[menuId].scopes[scopeKey]) merged[menuId].scopes[scopeKey] = new Set();
            const scopeVals = pScopes[scopeKey] || [];
            scopeVals.forEach(v => merged[menuId].scopes[scopeKey].add(v));
          });
        });
      }

      Object.keys(merged).forEach(mId => {
         merged[mId].actions = Array.from(merged[mId].actions);
         Object.keys(merged[mId].scopes).forEach(sKey => {
            merged[mId].scopes[sKey] = Array.from(merged[mId].scopes[sKey]);
         });
      });

      userPermissions = merged;
      isInitialized = true;
      return true;

    } catch (err) {
      console.error("AccessManager Init Error:", err);
      return false;
    }
  };

  const hasAccessToForm = (menuId) => {
    if (isAdminUser) return true;
    return !!userPermissions[menuId];
  };

  const hasAction = (menuId, actionId) => {
    if (isAdminUser) return true;
    if (!userPermissions[menuId]) return false;
    return userPermissions[menuId].actions.includes(actionId);
  };

  const getDataScope = (menuId, scopeKey) => {
    if (isAdminUser) return 'ALL';
    if (!userPermissions[menuId]) return [];
    return userPermissions[menuId].scopes[scopeKey] || [];
  };

  const applyScopeToQuery = (menuId, scopeKey, query, dbColumn) => {
    if (isAdminUser) return query;
    const allowedIds = getDataScope(menuId, scopeKey);
    if (allowedIds.length === 0) {
        return query.in(dbColumn, ['00000000-0000-0000-0000-000000000000']);
    }
    return query.in(dbColumn, allowedIds);
  };

  const filterLOVData = (menuId, scopeKey, dataArray, idField = 'id') => {
    if (isAdminUser) return dataArray;
    const allowedIds = getDataScope(menuId, scopeKey);
    if (allowedIds.length === 0) return [];
    return dataArray.filter(item => allowedIds.includes(item[idField]));
  };

  window.AccessManager = {
    init,
    hasAccessToForm,
    hasAction,
    getDataScope,
    applyScopeToQuery,
    filterLOVData,
    getRawPermissions: () => userPermissions
  };
})();