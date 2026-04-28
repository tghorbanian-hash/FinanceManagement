/* Filename: NavigationSystem.js */
import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Star, ChevronRight, LayoutGrid, 
  ListTree, FileText, Bell, Home, Monitor
} from 'lucide-react';

const NavigationSystem = ({ userPermissions = new Set(), isAdmin = false, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const supabase = window.supabase;

  const [menuData, setMenuData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuData();
    fetchFavorites();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('gen')
        .from('menus')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      const filtered = isAdmin 
        ? data 
        : data.filter(item => userPermissions.has(item.unique_code) || item.menu_type !== 'form');
      
      setMenuData(filtered);
    } catch (err) {
      console.error("Error fetching menu from DB, falling back to mock data:", err);
      // Mock data fallback for UI testing before DB is populated
      setMenuData([
        { id: '1', parent_id: null, unique_code: 'FIN', label_fa: 'حوزه مالی', menu_type: 'domain', icon: 'PieChart', display_order: 1 },
        { id: '2', parent_id: '1', unique_code: 'FIN_GL', label_fa: 'دفتر کل', menu_type: 'module', display_order: 1 },
        { id: '3', parent_id: '2', unique_code: 'GL_VOUCHER', label_fa: 'ثبت سند حسابداری', menu_type: 'form', display_order: 1 },
        { id: '4', parent_id: '1', unique_code: 'FIN_TAX', label_fa: 'امور مالیاتی', menu_type: 'module', display_order: 2 },
        { id: '5', parent_id: null, unique_code: 'HR', label_fa: 'سرمایه انسانی', menu_type: 'domain', icon: 'Users', display_order: 2 },
        { id: '6', parent_id: '5', unique_code: 'HR_PER', label_fa: 'اطلاعات پرسنلی', menu_type: 'form', display_order: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      // Assuming a default user ID for now, this will be tied to actual Auth later
      const userId = '00000000-0000-0000-0000-000000000000'; 
      const { data, error } = await supabase
        .schema('gen')
        .from('user_favorites')
        .select('menu_id')
        .eq('user_id', userId);
        
      if (!error && data) {
        setFavorites(new Set(data.map(f => f.menu_id)));
      } else {
        const saved = localStorage.getItem('user_favs');
        if (saved) setFavorites(new Set(JSON.parse(saved)));
      }
    } catch(err) {
      const saved = localStorage.getItem('user_favs');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const toggleFavorite = async (e, id) => {
    e.stopPropagation();
    const newFavs = new Set(favorites);
    const userId = '00000000-0000-0000-0000-000000000000';

    if (newFavs.has(id)) {
      newFavs.delete(id);
      try {
        await supabase.schema('gen').from('user_favorites').delete().match({ user_id: userId, menu_id: id });
      } catch (err) {}
    } else {
      newFavs.add(id);
      try {
        await supabase.schema('gen').from('user_favorites').insert({ user_id: userId, menu_id: id });
      } catch (err) {}
    }
    
    setFavorites(newFavs);
    localStorage.setItem('user_favs', JSON.stringify([...newFavs]));
  };

  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  const fullTree = useMemo(() => buildTree(menuData), [menuData]);

  const flattenedForms = useMemo(() => {
    const forms = [];
    const traverse = (node, path = []) => {
      const currentPath = [...path, node.label_fa];
      if (node.menu_type === 'form') {
        forms.push({ ...node, fullPath: currentPath.join(' / ') });
      }
      if (node.children) node.children.forEach(c => traverse(c, currentPath));
    };
    fullTree.forEach(domain => traverse(domain));
    return forms;
  }, [fullTree]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    return flattenedForms.filter(f => 
      f.label_fa.includes(searchTerm) || 
      (f.unique_code && f.unique_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, flattenedForms]);

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DynamicIcon = ({ name, size = 18, className = "" }) => {
    const Icon = LucideIcons[name] || FileText;
    return <Icon size={size} className={className} />;
  };

  const renderSidebarNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isFav = favorites.has(node.id);

    return (
      <div key={node.id} className="select-none mb-0.5">
        <div 
          className={`
            flex items-center gap-2 py-2.5 px-3 cursor-pointer transition-all rounded-xl group
            ${depth === 0 ? 'mt-2 font-black text-slate-800' : 'text-slate-600 hover:bg-slate-50 font-medium'}
          `}
          style={{ paddingRight: `${depth * 20 + 12}px` }}
          onClick={() => hasChildren ? toggleNode(node.id) : null}
        >
          {hasChildren ? (
            <div className={`transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`}>
              <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} strokeWidth={3} />
            </div>
          ) : <div className="w-3.5" />}
          
          <DynamicIcon name={node.icon} size={depth === 0 ? 20 : 16} className={depth === 0 ? 'text-indigo-600' : 'text-slate-400 opacity-0'} />
          <span className="flex-1 text-[13px]">{node.label_fa}</span>
          
          {node.menu_type === 'form' && (
            <button 
              onClick={(e) => toggleFavorite(e, node.id)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ${isFav ? 'opacity-100 text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
            >
              <Star size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}

          {node.has_badge && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">۳</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="overflow-hidden animate-in slide-in-from-top-1">
            {node.children.map(child => renderSidebarNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTileView = () => {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
        {fullTree.map(domain => (
          <div key={domain.id} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
            <div className="flex items-center gap-5 mb-6">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <DynamicIcon name={domain.icon} size={24} strokeWidth={2.5} />
              </div>
              <h3 className="font-black text-slate-800 text-xl">{domain.label_fa}</h3>
            </div>
            <div className="space-y-3">
              {domain.children.slice(0, 4).map(child => (
                <div key={child.id} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                  <span>{child.label_fa}</span>
                </div>
              ))}
              {domain.children.length > 4 && (
                <div className="text-xs text-indigo-400 font-bold mt-4 pt-4 border-t border-slate-50">
                  مشاهده همه {domain.children.length} فرم...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-slate-50 overflow-hidden text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar - Tree Mode */}
      {viewMode === 'tree' && (
        <aside className="w-[300px] bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all shadow-sm z-30">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3 text-indigo-700 font-black">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Home size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm tracking-wide">سامانه هوشمند</span>
            </div>
            <button onClick={() => setViewMode('tile')} title="نمایش کاشی‌وار" className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {favorites.size > 0 && (
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">علاقه‌مندی‌ها</h4>
                {[...favorites].map(favId => {
                  const item = menuData.find(m => m.id === favId);
                  if (!item) return null;
                  return (
                    <div key={favId} className="flex items-center gap-3 p-2.5 hover:bg-amber-50 rounded-xl text-[13px] text-slate-700 cursor-pointer transition-all border border-transparent hover:border-amber-100 mb-1 font-medium">
                      <Star size={14} className="text-amber-500" fill="currentColor" />
                      <span>{item.label_fa}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="h-px bg-slate-100 mb-6" />
            
            <div className="space-y-1">
              {fullTree.map(domain => renderSidebarNode(domain))}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="relative w-full max-w-md">
            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-slate-400`} />
            <input 
              placeholder="جستجوی سریع فرم‌ها و کدها..."
              className={`w-full h-10 bg-slate-100 border-none rounded-xl text-sm ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 py-2">
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <div key={item.id} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                    <div className="font-bold text-slate-800 text-[13px]">{item.label_fa}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">{item.fullPath}</div>
                  </div>
                )) : <div className="p-6 text-center text-slate-400 text-xs font-medium">نتیجه‌ای یافت نشد.</div>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            {viewMode === 'tile' && (
              <button onClick={() => setViewMode('tree')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                <ListTree size={16} />
                <span>نمایش درختی</span>
              </button>
            )}
            <div className="w-px h-6 bg-slate-200"></div>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-black text-xs uppercase cursor-pointer">
              US
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === 'tile' ? renderTileView() : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-32 h-32 bg-slate-200 rounded-full mb-8 flex items-center justify-center">
                <Monitor size={56} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">آماده شروع فرآیند</h2>
              <p className="text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">فرم مورد نظر را از منوی سمت راست انتخاب کنید یا از جستجوی سریع استفاده نمایید.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

window.NavigationSystem = NavigationSystem;
export default NavigationSystem;
