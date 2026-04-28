/* Filename: NavigationSystem.js */
import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Star, ChevronLeft, LayoutGrid, 
  ListTree, FileText, Bell, Home, Monitor, Menu,
  Settings, ChevronRight
} from 'lucide-react';

const NavigationSystem = ({ isAdmin = true, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const supabase = window.supabase;

  const [menuData, setMenuData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'tile'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDomainId, setActiveDomainId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchMenuData();
    fetchFavorites();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMenuData(data);
      
      // انتخاب اولین حوزه به صورت پیش‌فرض
      const firstDomain = data.find(m => m.menu_type === 'domain');
      if (firstDomain) setActiveDomainId(firstDomain.id);
      
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('menu_id')
        .eq('user_id', MOCK_USER_ID);
      if (data) setFavorites(new Set(data.map(f => f.menu_id)));
    } catch(err) {}
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

  // تفکیک حوزه‌ها از بقیه منوها
  const domains = useMemo(() => menuData.filter(m => m.menu_type === 'domain'), [menuData]);
  
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  // درختی که فقط شامل حوزه فعال است
  const activeTree = useMemo(() => {
    if (!activeDomainId) return [];
    return buildTree(menuData, activeDomainId);
  }, [menuData, activeDomainId]);

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DynamicIcon = ({ name, size = 18, className = "" }) => {
    const Icon = LucideIcons[name] || FileText;
    return <Icon size={size} className={className} />;
  };

  // --- Render Functions ---
  
  const renderSidebarNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isFav = favorites.has(node.id);
    const isSelected = false; // فعلاً برای دمو

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-2 px-3 mx-2 my-0.5 cursor-pointer rounded-lg transition-all group
            ${depth === 0 ? 'font-bold text-slate-700 hover:bg-slate-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'}
            ${isSelected ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600' : ''}
          `}
          style={{ paddingRight: `${depth * 12 + 8}px` }}
          onClick={() => hasChildren ? toggleNode(node.id) : null}
        >
          {hasChildren ? (
            <div className={`transition-transform duration-200 ${isExpanded ? '-rotate-90 text-indigo-500' : 'text-slate-300'}`}>
              <ChevronLeft size={14} strokeWidth={3} />
            </div>
          ) : <div className="w-3.5" />}
          
          <span className={`flex-1 truncate ${depth === 0 ? 'text-[13px]' : 'text-[12px]'}`}>
            {node.label_fa}
          </span>
          
          {node.menu_type === 'form' && (
            <button 
              onClick={(e) => toggleFavorite(e, node.id)}
              className={`transition-all ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-300'}`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            {node.children.map(child => renderSidebarNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFioriTiles = () => {
    return (
      <div className="p-8 space-y-12 animate-in fade-in duration-500">
        {activeTree.map(group => (
          <div key={group.id} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{group.label_fa}</h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {group.children?.length || 0} مورد
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {group.children?.map(item => (
                <div 
                  key={item.id}
                  className="aspect-square bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[100%] -mr-6 -mt-6 group-hover:bg-indigo-50 transition-colors"></div>
                  
                  <div className="z-10 text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <DynamicIcon name={item.icon || 'FileText'} size={28} strokeWidth={1.5} />
                  </div>
                  
                  <div className="z-10">
                    <div className="text-[13px] font-black text-slate-700 leading-tight group-hover:text-indigo-900 truncate">
                      {item.label_fa}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      {item.menu_type === 'form' ? 'فرم عملیاتی' : 'زیرمجموعه'}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className={`absolute top-3 left-3 z-20 transition-all ${favorites.has(item.id) ? 'text-amber-400 scale-110' : 'opacity-0 group-hover:opacity-100 text-slate-200 hover:text-amber-200'}`}
                  >
                    <Star size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return null;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Slim Domain Bar (Right Side) */}
      <nav className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 shrink-0 z-40 shadow-2xl">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-900/20">
          <Home size={24} />
        </div>
        {domains.map(domain => (
          <button
            key={domain.id}
            onClick={() => setActiveDomainId(domain.id)}
            className={`
              relative group flex flex-col items-center gap-1 transition-all
              ${activeDomainId === domain.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all
              ${activeDomainId === domain.id ? 'bg-slate-800 shadow-inner' : 'hover:bg-slate-800/50'}
            `}>
              <DynamicIcon name={domain.icon} size={22} strokeWidth={activeDomainId === domain.id ? 2.5 : 1.5} />
            </div>
            <span className="text-[9px] font-bold text-center px-1 opacity-70 group-hover:opacity-100">
              {domain.label_fa.split(' ')[1] || domain.label_fa}
            </span>
            {activeDomainId === domain.id && (
              <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>
            )}
          </button>
        ))}
        <div className="mt-auto pt-6 border-t border-slate-800 w-10 flex flex-col items-center gap-6">
          <button className="text-slate-500 hover:text-white transition-colors"><Settings size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-[10px]">PM</div>
        </div>
      </nav>

      {/* 2. Main Sidebar (The Tree) */}
      {sidebarOpen && viewMode === 'tree' && (
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 shadow-sm">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50">
            <h2 className="font-black text-slate-800 tracking-tight">
              {domains.find(d => d.id === activeDomainId)?.label_fa || 'منوی سیستم'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
            {/* Quick Access / Favorites */}
            {favorites.size > 0 && (
              <div className="mb-8">
                <div className="px-6 mb-3 flex items-center gap-2">
                  <Star size={12} className="text-amber-400" fill="currentColor" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">دسترسی سریع</span>
                </div>
                {menuData.filter(m => favorites.has(m.id)).map(fav => (
                  <div key={fav.id} className="px-6 py-1.5 flex items-center gap-3 text-[12px] text-slate-600 hover:text-indigo-600 cursor-pointer group">
                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                    <span className="truncate">{fav.label_fa}</span>
                  </div>
                ))}
                <div className="mx-6 mt-4 border-b border-slate-100"></div>
              </div>
            )}

            <div className="space-y-1">
              {activeTree.map(node => renderSidebarNode(node))}
            </div>
          </div>
        </aside>
      )}

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-6 w-full max-w-2xl">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative w-full">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-slate-400`} />
              <input 
                placeholder="جستجو در تمام فرم‌ها، گزارش‌ها و کدهای سیستم..."
                className={`w-full h-11 bg-slate-100/50 border border-transparent rounded-xl text-[13px] ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 py-2 z-50">
                  {filteredItems.length > 0 ? filteredItems.map(item => (
                    <div key={item.id} className="px-5 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-all flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[13px]">{item.label_fa}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{item.fullPath}</div>
                      </div>
                      <ChevronLeft size={14} className="text-slate-300" />
                    </div>
                  )) : <div className="p-8 text-center text-slate-400 text-[12px] font-bold">نتیجه‌ای یافت نشد.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ListTree size={14} />
                <span>درختی</span>
              </button>
              <button 
                onClick={() => setViewMode('tile')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${viewMode === 'tile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={14} />
                <span>کاشی (Fiori)</span>
              </button>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 relative transition-all">
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === 'tile' ? renderFioriTiles() : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-32 h-32 bg-indigo-50 rounded-full mb-8 flex items-center justify-center animate-pulse">
                <Monitor size={56} className="text-indigo-200" strokeWidth={1} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">میز کار متمرکز {domains.find(d => d.id === activeDomainId)?.label_fa}</h2>
              <p className="text-slate-500 text-[13px] mt-4 max-w-sm leading-relaxed font-medium">
                شما در حال حاضر در حوزه <span className="text-indigo-600 font-black">"{domains.find(d => d.id === activeDomainId)?.label_fa}"</span> هستید. 
                فرم مورد نظر خود را از لیست درختی یا حالت کاشی انتخاب کنید.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

window.NavigationSystem = NavigationSystem;
export default NavigationSystem;
