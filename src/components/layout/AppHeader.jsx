
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  Plus,
  BarChart2,
  PieChart,
  Settings,
  Building2,
  Upload,
  Download,
} from 'lucide-react';
import ExportSourceButton from '@/components/ExportSourceButton';

export default function AppHeader() {
  const location = useLocation();
  const [showAdminPassword, setShowAdminPassword] = useState(false);
const [adminPassword, setAdminPassword] = useState('');
const [adminUnlocked, setAdminUnlocked] = useState(false);
  const isAdmin = [
    '/admin',
    '/hubs',
    '/import',
  ].includes(location.pathname);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = path === '/'
      ? []
      : [{ label: 'Início', path: '/' }];

    if (path.includes('/regional/')) {
      const regional = decodeURIComponent(
        path.split('/regional/')[1]?.split('/')[0] || ''
      );
      crumbs.push({
        label: regional,
        path: `/regional/${encodeURIComponent(regional)}`,
      });
    }

    if (path.includes('/hub/')) {
      crumbs.push({ label: 'Detalhe Hub', path });
    }

    if (path === '/input') {
      crumbs.push({ label: 'Incluir Report', path: '/input' });
    }

    if (path === '/hubs') {
      crumbs.push({ label: 'Administrativo', path: '/admin' });
      crumbs.push({ label: 'Gestão de Hubs', path: '/hubs' });
    }

    if (path === '/import') {
      crumbs.push({ label: 'Administrativo', path: '/admin' });
      crumbs.push({ label: 'Importar', path: '/import' });
    }

    if (path === '/admin') {
      crumbs.push({ label: 'Administrativo', path: '/admin' });
    }

    if (path === '/daily') {
      crumbs.push({ label: 'Daily Management', path: '/daily' });
    }

    if (path === '/leftover-analise') {
      crumbs.push({
        label: 'Análise do Leftover',
        path: '/leftover-analise',
      });
    }

    if (path === '/historico') {
      crumbs.push({ label: 'Histórico', path: '/historico' });
    }

    if (path.includes('/regional/') && path.endsWith('/consolidado')) {
      crumbs.push({
        label: 'Consolidado Mensal',
        path,
      });
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();
  const handleAdminClick = (e) => {
    e.preventDefault();
  
    if (adminUnlocked) {
      window.location.href = '/admin';
      return;
    }
  
    setShowAdminPassword(true);
  };
  
  const checkAdminPassword = (e) => {
    e.preventDefault();
  
    if (adminPassword === 'Shopee@2026') {
      setAdminUnlocked(true);
      setShowAdminPassword(false);
      setAdminPassword('');
      window.location.href = '/admin';
    } else {
      alert('Senha incorreta!');
      setAdminPassword('');
    }
  };
  const navClass = (path, highlighted = false) => {
    const active = location.pathname === path;

    return [
      'flex items-center gap-1.5 text-xs font-inter font-semibold',
      'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
      active
        ? 'bg-white text-orange-600'
        : highlighted
          ? 'bg-orange-500/80 hover:bg-orange-500'
          : 'bg-white/20 hover:bg-white/30',
    ].join(' ');
  };

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-inter font-bold text-lg tracking-tight hidden sm:block">
            Shopee Report Operacional
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 text-sm font-inter min-w-0 overflow-x-auto">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb.path}-${i}`}>
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
              )}
              {i === crumbs.length - 1 ? (
                <span className="font-medium opacity-90 whitespace-nowrap">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {location.pathname !== '/' && (
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/input" className={navClass('/input')}>
              <Plus className="w-3.5 h-3.5" />
              Incluir Report
            </Link>

            <Link to="/historico" className={navClass('/historico')}>
              Histórico
            </Link>

            <Link to="/daily" className={navClass('/daily', true)}>
              <BarChart2 className="w-3.5 h-3.5" />
              Daily
            </Link>

            <Link to="/leftover-analise" className={navClass('/leftover-analise')}>
              <PieChart className="w-3.5 h-3.5" />
              Leftover
            </Link>

            
<button
  type="button"
  onClick={handleAdminClick}
  className={navClass('/admin', isAdmin)}
>
  <Settings className="w-3.5 h-3.5" />
  Administrativo
</button>

          </div>
        )}
      </div>
      {showAdminPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={checkAdminPassword}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-gray-800"
          >
            <h2 className="text-lg font-bold mb-2">
              Acesso Administrativo
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Digite a senha para continuar.
            </p>

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminPassword(false);
                  setAdminPassword('');
                }}
                className="rounded-lg px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-lg px-4 py-2 bg-orange-500 text-white hover:bg-orange-600"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
