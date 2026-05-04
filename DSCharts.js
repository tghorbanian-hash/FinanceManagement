/* Filename: DSCharts.js */
(() => {
  const React = window.React;
  const { useMemo, useState } = React;

  const colorMap = {
    indigo: { main: '#4f46e5', light: '#e0e7ff', gradStart: 'rgba(79, 70, 229, 0.2)', gradEnd: 'rgba(79, 70, 229, 0)' },
    emerald: { main: '#10b981', light: '#d1fae5', gradStart: 'rgba(16, 185, 129, 0.2)', gradEnd: 'rgba(16, 185, 129, 0)' },
    rose: { main: '#f43f5e', light: '#ffe4e6', gradStart: 'rgba(244, 63, 94, 0.2)', gradEnd: 'rgba(244, 63, 94, 0)' },
    amber: { main: '#f59e0b', light: '#fef3c7', gradStart: 'rgba(245, 158, 11, 0.2)', gradEnd: 'rgba(245, 158, 11, 0)' },
    sky: { main: '#0ea5e9', light: '#e0f2fe', gradStart: 'rgba(14, 165, 233, 0.2)', gradEnd: 'rgba(14, 165, 233, 0)' },
    purple: { main: '#a855f7', light: '#f3e8ff', gradStart: 'rgba(168, 85, 247, 0.2)', gradEnd: 'rgba(168, 85, 247, 0)' }
  };

  const ChartTooltip = ({ visible, x, y, content }) => {
    if (!visible) return null;
    return (
      <div 
        className="fixed z-[9999] pointer-events-none bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl transform -translate-x-1/2 -translate-y-full mt-[-15px] animate-in fade-in zoom-in-95 duration-150" 
        style={{ left: x, top: y }}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800"></div>
      </div>
    );
  };

  const BarChart = ({ data = [], height = 200, color = 'indigo', language = 'fa', onClick, activeLabel }) => {
    const isRtl = language === 'fa';
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    const theme = colorMap[color] || colorMap.indigo;

    const maxVal = useMemo(() => {
      const max = Math.max(...data.map(d => d.value));
      return isFinite(max) && max > 0 ? max : 1;
    }, [data]);

    return (
      <div className="w-full flex flex-col font-sans relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 relative pt-6 pb-2 border-b border-slate-100">
          {data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-400">
              داده‌ای برای نمایش وجود ندارد
            </div>
          ) : data.map((item, idx) => {
            const pct = (item.value / maxVal) * 100;
            const isActive = activeLabel === null || activeLabel === undefined || activeLabel === item.label;
            
            return (
              <div 
                key={idx} 
                className={`relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
                onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${item.label}: ${item.value.toLocaleString()}` })}
                onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '' })}
                onClick={() => onClick && onClick(item)}
              >
                <div 
                  className="w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out hover:brightness-110"
                  style={{ height: `${pct}%`, backgroundColor: theme.main }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between gap-1 sm:gap-2 pt-2 h-6">
          {data.map((item, idx) => (
            <div key={idx} className={`flex-1 text-center truncate text-[9px] font-bold transition-colors ${activeLabel === item.label ? 'text-indigo-600' : 'text-slate-400'}`}>
              {item.label}
            </div>
          ))}
        </div>
        <ChartTooltip {...tooltip} />
      </div>
    );
  };

  const LineChart = ({ data = [], height = 200, color = 'indigo', language = 'fa', onClick }) => {
    const isRtl = language === 'fa';
    const theme = colorMap[color] || colorMap.indigo;
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

    const maxVal = useMemo(() => {
      const max = Math.max(...data.map(d => d.value));
      return isFinite(max) && max > 0 ? max : 1;
    }, [data]);
    
    const minVal = useMemo(() => {
      const min = Math.min(0, ...data.map(d => d.value));
      return isFinite(min) ? min : 0;
    }, [data]);

    const range = maxVal - minVal;
    
    const getPoints = () => {
      return data.map((d, i) => {
        const x = data.length <= 1 ? 50 : (i / (data.length - 1)) * 100;
        const y = range === 0 ? (minVal === 0 ? 100 : 50) : 100 - (((d.value - minVal) / range) * 100);
        return { x, y, d };
      });
    };

    const renderPath = () => {
      if (data.length === 0) return '';
      const points = getPoints();
      
      let path = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const ctrlX = (current.x + next.x) / 2;
        path += ` C ${ctrlX},${current.y} ${ctrlX},${next.y} ${next.x},${next.y}`;
      }
      return path;
    };

    const renderArea = () => {
      if (data.length === 0) return '';
      const points = getPoints();
      const path = renderPath();
      return `${path} L ${points[points.length - 1].x},100 L ${points[0].x},100 Z`;
    };

    return (
      <div className="w-full flex flex-col font-sans relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex-1 relative w-full h-full mb-4">
          {data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-400">
              داده‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="-5 -10 110 120">
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={theme.gradStart} />
                  <stop offset="100%" stopColor={theme.gradEnd} />
                </linearGradient>
              </defs>
              <path d={renderArea()} fill={`url(#grad-${color})`} className="animate-in fade-in duration-1000" />
              <path d={renderPath()} fill="none" stroke={theme.main} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-md animate-in slide-in-from-left duration-1000" />
              
              {getPoints().map((pt, i) => (
                <g 
                  key={i} 
                  className="cursor-pointer group" 
                  onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${pt.d.label}: ${pt.d.value.toLocaleString()}` })}
                  onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '' })}
                  onClick={() => onClick && onClick(pt.d)}
                >
                  <circle cx={pt.x} cy={pt.y} r="3" fill={theme.main} stroke="white" strokeWidth="1.5" className="transition-all duration-200 group-hover:r-[5px] group-hover:stroke-[2px]" />
                  <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                </g>
              ))}
            </svg>
          )}
        </div>
        
        <div className="flex justify-between w-full absolute bottom-0 left-0 right-0 h-4">
          {data.map((item, idx) => {
            const isEdgeOrMiddle = idx === 0 || idx === data.length - 1 || idx === Math.floor(data.length / 2);
            if (isEdgeOrMiddle) {
               return <span key={idx} className="text-[9px] font-bold text-slate-400">{item.label}</span>;
            }
            return <span key={idx} className="w-4"></span>;
          })}
        </div>
        <ChartTooltip {...tooltip} />
      </div>
    );
  };

  const DonutChart = ({ data = [], height = 200, language = 'fa', onClick, activeLabel }) => {
    const isRtl = language === 'fa';
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    
    const colors = [colorMap.indigo.main, colorMap.emerald.main, colorMap.amber.main, colorMap.sky.main, colorMap.purple.main, colorMap.rose.main];
    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
    
    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = total === 0 ? 0 : (d.value / total) * 100;
      const strokeDasharray = `${percent} ${100 - percent}`;
      const strokeDashoffset = 100 - cumulativePercent;
      cumulativePercent += percent;
      return { ...d, percent, strokeDasharray, strokeDashoffset, color: colors[i % colors.length] };
    });

    const hoveredSeg = tooltip.visible ? segments.find(s => s.label === tooltip.label) : null;

    return (
      <div className="w-full flex items-center justify-center font-sans gap-6 relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative h-full aspect-square max-h-[160px]">
          {data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 border-4 border-slate-100 rounded-full">
              بدون داده
            </div>
          ) : (
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 transform">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              {segments.map((seg, i) => {
                const isActive = activeLabel === null || activeLabel === undefined || activeLabel === seg.label;
                return (
                  <circle 
                    key={i} cx="18" cy="18" r="15.915" fill="transparent" 
                    stroke={seg.color} strokeWidth={tooltip.label === seg.label ? "5" : "4"} 
                    strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} 
                    className={`transition-all duration-300 cursor-pointer origin-center ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
                    onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${seg.label}: ${seg.value.toLocaleString()} (${seg.percent.toFixed(1)}%)`, label: seg.label })}
                    onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '', label: null })}
                    onClick={() => onClick && onClick(seg)}
                  />
                );
              })}
            </svg>
          )}
          {data.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-[10px] text-slate-400 font-bold">{hoveredSeg ? hoveredSeg.label : 'مجموع'}</span>
               <span className="text-[13px] font-black text-slate-800 tracking-tight">
                 {hoveredSeg ? hoveredSeg.value.toLocaleString() : total.toLocaleString()}
               </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 h-full py-2 max-w-[120px]">
          {segments.map((seg, i) => {
            const isActive = activeLabel === null || activeLabel === undefined || activeLabel === seg.label;
            return (
              <div 
                key={i} 
                className={`flex items-center gap-2 cursor-pointer transition-all ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${seg.label}: ${seg.value.toLocaleString()} (${seg.percent.toFixed(1)}%)`, label: seg.label })}
                onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '', label: null })}
                onClick={() => onClick && onClick(seg)}
              >
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }}></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 truncate">{seg.label}</span>
                  <span className="text-[9px] text-slate-500">{seg.percent.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <ChartTooltip {...tooltip} />
      </div>
    );
  };

  const PieChart = ({ data = [], height = 200, language = 'fa', onClick, activeLabel }) => {
    const isRtl = language === 'fa';
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    
    const colors = [colorMap.sky.main, colorMap.rose.main, colorMap.emerald.main, colorMap.amber.main, colorMap.indigo.main, colorMap.purple.main];
    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
    
    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = total === 0 ? 0 : (d.value / total) * 100;
      const strokeDasharray = `${percent} ${100 - percent}`;
      const strokeDashoffset = 100 - cumulativePercent;
      cumulativePercent += percent;
      return { ...d, percent, strokeDasharray, strokeDashoffset, color: colors[i % colors.length] };
    });

    return (
      <div className="w-full flex items-center justify-center font-sans gap-6 relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative h-full aspect-square max-h-[160px]">
          {data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50 rounded-full">
              بدون داده
            </div>
          ) : (
            <svg viewBox="0 0 31.83 31.83" className="w-full h-full -rotate-90 transform rounded-full">
              {segments.map((seg, i) => {
                const isActive = activeLabel === null || activeLabel === undefined || activeLabel === seg.label;
                return (
                  <circle 
                    key={i} cx="15.915" cy="15.915" r="7.9575" fill="transparent" 
                    stroke={seg.color} strokeWidth="15.915" 
                    strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} 
                    className={`transition-all duration-300 cursor-pointer origin-center ${isActive ? 'opacity-100 hover:brightness-110' : 'opacity-30 hover:opacity-70'}`}
                    onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${seg.label}: ${seg.value.toLocaleString()} (${seg.percent.toFixed(1)}%)`, label: seg.label })}
                    onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '', label: null })}
                    onClick={() => onClick && onClick(seg)}
                  />
                );
              })}
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 h-full py-2 max-w-[120px]">
          {segments.map((seg, i) => {
            const isActive = activeLabel === null || activeLabel === undefined || activeLabel === seg.label;
            return (
              <div 
                key={i} 
                className={`flex items-center gap-2 cursor-pointer transition-all ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${seg.label}: ${seg.value.toLocaleString()} (${seg.percent.toFixed(1)}%)`, label: seg.label })}
                onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '', label: null })}
                onClick={() => onClick && onClick(seg)}
              >
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }}></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 truncate">{seg.label}</span>
                  <span className="text-[9px] text-slate-500">{seg.percent.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <ChartTooltip {...tooltip} />
      </div>
    );
  };

  const GaugeChart = ({ value = 0, min = 0, max = 100, label = '', height = 160, color = 'indigo', language = 'fa' }) => {
    const isRtl = language === 'fa';
    const theme = colorMap[color] || colorMap.indigo;
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

    const safeValue = Math.min(Math.max(value, min), max);
    const range = max - min;
    const percent = range === 0 ? 0 : ((safeValue - min) / range) * 100;
    
    const R = 40;
    const C = Math.PI * R;
    const dashValue = (percent / 100) * C;

    return (
      <div className="w-full flex flex-col items-center justify-center font-sans relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div 
          className="relative w-full max-w-[200px]" 
          onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: `${label}: ${safeValue.toLocaleString()}` })}
          onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '' })}
        >
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke={theme.main} 
              strokeWidth="12" 
              strokeLinecap="round" 
              strokeDasharray={`${dashValue} ${C}`} 
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
            <span className="text-[20px] font-black text-slate-800 tracking-tight">{safeValue.toLocaleString()}</span>
            {label && <span className="text-[10px] font-bold text-slate-400 mt-1">{label}</span>}
          </div>
          <div className="absolute bottom-1 left-2 text-[9px] font-bold text-slate-400 pointer-events-none">{min}</div>
          <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 pointer-events-none">{max}</div>
        </div>
        <ChartTooltip {...tooltip} />
      </div>
    );
  };

  window.DSCharts = { BarChart, LineChart, DonutChart, PieChart, GaugeChart };
})();