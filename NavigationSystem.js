/* Filename: NavigationSystem.js */
import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Star, ChevronLeft, ChevronRight, LayoutGrid, 
  ListTree, FileText, Bell, Monitor, Menu, Clock,
  Settings, ArrowRight
} from 'lucide-react';

const NavigationSystem = ({ isAdmin = true, language = 'fa' }) => {
  const isRtl = language === 'fa';
  const supabase = window.supabase;

  const [menuData, setMenuData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [recents, setRecents] = useState([]);
  
  const [viewMode, setViewMode] = useState('tile');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [activeDomainId, setActiveDomainId] = useState('HOME_FAV');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // برای تاریخچه کاشی‌ها (Drill-down)
  const [tileHistory, setTileHistory] = useState([]);

  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchMenuData();
    fetchFavorites();
    
    const savedRecents = localStorage.getItem('sys_recents');
    if (savedRecents) {
      setRecents(JSON.parse(savedRecents));
    }
  }, []);

  // Reset tile history when domain changes
  useEffect(() => {
    setTileHistory([]);
  }, [activeDomainId]);

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

  // Optimistic UI Update for Favorites (بدون تاخیر)
  const toggleFavorite = async (e, id) => {
    e.stopPropagation();
    const newFavs = new Set(favorites);
    const isAdding = !newFavs.has(id);
    
    if (isAdding) newFavs.add(id);
    else newFavs.delete(id);
    
    setFavorites(newFavs); // آپدیت فوری رابط کاربری

    // فراخوانی دیتابیس در پس‌زمینه
    try {
      if (isAdding) {
        await supabase.from('user_favorites').insert({ user_id: MOCK_USER_ID, menu_id: id });
      } else {
        await supabase.from('user_favorites').delete().match({ user_id: MOCK_USER_ID, menu_id: id });
      }
    } catch (err) {
      console.error("Fav sync error", err);
    }
  };

  const handleFormClick = (formId) => {
    // بروزرسانی بازدیدهای اخیر
    const newRecents = [formId, ...recents.filter(id => id !== formId)].slice(0, 10);
    setRecents(newRecents);
    localStorage.setItem('sys_recents', JSON.stringify(newRecents));
    
    // اینجا کد مربوط به باز کردن فرم قرار می‌گیرد
    console.log("Opening form:", formId);
  };

  const handleTileClick = (item) => {
    if (item.menu_type === 'form') {
      handleFormClick(item.id);
    } else if (item.children && item.children.length > 0) {
      setTileHistory([...tileHistory, item.id]);
    }
  };

  const domains = useMemo(() => menuData.filter(m => m.menu_type === 'domain'), [menuData]);
  
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  const fullTree = useMemo(() => buildTree(menuData), [menuData]);

  // منطق جستجو (حل ارور filteredItems)
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

  const activeTree = useMemo(() => {
    if (activeDomainId === 'HOME_FAV') return [];
    return buildTree(menuData, activeDomainId);
  }, [menuData, activeDomainId]);

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DynamicIcon = ({ name, size = 18, className = "" }) => {
    const Icon = LucideIcons[name] || FileText;
    return <Icon size={size} className={className} />;
  };

  const findNode = (nodes, id) => {
    for (let n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        let found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // --- رندر سایدبار درختی ---
  const renderSidebarNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isFav = favorites.has(node.id);
    const isForm = node.menu_type === 'form';

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-2 px-3 mx-2 my-0.5 cursor-pointer rounded-lg transition-all group
            ${depth === 0 ? 'font-bold text-slate-800 hover:bg-slate-100' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}
          `}
          style={{ paddingRight: `${depth * 14 + 10}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            else if (isForm) handleFormClick(node.id);
          }}
        >
          {hasChildren ? (
            <div className={`transition-transform duration-200 ${isExpanded ? '-rotate-90 text-indigo-500' : 'text-slate-400'}`}>
              <ChevronLeft size={14} strokeWidth={2.5} />
            </div>
          ) : <div className="w-3.5" />}
          
          <span className={`flex-1 truncate ${depth === 0 ? 'text-[13px]' : 'text-[12px]'}`}>
            {node.label_fa}
          </span>
          
          {/* فقط فرم‌ها قابلیت ستاره‌دار شدن دارند */}
          {isForm && (
            <button 
              onClick={(e) => toggleFavorite(e, node.id)}
              className={`transition-all p-1 ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}
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

  // --- رندر کاشی‌های استاندارد (نصف سایز) ---
  const renderTileCard = (item) => {
    const isForm = item.menu_type === 'form';
    const isFav = favorites.has(item.id);

    return (
      <div 
        key={item.id}
        onClick={() => handleTileClick(item)}
        className="h-24 bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-start justify-between z-10">
          <div className={`p-1.5 rounded-lg transition-colors ${isForm ? 'bg-slate-50 text-slate-500 group-hover:text-indigo-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <DynamicIcon name={item.icon || (isForm ? 'FileText' : 'Folder')} size={18} strokeWidth={2} />
          </div>
          {isForm && (
            <button 
              onClick={(e) => toggleFavorite(e, item.id)}
              className={`z-20 p-1 transition-all ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}
            >
              <Star size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        
        <div className="z-10 mt-2">
          <div className="text-[12px] font-bold text-slate-700 leading-tight group-hover:text-indigo-700 line-clamp-2">
            {item.label_fa}
          </div>
        </div>
      </div>
    );
  };

  // --- رندر نمای کاشی‌ها با پشتیبانی از Drill-down ---
  const renderFioriTiles = () => {
    const currentParentId = tileHistory.length > 0 ? tileHistory[tileHistory.length - 1] : activeDomainId;
    const currentParentNode = findNode(fullTree, currentParentId);
    const nodesToRender = currentParentNode ? currentParentNode.children : activeTree;

    return (
      <div className="p-6 animate-in fade-in duration-300">
        {tileHistory.length > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <button 
              onClick={() => setTileHistory(tileHistory.slice(0, -1))}
              className="flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <ArrowRight size={14} />
              <span>بازگشت</span>
            </button>
            <span className="text-slate-400 text-[12px] font-medium px-2">/</span>
            <span className="text-[13px] font-bold text-slate-800">{currentParentNode?.label_fa}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {nodesToRender?.map(renderTileCard)}
        </div>
        
        {(!nodesToRender || nodesToRender.length === 0) && (
          <div className="text-center text-slate-400 py-10 text-[13px]">گزینه‌ای برای نمایش وجود ندارد.</div>
        )}
      </div>
    );
  };

  // --- رندر صفحه اختصاصی خانه / علاقه‌مندی‌ها ---
  const renderHomeView = () => {
    const favItems = menuData.filter(m => favorites.has(m.id));
    const recentItems = recents.map(id => menuData.find(m => m.id === id)).filter(Boolean);

    return (
      <div className="p-8 space-y-10 animate-in fade-in">
        {/* بخش بازدیدهای اخیر */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Clock size={18} className="text-indigo-500" strokeWidth={2.5} />
            <h2 className="text-[15px] font-black text-slate-800">بازدیدهای اخیر</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recentItems.length > 0 ? recentItems.map(renderTileCard) : (
              <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[12px]">
                شما هنوز از فرمی بازدید نکرده‌اید.
              </div>
            )}
          </div>
        </section>

        {/* بخش علاقه‌مندی‌ها */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Star size={18} className="text-amber-500" fill="currentColor" />
            <h2 className="text-[15px] font-black text-slate-800">فرم‌های منتخب (علاقه‌مندی‌ها)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favItems.length > 0 ? favItems.map(renderTileCard) : (
              <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[12px]">
                فرمی به علاقه‌مندی‌ها اضافه نشده است.
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Domain Bar (رنگ روشن شیک، جدا شده با بردر، بدون نقطه و متن) */}
      <nav className="w-16 bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-3 shrink-0 z-40 shadow-sm">
        
        {/* دکمه اختصاصی خانه / علاقه‌مندی‌ها */}
        <button
          onClick={() => setActiveDomainId('HOME_FAV')}
          className={`
            relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all mb-4
            ${activeDomainId === 'HOME_FAV' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}
          `}
        >
          <Star size={20} fill={activeDomainId === 'HOME_FAV' ? "currentColor" : "none"} />
          <div className="absolute right-full mr-3 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            میز کار و علاقه‌مندی‌ها
          </div>
        </button>

        {domains.map(domain => (
          <button
            key={domain.id}
            onClick={() => setActiveDomainId(domain.id)}
            className={`
              relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all
              ${activeDomainId === domain.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            <DynamicIcon name={domain.icon} size={20} strokeWidth={activeDomainId === domain.id ? 2.5 : 1.5} />
            {/* تولتیپ شناور */}
            <div className="absolute right-full mr-3 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {domain.label_fa}
            </div>
          </button>
        ))}

        <div className="mt-auto flex flex-col items-center gap-4">
          <button className="text-slate-400 hover:text-slate-600 transition-colors"><Settings size={18} /></button>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-[10px] cursor-pointer hover:bg-slate-200 transition-colors">PM</div>
        </div>
      </nav>

      {/* 2. Main Sidebar Tree (با قابلیت جمع شدن) */}
      <aside 
        className={`bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 border-l-0 overflow-hidden opacity-0'}`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
          <h2 className="font-black text-slate-800 tracking-tight text-[13px]">
            {activeDomainId === 'HOME_FAV' ? 'میز کار اختصاصی' : domains.find(d => d.id === activeDomainId)?.label_fa}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {activeDomainId === 'HOME_FAV' ? (
            <div className="p-5 text-center text-slate-400 text-[12px] leading-loose">
              جهت مشاهده منوهای درختی، یک حوزه را از نوار سمت راست انتخاب کنید.
            </div>
          ) : (
            <div className="space-y-0.5">
              {activeTree.map(node => renderSidebarNode(node))}
            </div>
          )}
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all active:scale-95"
              title={sidebarOpen ? "بستن منو" : "باز کردن منو"}
            >
              <Menu size={18} />
            </button>
            
            <div className="relative w-full">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'} text-slate-400`} />
              <input 
                placeholder="جستجو در تمام سیستم..."
                className={`w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-[12px] ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-700`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 py-2 z-50">
                  {filteredItems.length > 0 ? filteredItems.map(item => (
                    <div key={item.id} onClick={() => {handleFormClick(item.id); setSearchTerm('');}} className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-all flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[12px]">{item.label_fa}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.fullPath}</div>
                      </div>
                      <ChevronLeft size={14} className="text-slate-300" />
                    </div>
                  )) : <div className="p-6 text-center text-slate-400 text-[11px]">نتیجه‌ای یافت نشد.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ListTree size={14} />
                <span>درختی</span>
              </button>
              <button 
                onClick={() => setViewMode('tile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'tile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid size={14} />
                <span>کاشی</span>
              </button>
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative transition-all">
              <Bell size={18} strokeWidth={2} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeDomainId === 'HOME_FAV' ? renderHomeView() : (
            viewMode === 'tile' ? renderFioriTiles() : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-full mb-6 flex items-center justify-center shadow-sm">
                  <Monitor size={40} className="text-slate-300" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-black text-slate-700">میز کار متمرکز {domains.find(d => d.id === activeDomainId)?.label_fa}</h2>
                <p className="text-slate-500 text-[12px] mt-3 max-w-sm leading-relaxed">
                  فرم مورد نظر خود را از لیست درختی سمت راست انتخاب کنید.
                </p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

window.NavigationSystem = NavigationSystem;
export default NavigationSystem;
