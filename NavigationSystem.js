/* Filename: NavigationSystem.js */
import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Star, ChevronLeft, LayoutGrid, 
  ListTree, FileText, Bell, Home, Monitor, Menu
} from 'lucide-react';

const NavigationSystem = ({ userPermissions = new Set(), isAdmin = true, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const supabase = window.supabase;

  const [menuData, setMenuData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // User ID موقت برای تست سیستم علاقه‌مندی‌ها بدون احراز هویت
  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchMenuData();
    fetchFavorites();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      // توجه: استفاده مستقیم از جدول در اسکمای پیش‌فرض public
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const filtered = isAdmin 
        ? data 
        : data.filter(item => userPermissions.has(item.unique_code) || item.menu_type !== 'form');
      
      setMenuData(filtered);
      
      // باز کردن خودکار نودهای اصلی
      const initialExpanded = {};
      filtered.filter(m => m.menu_type === 'domain').forEach(m => initialExpanded[m.id] = true);
      setExpandedNodes(initialExpanded);

    } catch (err) {
      console.error("Database fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('menu_id')
        .eq('user_id', MOCK_USER_ID);
        
      if (!error && data) {
        setFavorites(new Set(data.map(f => f.menu_id)));
      }
    } catch(err) {
      console.error("Favorites fetch error:", err);
    }
  };

  const toggleFavorite = async (e, id) => {
    e.stopPropagation();
    const newFavs = new Set(favorites);

    if (newFavs.has(id)) {
      newFavs.delete(id);
      await supabase.from('user_favorites').delete().match({ user_id: MOCK_USER_ID, menu_id: id });
    } else {
      newFavs.add(id);
      await supabase.from('user_favorites').insert({ user_id: MOCK_USER_ID, menu_id: id });
    }
    setFavorites(newFavs);
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

  const DynamicIcon = ({ name, size = 16, className = "" }) => {
    const Icon = LucideIcons[name] || FileText;
    return <Icon size={size} className={className} />;
  };

  // --- Render Sidebar Node (Enterprise Dark Theme) ---
  const renderSidebarNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isFav = favorites.has(node.id);
    
    // رنگ‌بندی بر اساس عمق برای سایدبار تاریک
    const isDomain = depth === 0;
    const paddingVal = depth * 16 + 16;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-2 px-3 mx-2 cursor-pointer transition-colors
            ${isDomain ? 'mt-2 mb-1 rounded text-slate-200 hover:bg-[#2b2b3c]' : 'text-slate-400 hover:text-slate-100'}
            ${!isDomain && node.menu_type !== 'form' ? 'font-bold text-[12px]' : 'text-[12px]'}
          `}
          style={{ paddingRight: `${paddingVal}px` }}
          onClick={() => hasChildren ? toggleNode(node.id) : null}
        >
          {hasChildren ? (
            <div className={`transition-transform duration-200 ${isExpanded ? '-rotate-90 text-indigo-400' : 'text-slate-500'}`}>
              <ChevronLeft size={14} />
            </div>
          ) : <div className="w-3.5" />}
          
          {isDomain && <DynamicIcon name={node.icon} size={16} className="text-indigo-400" />}
          {!isDomain && node.menu_type === 'form' && <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-1" />}
          
          <span className="flex-1 truncate">{node.label_fa}</span>
          
          {node.menu_type === 'form' && (
            <button 
              onClick={(e) => toggleFavorite(e, node.id)}
              className={`transition-opacity ${isFav ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100 hover:text-amber-200'}`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map(child => renderSidebarNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // --- Render Tile View (Enterprise Data Cards) ---
  const renderTileView = () => {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
        {fullTree.map(domain => (
          <div key={domain.id} className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow transition-shadow flex flex-col h-[280px]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50 rounded-t-md">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded">
                <DynamicIcon name={domain.icon} size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-[14px]">{domain.label_fa}</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {domain.children.map(mod => (
                <div key={mod.id} className="mb-3 last:mb-0">
                  <div className="text-[11px] font-bold text-slate-400 mb-1">{mod.label_fa}</div>
                  <div className="space-y-1">
                    {mod.children?.map(sec => (
                      sec.menu_type === 'form' ? (
                        <div key={sec.id} className="text-[12px] text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center gap-2 pr-2 py-1 hover:bg-slate-50 rounded">
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          {sec.label_fa}
                        </div>
                      ) : (
                        sec.children?.map(form => (
                          <div key={form.id} className="text-[12px] text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center gap-2 pr-2 py-1 hover:bg-slate-50 rounded">
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {form.label_fa}
                          </div>
                        ))
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f5f8]">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-[#f4f5f8] overflow-hidden text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Sidebar - Enterprise Dark Theme */}
      {viewMode === 'tree' && sidebarOpen && (
        <aside className="w-[260px] bg-[#1e1e2d] flex flex-col shrink-0 shadow-xl z-30 transition-all">
          {/* Sidebar Header */}
          <div className="h-14 border-b border-[#2b2b3c] flex items-center justify-between px-4 bg-[#1a1a27]">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center">
                <LayoutGrid size={14} />
              </div>
              <span className="text-[13px] tracking-wide">سامانه یکپارچه</span>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            {favorites.size > 0 && (
              <div className="mb-4">
                <div className="px-5 py-2 text-[10px] font-bold text-[#6b6c7f] uppercase">دسترسی سریع</div>
                {[...favorites].map(favId => {
                  const item = menuData.find(m => m.id === favId);
                  if (!item) return null;
                  return (
                    <div key={favId} className="flex items-center gap-2 py-2 px-3 mx-2 hover:bg-[#2b2b3c] rounded text-[12px] text-slate-300 cursor-pointer transition-colors">
                      <Star size={14} className="text-amber-400" fill="currentColor" />
                      <span className="truncate">{item.label_fa}</span>
                    </div>
                  );
                })}
                <div className="h-px bg-[#2b2b3c] mt-2 mx-4" />
              </div>
            )}
            
            <div className="space-y-0.5">
              {fullTree.map(domain => renderSidebarNode(domain))}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f4f5f8]">
        
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors">
              <Menu size={18} />
            </button>
            
            <div className="relative w-full">
              <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'} text-slate-400`} />
              <input 
                placeholder="جستجو در سیستم..."
                className={`w-full h-8 bg-slate-100 border border-transparent rounded text-[12px] ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-700`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg overflow-hidden animate-in fade-in py-1">
                  {filteredItems.length > 0 ? filteredItems.map(item => (
                    <div key={item.id} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                      <div className="font-bold text-slate-700 text-[12px]">{item.label_fa}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.fullPath}</div>
                    </div>
                  )) : <div className="p-4 text-center text-slate-400 text-[11px]">نتیجه‌ای یافت نشد.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode(viewMode === 'tree' ? 'tile' : 'tree')} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[12px] font-bold transition-colors border border-slate-200"
            >
              {viewMode === 'tree' ? <LayoutGrid size={14} /> : <ListTree size={14} />}
              <span>{viewMode === 'tree' ? 'نمایش کاشی' : 'نمایش درختی'}</span>
            </button>
            <div className="w-px h-5 bg-slate-200"></div>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 relative transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-[11px] cursor-pointer shadow-sm">
              PM
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {viewMode === 'tile' ? renderTileView() : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <Monitor size={48} className="text-slate-400 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-slate-700">میز کار سازمانی</h2>
              <p className="text-slate-500 text-[12px] mt-2">جهت شروع عملیات، فرم مورد نظر را از منو انتخاب نمایید.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

window.NavigationSystem = NavigationSystem;
export default NavigationSystem;
