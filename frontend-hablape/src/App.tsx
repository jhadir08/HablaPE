import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { QueryModule } from './components/QueryModule';
import { CorpusModule } from './components/CorpusModule';
import { ScenariosModule } from './components/ScenariosModule';
import { HistoryModule } from './components/HistoryModule';
import { PipelineAuditModule } from './components/PipelineAuditModule';
import { NavigationTab, SavedItem, FrequentScenario } from './types';
import { Menu, Scale, ShieldCheck, Sparkles } from 'lucide-react';

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

  const handleSelectScenario = (scenario: FrequentScenario) => {
    setActiveTab('query');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col lg:flex-row font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">HablaPE</span>
                <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                  Perú
                </span>
              </div>
            </div>
          </div>

          <span className="text-xs bg-slate-800 text-slate-300 font-medium px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Gemma 4
          </span>
        </header>

        {/* Top Desktop Info Bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Estado: Servicio Activo y Normativa Actualizada 2025
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Gemma 4 Multimodal + RAG Corpus Oficial (D.S. N° 012-2025-IN)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Línea de Emergencia Defensoría: <strong className="text-slate-800 font-bold">0800-15170</strong>
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
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
            />
          )}

          {activeTab === 'pipeline_audit' && (
            <PipelineAuditModule />
          )}
        </main>
      </div>
    </div>
  );
}
