import React, { useState } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Search, 
  MessageSquareText, 
  Clock, 
  Star, 
  Share2, 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Scale,
  FolderDown,
  Check,
  Copy
} from 'lucide-react';
import { SavedItem, NavigationTab } from '../types';
import libraryHeroIllustration from '../assets/images/hablape_library_hero_1785606163112.jpg';

interface HistoryModuleProps {
  savedItems: SavedItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onViewItemDetail: (item: SavedItem) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onToggleFavorite?: (id: string) => void;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  savedItems,
  onClearHistory,
  onRemoveItem,
  onViewItemDetail,
  onNavigateTab,
  onToggleFavorite
}) => {
  const [activeChip, setActiveChip] = useState<'consultas' | 'normativa' | 'favoritos' | 'descargas'>('consultas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Default sample items if user hasn't saved anything yet to populate initial downloads or favorites demo,
  // but if user has savedItems, we use savedItems.
  const queryItems = savedItems.filter(item => item.type === 'query');
  const articleItems = savedItems.filter(item => item.type === 'article');
  const favoriteItems = savedItems.filter(item => item.isFavorite || item.type === 'phrase');
  const downloadItems = savedItems.filter(item => item.type === 'download' || item.downloadUrl);

  // Counts
  const consultasCount = queryItems.length;
  const normasCount = articleItems.length;
  const practicadosCount = favoriteItems.length + downloadItems.length;

  const handleCopyLink = (id: string, text: string) => {
    navigator.clipboard?.writeText(text || window.location.href);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick access official norms
  const quickAccessNorms = [
    {
      id: 'norm-cpp-205',
      code: 'CPP Art. 205',
      title: 'Control de Identidad Policial y Procedimiento',
      badge: 'Oficial',
      icon: Scale,
      summary: 'Regula las facultades y límites de la Policía para solicitar DNI en la vía pública.'
    },
    {
      id: 'norm-ds-012',
      code: 'D.S. N.º 012-2025-IN',
      title: 'Reglamento de Identificación Digital y Licencia',
      badge: 'Oficial',
      icon: ShieldCheck,
      summary: 'Valida la identificación mediante DNI Digital en app RENIEC y Licencia de Conducir.'
    },
    {
      id: 'norm-const-2',
      code: 'Constitución Política',
      title: 'Art. 2 Inc. 10 - Inviolabilidad de Comunicaciones',
      badge: 'Oficial',
      icon: BookOpen,
      summary: 'Garantiza la protección absoluta de chats, fotos y teléfonos celulares sin orden judicial.'
    }
  ];

  // Get items for current tab
  const getTabItems = () => {
    switch (activeChip) {
      case 'consultas':
        return queryItems;
      case 'normativa':
        return articleItems;
      case 'favoritos':
        return favoriteItems;
      case 'descargas':
        return downloadItems;
      default:
        return [];
    }
  };

  const currentTabItems = getTabItems();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. HERO COMPACTO (Mi Biblioteca) */}
      <div className="bg-white border border-slate-200/90 rounded-[22px] p-5 sm:p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Text */}
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 text-xs font-bold px-3 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
              Biblioteca Ciudadana
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E293B]">
              📚 Mi Biblioteca
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
              Accede nuevamente a tus consultas, respuestas generadas por HablaPE y artículos oficiales guardados para cuando los necesites.
            </p>
          </div>

          {/* Right Flat Minimalist Illustration */}
          <div className="w-full md:w-56 shrink-0 flex justify-center">
            <div className="relative rounded-[16px] overflow-hidden bg-slate-50 border border-slate-200/80 p-2 shadow-2xs">
              <img 
                src={libraryHeroIllustration} 
                alt="Mi Biblioteca HablaPE"
                referrerPolicy="no-referrer"
                className="w-full h-28 object-cover rounded-[12px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. INDICADORES SUPERIORES (3 Pequeñas tarjetas horizontales) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Consultas */}
        <div className="bg-white border border-slate-200/90 rounded-[20px] p-4 flex items-center justify-between shadow-2xs hover:border-[#0F4C81]/40 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Consultas
            </span>
            <div className="text-2xl font-black text-[#0F4C81]">
              {consultasCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-blue-50 text-[#0F4C81] flex items-center justify-center border border-blue-100">
            <MessageSquareText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Normas guardadas */}
        <div className="bg-white border border-slate-200/90 rounded-[20px] p-4 flex items-center justify-between shadow-2xs hover:border-[#0F766E]/40 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Normas guardadas
            </span>
            <div className="text-2xl font-black text-[#0F766E]">
              {normasCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-teal-50 text-[#0F766E] flex items-center justify-center border border-teal-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Casos practicados */}
        <div className="bg-white border border-slate-200/90 rounded-[20px] p-4 flex items-center justify-between shadow-2xs hover:border-indigo-500/40 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Casos practicados
            </span>
            <div className="text-2xl font-black text-indigo-900">
              {practicadosCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[14px] bg-indigo-50 text-indigo-800 flex items-center justify-center border border-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS SUPERIORES (Material Design Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'consultas', label: 'Consultas', icon: MessageSquareText, count: consultasCount },
          { id: 'normativa', label: 'Normativa', icon: ShieldCheck, count: normasCount },
          { id: 'favoritos', label: 'Favoritos', icon: Star, count: favoriteItems.length },
          { id: 'descargas', label: 'Descargas', icon: Download, count: downloadItems.length }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isSelected = activeChip === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveChip(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#0F4C81]'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. CONTENIDO DE LA PESTAÑA SELECCIONADA */}
      <div className="space-y-4">
        {currentTabItems.length === 0 ? (
          /* ESTADO VACÍO (Con Ilustración Flat y CTAs) */
          <div className="bg-white border border-slate-200/90 rounded-[22px] p-8 sm:p-12 text-center space-y-5 shadow-2xs">
            {/* Flat Illustration Container */}
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center mx-auto text-[#0F4C81] shadow-2xs">
              <Bookmark className="w-10 h-10 text-[#0F4C81]/80" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B]">
                Todavía no tienes elementos guardados en {activeChip.toUpperCase()}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Cada vez que consultes HablaPE podrás guardar respuestas, artículos oficiales y escenarios para revisarlos posteriormente.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigateTab && onNavigateTab('query')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[14px] bg-[#0F4C81] hover:bg-[#0D406E] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Realizar primera consulta</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('corpus')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#0F766E]" />
                <span>Explorar normativa</span>
              </button>
            </div>
          </div>
        ) : (
          /* LISTA DE ELEMENTOS GUARDADOS */
          <div className="space-y-3">
            {currentTabItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-[20px] p-5 shadow-2xs hover:shadow-xs hover:border-[#0F4C81]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'query' 
                      ? 'bg-blue-50 text-[#0F4C81] border border-blue-100' 
                      : item.type === 'article'
                      ? 'bg-teal-50 text-[#0F766E] border border-teal-100'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                  }`}>
                    {item.type === 'query' ? (
                      <MessageSquareText className="w-5 h-5" />
                    ) : item.type === 'article' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.type === 'query' ? 'Consulta' : item.type === 'article' ? 'Norma Oficial' : 'Documento'}
                      </span>

                      {item.articleCode && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                          {item.articleCode}
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.timestamp}
                      </span>

                      {item.confidenceLevel && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Nivel de confianza: {item.confidenceLevel}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-[#1E293B] text-sm md:text-base leading-snug">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => onViewItemDetail(item)}
                    className="px-3.5 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#0D406E] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Abrir nuevamente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite && onToggleFavorite(item.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      item.isFavorite
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                    title={item.isFavorite ? 'Quitar de favoritos' : 'Guardar favorito'}
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleCopyLink(item.id, item.title)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                    title="Compartir"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                    title="Eliminar de mi biblioteca"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. ACCESOS RÁPIDOS: NORMAS MÁS CONSULTADAS (Siempre visible) */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
              Normas más consultadas
            </h2>
            <p className="text-xs text-slate-500">
              Acceso directo a las tres leyes peruanas fundamentales en controles de identidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickAccessNorms.map((norm) => {
            const IconComp = norm.icon;

            return (
              <div
                key={norm.id}
                className="bg-white border border-slate-200/90 rounded-[20px] p-4 shadow-2xs hover:shadow-xs hover:border-[#0F4C81]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                      <Check className="w-3 h-3 text-[#22C55E]" />
                      {norm.badge}
                    </span>
                    <IconComp className="w-4 h-4 text-[#0F4C81]" />
                  </div>

                  <h3 className="font-extrabold text-sm text-[#1E293B]">
                    {norm.code}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {norm.title}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Vigente 2025</span>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('corpus')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0F4C81] hover:text-white text-[#0F4C81] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Ver</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
