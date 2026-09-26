import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ChevronRight, Plus, BarChart2, PieChart, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportSourceButton from '@/components/ExportSourceButton';

export default function AppHeader() {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = path === '/' ? [] : [{ label: 'Início', path: '/' }];
    
    if (path.includes('/regional/')) {
      const regional = decodeURIComponent(path.split('/regional/')[1]?.split('/')[0] || '');
      crumbs.push({ label: regional, path: `/regional/${encodeURIComponent(regional)}` });
    }
    if (path.includes('/hub/')) {
      crumbs.push({ label: 'Detalhe Hub', path: path });
    }
    if (path === '/input') {
      crumbs.push({ label: 'Input de Dados', path: '/input' });
    }
    if (path === '/hubs') {
      crumbs.push({ label: 'Gestão de Hubs', path: '/hubs' });
    }
    if (path === '/daily') {
      crumbs.push({ label: 'Daily Management', path: '/daily' });
    }
    if (path === '/leftover-analise') {
      crumbs.push({ label: 'Análise do Leftover', path: '/leftover-analise' });
    }
    if (path === '/import') {
      crumbs.push({ label: 'Importar', path: '/import' });
    }

    
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-inter font-bold text-lg tracking-tight hidden sm:block">Shopee Report Operacional</span>
        </Link>
        
        <nav className="flex items-center gap-1.5 text-sm font-inter">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              {i === crumbs.length - 1 ? (
                <span className="font-medium opacity-90">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="opacity-70 hover:opacity-100 transition-opacity">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        
        <div className="flex items-center gap-2">
          {location.pathname !== '/' && (
            <>
              <Link to="/input" className="flex items-center gap-1.5 text-xs font-inter font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                <Plus className="w-3.5 h-3.5" /> Incluir Report
              </Link>
              <Link to="/historico" className="text-xs font-inter font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                Histórico
              </Link>
              <Link to="/daily" className="flex items-center gap-1.5 text-xs font-inter font-semibold bg-orange-500/80 hover:bg-orange-500 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                <BarChart2 className="w-3.5 h-3.5" /> Daily
              </Link>
              <Link to="/leftover-analise" className="flex items-center gap-1.5 text-xs font-inter font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                <PieChart className="w-3.5 h-3.5" /> Leftover
              </Link>
              <Link to="/hubs" className="text-xs font-inter font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                Hubs
              </Link>
              <Link to="/import" className="flex items-center gap-1.5 text-xs font-inter font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                <Upload className="w-3.5 h-3.5" /> Importar
              </Link>
              <ExportSourceButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}