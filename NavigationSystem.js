/* Filename: NavigationSystem.js */
import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Star, ChevronLeft, ChevronRight, LayoutGrid, 
  ListTree, FileText, Bell, Monitor, Clock,
  Settings, ArrowLeft
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

  const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchMenuData();
    fetchFavorites();
    
    const savedRecents = localStorage.getItem('sys_recents');
    if (savedRecents) {
      setRecents(JSON.parse(savedRecents));
    }
  }, []);

  useEffect(() => {
    setExpandedNodes({});
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

  const toggleFavorite = async (e, id) => {
    e.stopPropagation();
    
    const node = menuData.find(m => m.id === id);
    if (!node || node.menu_type !== 'form') return;

    const newFavs = new Set(favorites);
    const isAdding = !newFavs.has(id);
    
    if (isAdding) newFavs.add(id);
    else newFavs.delete(id);
    
    setFavorites(newFavs);

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
    const newRecents = [formId, ...recents.filter(id => id !== formId)].slice(0, 10);
    setRecents(newRecents);
    localStorage.setItem('sys_recents', JSON.stringify(newRecents));
    console.log("Opening form:", formId);
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

  const getAllForms = (node) => {
    let forms = [];
    if (node.menu_type === 'form') forms.push(node);
    if (node.children) {
      node.children.forEach(c => { forms = forms.concat(getAllForms(c)); });
    }
    return forms;
  };

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DynamicIcon = ({ name, size = 18, className = "" }) => {
    const Icon = LucideIcons[name] || FileText;
    return <Icon size={size} className={className} />;
  };

  const showSidebar = viewMode === 'tree' && activeDomainId !== 'HOME_FAV';

  const renderSidebarNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isForm = node.menu_type === 'form';
    const isFav = isForm && favorites.has(node.id);

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
          
          {isForm && (
            <button 
              onClick={(e) => toggleFavorite(e, node.id)}
              className={`transition-all p-1 ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}
              title="افزودن به علاقه‌مندی‌ها"
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

  const renderTileCard = (item) => {
    const isFav = favorites.has(item.id);

    return (
      <div 
        key={item.id}
        onClick={() => handleFormClick(item.id)}
        className="aspect-square bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-start justify-between z-10">
          <div className="p-1.5 rounded-lg transition-colors bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <DynamicIcon name={item.icon || 'FileText'} size={18} strokeWidth={2} />
          </div>
          <button 
            onClick={(e) => toggleFavorite(e, item.id)}
            className={`z-20 p-1 transition-all ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}
          >
            <Star size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="z-10 mt-auto pt-2">
          <div className="text-[11px] font-bold text-slate-700 leading-snug group-hover:text-indigo-700 whitespace-normal break-words">
            {item.label_fa}
          </div>
        </div>
      </div>
    );
  };

  const renderFioriTiles = () => {
    const directForms = [];
    const groupedModules = [];

    activeTree.forEach(node => {
      if (node.menu_type === 'form') directForms.push(node);
      else groupedModules.push(node);
    });

    return (
      <div className="p-8 space-y-10 animate-in fade-in duration-300">
        
        {directForms.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <h3 className="text-[15px] font-black text-slate-800">فرم‌های مستقل</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {directForms.map(renderTileCard)}
            </div>
          </section>
        )}

        {groupedModules.map(moduleNode => {
          const sections = [];
          const moduleDirectForms = [];

          (moduleNode.children || []).forEach(child => {
            if (child.menu_type === 'form') moduleDirectForms.push(child);
            else sections.push(child);
          });

          const allNested = getAllForms(moduleNode);
          if (allNested.length === 0) return null;

          return (
            <section key={moduleNode.id} className="space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <h3 className="text-[15px] font-black text-slate-800">{moduleNode.label_fa}</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {allNested.length} فرم
                </span>
              </div>
              
              <div className="space-y-4 pt-1">
                {moduleDirectForms.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-28 shrink-0 pt-2 font-bold text-slate-500 text-[12px]">عمومی</div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                      {moduleDirectForms.map(renderTileCard)}
                    </div>
                  </div>
                )}

                {sections.map(section => {
                  const sectionForms = getAllForms(section);
                  if (sectionForms.length === 0) return null;
                  return (
                    <div key={section.id} className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-28 shrink-0 pt-2 font-bold text-slate-600 text-[12px] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                        <span className="leading-tight">{section.label_fa}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                        {sectionForms.map(renderTileCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {activeTree.length === 0 && (
          <div className="text-center text-slate-400 py-10 text-[13px]">فرمی جهت نمایش وجود ندارد.</div>
        )}
      </div>
    );
  };

  const renderHomeView = () => {
    const favItems = menuData.filter(m => favorites.has(m.id) && m.menu_type === 'form');
    const recentItems = recents.map(id => menuData.find(m => m.id === id)).filter(Boolean);

    return (
      <div className="p-8 space-y-10 animate-in fade-in">
        <section>
          <div className="flex items-center gap-2 mb-4 px-1 border-b border-slate-200 pb-2">
            <Clock size={18} className="text-indigo-500" strokeWidth={2.5} />
            <h2 className="text-[15px] font-black text-slate-800">بازدیدهای اخیر</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {recentItems.length > 0 ? recentItems.map(renderTileCard) : (
              <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[12px]">
                شما هنوز از فرمی بازدید نکرده‌اید.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 px-1 border-b border-slate-200 pb-2">
            <Star size={18} className="text-amber-500" fill="currentColor" />
            <h2 className="text-[15px] font-black text-slate-800">فرم‌های منتخب (علاقه‌مندی‌ها)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
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
      
      <nav className="w-16 bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-3 shrink-0 z-40 shadow-sm relative">
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

      {showSidebar && (
        <aside 
          className={`bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 border-l-0 overflow-hidden opacity-0'}`}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
            <h2 className="font-black text-slate-800 tracking-tight text-[13px] truncate flex-1">
              {domains.find(d => d.id === activeDomainId)?.label_fa}
            </h2>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
              title="بستن منو"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            <div className="space-y-0.5">
              {activeTree.map(node => renderSidebarNode(node))}
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 w-full max-w-2xl">
            
            {showSidebar && !sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all active:scale-95"
                title="باز کردن منو"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
            )}
            
            <div className="relative w-full">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'} text-slate-400`} />
              <input 
                placeholder="جستجو در تمام فرم‌ها..."
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
                      <ArrowLeft size={14} className="text-slate-300" />
                    </div>
                  )) : <div className="p-6 text-center text-slate-400 text-[11px]">نتیجه‌ای یافت نشد.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeDomainId !== 'HOME_FAV' && (
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
            )}
            
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative transition-all">
              <Bell size={18} strokeWidth={2} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeDomainId === 'HOME_FAV' ? (
            renderHomeView()
          ) : viewMode === 'tile' ? (
            renderFioriTiles()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-white border border-slate-200 rounded-full mb-6 flex items-center justify-center shadow-sm">
                <Monitor size={40} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-black text-slate-700">ناحیه کاری {domains.find(d => d.id === activeDomainId)?.label_fa}</h2>
              <p className="text-slate-500 text-[12px] mt-3 max-w-sm leading-relaxed">
                جهت باز کردن فرم‌ها، از منوی درختی در سمت راست استفاده نمایید.
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