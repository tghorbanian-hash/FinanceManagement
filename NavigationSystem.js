/* Filename: NavigationSystem.js */
(() => {
  const React = window.React;
  const { useState, useEffect, useMemo } = React;
  const LucideIcons = window.LucideIcons || {};
  const { 
    Search, Star, ChevronLeft, ChevronRight, LayoutGrid, 
    ListTree, FileText, Bell, Monitor, Clock,
    Settings, ArrowLeft, ArrowRight, ChevronDown, Folder, FolderOpen, Globe, Loader2, FileWarning
  } = LucideIcons;

  const FormLoader = ({ path, language }) => {
    if (!path) return null;

    const componentName = path.split('/').pop();
    const DynamicComponent = window[componentName];

    if (!DynamicComponent) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-in fade-in">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <FileWarning size={32} />
          </div>
          <h3 className="text-[16px] font-black text-slate-800 mb-2">خطا در بارگذاری فرم</h3>
          <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed border border-red-100 bg-red-50 p-3 rounded-lg mt-2 font-sans">
            کامپوننت <br/><strong className="text-red-600 font-mono">{componentName}</strong><br/> در سیستم یافت نشد (لطفاً بررسی کنید که در فایل index.html آپلود شده باشد).
          </p>
        </div>
      );
    }

    return <DynamicComponent language={language} />;
  };

  const NavigationSystem = ({ isAdmin = true, initialLanguage = 'fa' }) => {
    const supabase = window.supabase;

    const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
    const isRtl = currentLanguage === 'fa';
    
    const t = (fa, en) => isRtl ? fa : en;
    const getLabel = (item) => isRtl ? item.label_fa : (item.label_en || item.label_fa);

    const [menuData, setMenuData] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [recents, setRecents] = useState([]);
    
    const [viewMode, setViewMode] = useState('tile');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState({});
    const [collapsedModules, setCollapsedModules] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [activeDomainId, setActiveDomainId] = useState('HOME_FAV');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeForm, setActiveForm] = useState(null);
    const [activeFormId, setActiveFormId] = useState(null);
    
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

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
      setCollapsedModules({});
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
        setMenuData(data || []);
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
      if (isAdding) newFavs.add(id); else newFavs.delete(id);
      setFavorites(newFavs);

      try {
        if (isAdding) await supabase.from('user_favorites').insert({ user_id: MOCK_USER_ID, menu_id: id });
        else await supabase.from('user_favorites').delete().match({ user_id: MOCK_USER_ID, menu_id: id });
      } catch (err) {}
    };

    const handleFormClick = (item) => {
      setActiveForm(item);
      setActiveFormId(item.id);
      const newRecents = [item.id, ...recents.filter(id => id !== item.id)].slice(0, 10);
      setRecents(newRecents);
      localStorage.setItem('sys_recents', JSON.stringify(newRecents));
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
        const currentPath = [...path, getLabel(node)];
        if (node.menu_type === 'form') forms.push({ ...node, fullPath: currentPath.join(' / ') });
        if (node.children) node.children.forEach(c => traverse(c, currentPath));
      };
      fullTree.forEach(domain => traverse(domain));
      return forms;
    }, [fullTree, currentLanguage]);

    const filteredItems = useMemo(() => {
      if (!searchTerm) return [];
      return flattenedForms.filter(f => 
        getLabel(f).toLowerCase().includes(searchTerm.toLowerCase()) || 
        (f.unique_code && f.unique_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }, [searchTerm, flattenedForms, currentLanguage]);

    const activeTree = useMemo(() => {
      if (activeDomainId === 'HOME_FAV') return [];
      return buildTree(menuData, activeDomainId);
    }, [menuData, activeDomainId]);

    const getAllForms = (node) => {
      let forms = [];
      if (node.menu_type === 'form') forms.push(node);
      if (node.children) node.children.forEach(c => { forms = forms.concat(getAllForms(c)); });
      return forms;
    };

    const toggleNode = (id) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleModuleCollapse = (id) => setCollapsedModules(prev => ({ ...prev, [id]: !prev[id] }));

    const DynamicIcon = ({ name, size = 18 }) => {
      const Icon = LucideIcons[name] || FileText;
      return <Icon size={size} />;
    };

    const showSidebar = viewMode === 'tree' && activeDomainId !== 'HOME_FAV';

    const renderSidebarNode = (node, depth = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id];
      const isForm = node.menu_type === 'form';
      const isFav = isForm && favorites.has(node.id);
      const isSelected = activeFormId === node.id;
      const guideLinePos = depth * 20 + 26; 

      return (
        <div key={node.id} className="select-none relative">
          <div 
            className={`flex items-center py-1 my-[2px] rounded-md cursor-pointer transition-colors group ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'} ${depth === 0 && !isSelected ? 'font-bold text-slate-800' : ''}`}
            style={{ paddingInlineStart: `${depth * 20 + 8}px`, paddingInlineEnd: '8px' }}
            onClick={() => { if (hasChildren) toggleNode(node.id); else if (isForm) handleFormClick(node); }}
          >
            {hasChildren ? (
              <>
                <div className="flex items-center justify-center w-5 shrink-0">
                  <div className={`transition-transform duration-200 ${isExpanded ? (isRtl ? '-rotate-90 text-indigo-500' : 'rotate-90 text-indigo-500') : 'text-slate-400 group-hover:text-indigo-400'}`}>
                    {isRtl ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                  </div>
                </div>
                <div className="flex items-center justify-center w-6 shrink-0">
                  {isExpanded ? (
                    <FolderOpen size={15} className="text-indigo-500" fill="currentColor" fillOpacity={0.15} strokeWidth={2} />
                  ) : (
                    <Folder size={15} className="text-slate-400 group-hover:text-indigo-500" strokeWidth={2} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-5 shrink-0" />
                <div className="flex items-center justify-center w-6 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSelected ? 'bg-indigo-600 scale-[1.5] ring-[3px] ring-indigo-100' : 'bg-slate-300 group-hover:bg-indigo-400 group-hover:scale-125'}`} />
                </div>
              </>
            )}
            <span className={`flex-1 truncate ${isRtl ? 'pr-1.5' : 'pl-1.5'} ${depth === 0 ? 'text-[13px]' : 'text-[12px]'} ${isSelected ? 'font-black' : 'font-medium'}`}>
              {getLabel(node)}
            </span>
            {isForm && (
              <button onClick={(e) => toggleFavorite(e, node.id)} className={`transition-all p-1 shrink-0 ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}>
                <Star size={13} fill={isFav ? "currentColor" : "none"} />
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="relative">
              <div className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ [isRtl ? 'right' : 'left']: `${guideLinePos}px` }} />
              <div className="space-y-[2px] animate-in slide-in-from-top-1 duration-200 pt-0.5 pb-1 relative z-10 font-sans">
                {node.children.map(child => renderSidebarNode(child, depth + 1))}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderTileCard = (item) => {
      const isFav = favorites.has(item.id);
      return (
        <div key={item.id} onClick={() => handleFormClick(item)} className="w-[100px] h-[100px] shrink-0 bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="p-1.5 rounded-md transition-colors bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <DynamicIcon name={item.icon || 'FileText'} size={18} strokeWidth={2.5} />
            </div>
            <button onClick={(e) => toggleFavorite(e, item.id)} className={`z-20 p-0.5 transition-all ${isFav ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400'}`}>
              <Star size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="z-10 mt-auto pt-1">
            <div className="text-[12px] font-bold text-slate-700 leading-snug group-hover:text-indigo-700 whitespace-normal break-words line-clamp-3">
              {getLabel(item)}
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
        <div className="p-8 space-y-10 animate-in fade-in duration-300 font-sans">
          {directForms.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 cursor-pointer hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-t-md font-sans" onClick={() => toggleModuleCollapse('direct_forms')}>
                <div className="text-slate-400">
                  {collapsedModules['direct_forms'] ? (isRtl ? <ChevronLeft size={18} strokeWidth={2.5}/> : <ChevronRight size={18} strokeWidth={2.5}/>) : <ChevronDown size={18} strokeWidth={2.5} />}
                </div>
                <h3 className="text-[16px] font-black text-slate-800">{t('فرم‌های مستقل', 'Independent Forms')}</h3>
              </div>
              {!collapsedModules['direct_forms'] && <div className="flex flex-wrap gap-3 animate-in slide-in-from-top-1 duration-200">{directForms.map(renderTileCard)}</div>}
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
            const isCollapsed = collapsedModules[moduleNode.id];
            return (
              <section key={moduleNode.id} className="space-y-4 font-sans">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2 cursor-pointer hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-t-md select-none font-sans" onClick={() => toggleModuleCollapse(moduleNode.id)}>
                  <div className="text-slate-400">
                    {isCollapsed ? (isRtl ? <ChevronLeft size={18} strokeWidth={2.5}/> : <ChevronRight size={18} strokeWidth={2.5}/>) : <ChevronDown size={18} strokeWidth={2.5} />}
                  </div>
                  <h3 className="text-[16px] font-black text-slate-800">{getLabel(moduleNode)}</h3>
                  <span className="bg-slate-100 text-slate-500 text-[12px] px-2.5 py-0.5 rounded-full font-bold">{allNested.length} {t('فرم', 'Forms')}</span>
                </div>
                {!isCollapsed && (
                  <div className="space-y-4 pt-1 animate-in slide-in-from-top-1 duration-200">
                    {moduleDirectForms.length > 0 && (
                      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
                        <div className="w-24 shrink-0 pt-1.5 flex items-center font-black text-slate-400 text-[13px] uppercase tracking-wider">{t('عمومی', 'General')}</div>
                        <div className="flex-1 flex flex-wrap gap-3">{moduleDirectForms.map(renderTileCard)}</div>
                      </div>
                    )}
                    {sections.map(section => {
                      const sectionForms = getAllForms(section);
                      if (sectionForms.length === 0) return null;
                      return (
                        <div key={section.id} className="flex flex-col md:flex-row md:items-start gap-4 mb-4 font-sans">
                          <div className="w-24 shrink-0 pt-1.5 flex items-center gap-1.5 font-black text-slate-700 text-[13px]">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                            <span className="leading-tight">{getLabel(section)}</span>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-3">{sectionForms.map(renderTileCard)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      );
    };

    const renderHomeView = () => {
      const favItems = menuData.filter(m => favorites.has(m.id) && m.menu_type === 'form');
      const recentItems = recents.map(id => menuData.find(m => m.id === id)).filter(Boolean);
      return (
        <div className="p-8 space-y-10 animate-in fade-in font-sans">
          <section>
            <div className="flex items-center gap-2 mb-4 px-1 border-b border-slate-200 pb-2">
              <Clock size={18} className="text-indigo-500" strokeWidth={2.5} />
              <h2 className="text-[16px] font-black text-slate-800">{t('بازدیدهای اخیر', 'Recent Visits')}</h2>
            </div>
            <div className="flex flex-wrap gap-3">{recentItems.length > 0 ? recentItems.map(renderTileCard) : <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[13px] font-sans">{t('شما هنوز از فرمی بازدید نکرده‌اید.', 'You have not visited any forms yet.')}</div>}</div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-4 px-1 border-b border-slate-200 pb-2">
              <Star size={18} className="text-amber-500" fill="currentColor" />
              <h2 className="text-[16px] font-black text-slate-800">{t('فرم‌های منتخب (علاقه‌مندی‌ها)', 'Favorite Forms')}</h2>
            </div>
            <div className="flex flex-wrap gap-3">{favItems.length > 0 ? favItems.map(renderTileCard) : <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-[13px] font-sans">{t('فرمی به علاقه‌مندی‌ها اضافه نشده است.', 'No forms added to favorites.')}</div>}</div>
          </section>
        </div>
      );
    };

    if (loading) return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[13px] font-bold text-slate-500 font-sans">در حال بارگذاری...</p>
        </div>
      </div>
    );

    const NotificationSidebarComponent = window.NotificationSidebar;

    return (
      <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
        <nav className={`w-[60px] bg-white border-slate-200 flex flex-col items-center py-6 gap-4 shrink-0 z-40 shadow-sm relative ${isRtl ? 'border-l' : 'border-r'}`}>
          <button onClick={() => { setActiveDomainId('HOME_FAV'); setActiveForm(null); setActiveFormId(null); }} className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all mb-4 ${activeDomainId === 'HOME_FAV' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
            <Star size={18} fill={activeDomainId === 'HOME_FAV' ? "currentColor" : "none"} />
            <div className={`absolute ${isRtl ? 'right-full mr-3' : 'left-full ml-3'} px-3 py-1.5 bg-slate-800 text-white text-[12px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg font-sans`}>{t('میز کار و علاقه‌مندی‌ها', 'Workspace & Favorites')}</div>
          </button>
          {domains.map(domain => (
            <button key={domain.id} onClick={() => { setActiveDomainId(domain.id); setActiveForm(null); setActiveFormId(null); }} className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${activeDomainId === domain.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <DynamicIcon name={domain.icon} size={18} />
              <div className={`absolute ${isRtl ? 'right-full mr-3' : 'left-full ml-3'} px-3 py-1.5 bg-slate-800 text-white text-[12px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg font-sans`}>{getLabel(domain)}</div>
            </button>
          ))}
          <div className="mt-auto flex flex-col items-center gap-5">
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><Settings size={18} /></button>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-[11px] cursor-pointer hover:bg-slate-200 transition-colors">PM</div>
          </div>
        </nav>

        {showSidebar && (
          <aside className={`bg-white border-slate-200 flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden opacity-0'} ${isRtl ? 'border-l' : 'border-r'}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 font-sans">
              <h2 className="font-black text-slate-800 tracking-tight text-[14px] truncate flex-1 font-sans">{getLabel(domains.find(d => d.id === activeDomainId) || {})}</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">{isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 font-sans"><div className="space-y-[2px]">{activeTree.map(node => renderSidebarNode(node))}</div></div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative font-sans">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20 font-sans">
            <div className="flex items-center gap-5 w-full max-w-3xl">
              {showSidebar && !sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all active:scale-95 shrink-0">{isRtl ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}</button>}
              {activeDomainId !== 'HOME_FAV' && (
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                  <button onClick={() => setViewMode('tree')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-bold transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ListTree size={16} /><span>{t('درختی', 'Tree')}</span></button>
                  <button onClick={() => setViewMode('tile')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-bold transition-all ${viewMode === 'tile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={16} /><span>{t('کاشی', 'Tile')}</span></button>
                </div>
              )}
              <div className="relative w-full">
                <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-slate-400`} />
                <input placeholder={t('جستجو در تمام فرم‌ها...', 'Search all forms...')} className={`w-full h-11 bg-slate-50 border border-slate-200 rounded-lg text-[13px] ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} focus:bg-white focus:border-indigo-300 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-sans`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 py-2 z-50 font-sans">
                    {filteredItems.length > 0 ? filteredItems.map(item => (
                      <div key={item.id} onClick={() => { handleFormClick(item); setSearchTerm(''); }} className="px-5 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-all flex items-center justify-between">
                        <div><div className="font-bold text-slate-800 text-[13px] font-sans">{getLabel(item)}</div><div className="text-[12px] text-slate-400 mt-1 font-sans">{item.fullPath}</div></div>
                        {isRtl ? <ArrowLeft size={16} className="text-slate-300" /> : <ArrowRight size={16} className="text-slate-300" />}
                      </div>
                    )) : <div className="p-5 text-center text-slate-400 text-[12px] font-sans">{t('نتیجه‌ای یافت نشد.', 'No results found.')}</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentLanguage(isRtl ? 'en' : 'fa')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold text-[12px] transition-colors border border-slate-200 bg-slate-50 font-sans" title="Change Language">
                <Globe size={14} className="text-indigo-500" /><span>{isRtl ? 'EN' : 'فا'}</span>
              </button>
              <div className="w-px h-5 bg-slate-200"></div>
              <button onClick={() => setIsNotifOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative transition-all">
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span className={`absolute top-1.5 ${isRtl ? 'right-1.5' : 'left-1.5'} flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 border-2 border-white`}></span>
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar font-sans">
            {activeForm && activeForm.component_path ? (
              <FormLoader path={activeForm.component_path} language={currentLanguage} />
            ) : activeDomainId === 'HOME_FAV' ? renderHomeView() : viewMode === 'tile' ? renderFioriTiles() : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 font-sans">
                <Monitor size={40} className="text-slate-300 mb-4" strokeWidth={1.5} />
                <h2 className="text-xl font-black text-slate-700 font-sans">{t('ناحیه کاری ', 'Workspace ')} {getLabel(domains.find(d => d.id === activeDomainId) || {})}</h2>
                <p className="text-slate-500 text-[13px] mt-3 max-w-sm leading-relaxed font-sans">{t('جهت باز کردن فرم‌ها، از منوی درختی در سمت راست استفاده نمایید.', 'Use the tree menu to open forms.')}</p>
              </div>
            )}
          </div>
        </main>

        {NotificationSidebarComponent && (
          <NotificationSidebarComponent 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)} 
            language={currentLanguage} 
            onUpdateUnread={setUnreadNotifCount}
          />
        )}
      </div>
    );
  };

  window.NavigationSystem = NavigationSystem
})();