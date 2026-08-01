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
import { NavigationTab, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  language?: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  language = 'es'
}) => {
  const t = I18N_STRINGS[language] || I18N_STRINGS.es;

  const navItems = [
    {
      id: 'query' as NavigationTab,
      label: t.nav_query,
      sublabel: t.nav_query_sub,
      icon: MessageSquareText,
      badge: 'Multimodal'
    },
    {
      id: 'corpus' as NavigationTab,
      label: t.nav_corpus,
      sublabel: t.nav_corpus_sub,
      icon: BookOpen,
      badge: 'Oficial'
    },
    {
      id: 'scenarios' as NavigationTab,
      label: t.nav_scenarios,
      sublabel: t.nav_scenarios_sub,
      icon: ShieldCheck,
      badge: 'Interactivo'
    },
    {
      id: 'history' as NavigationTab,
      label: t.nav_history,
      sublabel: t.nav_history_sub,
      icon: History,
    },
    {
      id: 'pipeline_audit' as NavigationTab,
      label: t.nav_profile,
      sublabel: t.nav_profile_sub,
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
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[18px] bg-gradient-to-br from-slate-800 via-slate-900 to-sky-950 flex items-center justify-center text-sky-400 border border-slate-700/60 shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">HablaPE</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Perú
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Asistente de Intervención Policial</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mx-4 my-3 p-3.5 rounded-[20px] bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Normativa Peruana 2025</div>
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> D.S. N° 012-2025-IN
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[18px] text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/15 text-white border border-sky-500/30 font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span>Base Legal:</span>
            <span className="font-mono text-sky-400">CPP Art. 205 + D.S. 012</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
            Información de orientación respaldada en el marco legal oficial del Estado Peruano.
          </p>
        </div>
      </aside>
    </>
  );
};
