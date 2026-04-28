/* Filename: app.js */
import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const NavigationSystem = window.NavigationSystem;
  
  if (!NavigationSystem) {
    return <div className="p-10 text-center font-bold text-slate-500">در حال بارگذاری سیستم...</div>;
  }

  return (
    <NavigationSystem 
      isAdmin={true} 
      language="fa" 
    />
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
