/* Filename: DSCharts.js */
(() => {
  const React = window.React;
  const { useMemo, useState } = React;

  const colorMap = {
    indigo: { main: '#4f46e5', light: '#e0e7ff', gradStart: 'rgba(79, 70, 229, 0.2)', gradEnd: 'rgba(79, 70, 229, 0)' },
    emerald: { main: '#10b981', light: '#d1fae5', gradStart: 'rgba(16, 185, 129, 0.2)', gradEnd: 'rgba(16, 185, 129, 0)' },
    rose: { main: '#f43f5e', light: '#ffe4e6', gradStart: 'rgba(244, 63, 94, 0.2)', gradEnd: 'rgba(244, 63, 94, 0)' },
    amber: { main: '#f59e0b', light: '#fef3c7', gradStart: 'rgba(245, 158, 11, 0.2)', gradEnd: 'rgba(245, 158, 11, 0)' },
    sky: { main: '#0ea5e9', light: '#e0f2fe', gradStart: 'rgba(14, 165, 233, 0.2)', gradEnd: 'rgba(14, 165, 233, 0)' }
  };

  const BarChart = ({ data = [], height = 200, color = 'indigo', language = 'fa' }) => {
    const isRtl = language === 'fa';
    const [hoverIndex, setHoverIndex] = useState(null);
    const theme = colorMap[color] || colorMap.indigo;

    const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    return (
      <div className="w-full flex flex-col font-sans" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 relative pt-6 pb-2 border-b border-slate-100">
          {data.map((item, idx) => {
            const pct = (item.value / maxVal) * 100;
            const isHovered = hoverIndex === idx;
            return (
              <div 
                key={idx} 
                className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <div 
                  className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                  style={{ height: `${pct}%`, backgroundColor: theme.main }}
                />
                
                {isHovered && (
                  <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md z-10 animate-in fade-in zoom-in-95">
                    {item.value.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between gap-1 sm:gap-2 pt-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 text-center truncate text-[9px] font-bold text-slate-400">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LineChart = ({ data = [], height = 200, color = 'indigo', language = 'fa' }) => {
    const isRtl = language === 'fa';
    const theme = colorMap[color] || colorMap.indigo;
    const [hoverIndex, setHoverIndex] = useState(null);

    const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    const minVal = useMemo(() => Math.min(0, ...data.map(d => d.value)), [data]);

    const range = maxVal - minVal;
    
    const renderPath = () => {
      if (data.length === 0) return '';
      const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (((d.value - minVal) / range) * 100);
        return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
    };

    const renderArea = () => {
      if (data.length === 0) return '';
      const path = renderPath();
      return `${path} L 100,100 L 0,100 Z`;
    };

    return (
      <div className="w-full flex flex-col font-sans relative" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex-1 relative w-full h-full mb-4">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={theme.gradStart} />
                <stop offset="100%" stopColor={theme.gradEnd} />
              </linearGradient>
            </defs>
            <path d={renderArea()} fill={`url(#grad-${color})`} />
            <path d={renderPath()} fill="none" stroke={theme.main} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-sm" />
            
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - (((d.value - minVal) / range) * 100);
              const isHovered = hoverIndex === i;
              
              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                  <circle cx={x} cy={y} r={isHovered ? "4" : "0"} fill={theme.main} stroke="white" strokeWidth="1.5" className="transition-all duration-200" />
                  {isHovered && (
                    <circle cx={x} cy={y} r="8" fill={theme.main} opacity="0.2" className="animate-ping" />
                  )}
                </g>
              );
            })}
          </svg>
          
          {hoverIndex !== null && (
            <div 
              className="absolute bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 pointer-events-none -translate-x-1/2 -translate-y-full mb-3"
              style={{ 
                left: `${(hoverIndex / (data.length - 1)) * 100}%`,
                top: `${100 - (((data[hoverIndex].value - minVal) / range) * 100)}%`
              }}
            >
              {data[hoverIndex].value.toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="flex justify-between w-full absolute bottom-0 left-0 right-0">
          {data.map((item, idx) => {
            if (idx === 0 || idx === data.length - 1 || idx === Math.floor(data.length / 2)) {
               return <span key={idx} className="text-[9px] font-bold text-slate-400">{item.label}</span>;
            }
            return <span key={idx}></span>;
          })}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data = [], height = 200, language = 'fa' }) => {
    const isRtl = language === 'fa';
    const [hoverIndex, setHoverIndex] = useState(null);
    
    const colors = [colorMap.indigo.main, colorMap.emerald.main, colorMap.amber.main, colorMap.sky.main, colorMap.rose.main];
    
    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
    
    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = (d.value / total) * 100;
      const strokeDasharray = `${percent} ${100 - percent}`;
      const strokeDashoffset = 100 - cumulativePercent;
      cumulativePercent += percent;
      
      return { ...d, percent, strokeDasharray, strokeDashoffset, color: colors[i % colors.length] };
    });

    return (
      <div className="w-full flex items-center justify-center font-sans gap-6" style={{ height }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative h-full aspect-square max-h-[160px]">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 transform">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
            {segments.map((seg, i) => {
              const isHovered = hoverIndex === i;
              return (
                <circle 
                  key={i} cx="18" cy="18" r="15.915" fill="transparent" 
                  stroke={seg.color} strokeWidth={isHovered ? "5" : "4"} 
                  strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} 
                  className="transition-all duration-300 cursor-pointer origin-center"
                  onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-[10px] text-slate-400 font-bold">{hoverIndex !== null ? segments[hoverIndex].label : 'مجموع'}</span>
             <span className="text-[14px] font-black text-slate-800 tracking-tight">
               {hoverIndex !== null ? segments[hoverIndex].value.toLocaleString() : total.toLocaleString()}
             </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 h-full py-4 max-w-[120px]">
          {segments.map((seg, i) => (
            <div 
              key={i} className={`flex items-center gap-2 cursor-pointer transition-opacity ${hoverIndex !== null && hoverIndex !== i ? 'opacity-40' : 'opacity-100'}`}
              onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }}></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-700 truncate">{seg.label}</span>
                <span className="text-[9px] text-slate-500">{seg.percent.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  window.DSCharts = { BarChart, LineChart, DonutChart };
})();