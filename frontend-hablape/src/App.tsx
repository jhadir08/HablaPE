import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { QueryModule } from './components/QueryModule';
import { CorpusModule } from './components/CorpusModule';
import { ScenariosModule } from './components/ScenariosModule';
import { HistoryModule } from './components/HistoryModule';
import { PipelineAuditModule } from './components/PipelineAuditModule';
import { NavigationTab, SavedItem, FrequentScenario } from './types';
import { 
  Menu, 
  Scale, 
  ShieldCheck, 
  Home, 
  BookOpen, 
  MessageSquareText, 
  History, 
  User, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('query');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem('hablape_saved_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hablape_saved_items', JSON.stringify(savedItems));
    } catch (err) {
      console.error('Error saving history to localStorage:', err);
    }
  }, [savedItems]);

  const handleSaveItem = (newItem: SavedItem) => {
    setSavedItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
  };

  const handleClearHistory = () => {
    setSavedItems([]);
    localStorage.removeItem('hablape_saved_items');
  };

  const handleRemoveItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setSavedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const handleSelectScenario = (scenario: FrequentScenario) => {
    setActiveTab('query');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row font-sans antialiased pb-20 lg:pb-0">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo HablaPE & Mobile Drawer Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div 
                onClick={() => setActiveTab('query')} 
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-[14px] bg-[#0F4C81] text-white flex items-center justify-center shadow-xs group-hover:bg-[#0D406E] transition-colors">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0F4C81]">HablaPE</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                      Perú
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Indicators: Normativa Peruana 2025 & Escudo Verde */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center text-xs font-semibold text-[#0F4C81] bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200">
                Normativa Peruana 2025
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span className="hidden xs:inline sm:inline">Información oficial actualizada</span>
                <span className="xs:hidden sm:hidden">Oficial</span>
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {activeTab === 'query' && (
            <QueryModule
              onSaveItem={handleSaveItem}
              onOpenAudit={() => setActiveTab('pipeline_audit')}
            />
          )}

          {activeTab === 'corpus' && (
            <CorpusModule onSaveItem={handleSaveItem} />
          )}

          {activeTab === 'scenarios' && (
            <ScenariosModule onSelectScenario={handleSelectScenario} />
          )}

          {activeTab === 'history' && (
            <HistoryModule
              savedItems={savedItems}
              onClearHistory={handleClearHistory}
              onRemoveItem={handleRemoveItem}
              onViewItemDetail={(item) => {
                setActiveTab('query');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'pipeline_audit' && (
            <PipelineAuditModule />
          )}
        </main>

        {/* Mobile / App Bottom Navigation Bar (Consistent across ALL screens) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 z-40 lg:hidden shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between relative">
            {/* 1. Inicio */}
            <button
              onClick={() => setActiveTab('query')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeTab === 'query' ? 'text-[#0F4C81] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className={`w-5 h-5 ${activeTab === 'query' ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 font-semibold">Inicio</span>
            </button>

            {/* 2. Normativa */}
            <button
              onClick={() => setActiveTab('corpus')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeTab === 'corpus' ? 'text-[#0F4C81] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === 'corpus' ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 font-semibold">Normativa</span>
            </button>

            {/* 3. Practicar (Floating Elevated Central Primary Action Button) */}
            <div className="flex-1 flex justify-center -mt-6">
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl shadow-teal-900/30 ring-4 ring-white active:scale-95 transition-all cursor-pointer ${
                  activeTab === 'scenarios' 
                    ? 'bg-[#0F4C81] text-white ring-[#0F4C81]/20' 
                    : 'bg-[#0F766E] hover:bg-[#0D655E] text-white'
                }`}
                title="Practicar Casos e Intervenciones"
              >
                <ShieldCheck className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* 4. Mi Biblioteca */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeTab === 'history' ? 'text-[#0F4C81] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className={`w-5 h-5 ${activeTab === 'history' ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 font-semibold">Mi Biblioteca</span>
            </button>

            {/* 5. Perfil */}
            <button
              onClick={() => setActiveTab('pipeline_audit')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeTab === 'pipeline_audit' ? 'text-[#0F4C81] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'pipeline_audit' ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 font-semibold">Perfil</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
