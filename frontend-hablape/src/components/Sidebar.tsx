import React from 'react';
import { 
  MessageSquareText, 
  BookOpen, 
  ShieldCheck, 
  History, 
  Cpu, 
  Scale, 
  Menu, 
  X,
  FileCheck2
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen
}) => {
  const navItems = [
    {
      id: 'query' as NavigationTab,
      label: 'Consulta Directa',
      sublabel: 'Intervención Policial',
      icon: MessageSquareText,
      badge: 'Multimodal'
    },
    {
      id: 'corpus' as NavigationTab,
      label: 'Corpus & Normativa',
      sublabel: 'Leyes y D.S. 012-2025-IN',
      icon: BookOpen,
      badge: 'Oficial'
    },
    {
      id: 'scenarios' as NavigationTab,
      label: 'Casos y Simulador',
      sublabel: 'Práctica de Derechos',
      icon: ShieldCheck,
    },
    {
      id: 'history' as NavigationTab,
      label: 'Historial y Guardados',
      sublabel: 'Consultas previas',
      icon: History,
    },
    {
      id: 'pipeline_audit' as NavigationTab,
      label: 'Arquitectura y Auditoría',
      sublabel: 'Motor Gemma 4 RAG',
      icon: Cpu,
      badge: 'Gemma 4'
    }
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-900/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">HablaPE</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  Perú
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Asistente de Derechos Policiales</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mx-4 my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Normativa Vigente 2025</div>
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <FileCheck2 className="w-3 h-3 text-emerald-400" /> D.S. N° 012-2025-IN
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-red-600/15 text-white border border-red-500/30 font-medium shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        item.badge === 'Gemma 4' 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{item.sublabel}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span>Model Core:</span>
            <span className="font-mono text-slate-300">Gemma 4 (12B)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>RAG Engine:</span>
            <span className="font-mono text-emerald-400">CPP Art. 205 + D.S. 012</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight pt-1">
            Información orientativa sustentada en normativa oficial del Estado Peruano.
          </p>
        </div>
      </aside>
    </>
  );
};
