import React, { useState } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  MessageSquareText, 
  Clock, 
  Star, 
  Share2, 
  FileText, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  Check,
  Target
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

type TabType = 'consultas' | 'normativa' | 'favoritos' | 'escenarios';

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  savedItems,
  onClearHistory,
  onRemoveItem,
  onViewItemDetail,
  onNavigateTab,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('consultas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Categorize saved items
  const queryItems = savedItems.filter(item => item.type === 'query');
  const articleItems = savedItems.filter(item => item.type === 'article');
  const favoriteItems = savedItems.filter(item => item.isFavorite || item.type === 'phrase');
  const scenarioItems = savedItems.filter(item => item.type === 'download' || item.type === 'scenario');

  // Counts for the 4 summary cards
  const consultasCount = queryItems.length;
  const normativaCount = articleItems.length;
  const favoritosCount = favoriteItems.length;
  const escenariosCount = scenarioItems.length;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text || window.location.href);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 3 Normas más consultadas
  const quickAccessNorms = [
    {
      id: 'norm-cpp',
      code: 'CPP',
      fullCode: 'Código Procesal Penal - Art. 205',
      title: 'Control de Identidad Policial y Retención',
      badge: 'Vigente 2025',
      summary: 'Regula los procedimientos y límites que tiene la Policía para solicitar tu documento en la vía pública.'
    },
    {
      id: 'norm-ds012',
      code: 'DS 012',
      fullCode: 'D.S. N.º 012-2025-IN',
      title: 'Identificación Digital y Licencia de Conducir',
      badge: 'Vigente 2025',
      summary: 'Valida oficialmente la identificación mediante el DNI Digital en app RENIEC y la Licencia virtual.'
    },
    {
      id: 'norm-const',
      code: 'Constitución',
      fullCode: 'Constitución Política del Perú - Art. 2',
      title: 'Inviolabilidad de Comunicaciones Privadas',
      badge: 'Vigente 2025',
      summary: 'Garantiza la protección absoluta de tus chats, fotos y teléfono celular sin previa orden judicial.'
    }
  ];

  // Get items for current active tab
  const getTabItems = () => {
    switch (activeTab) {
      case 'consultas':
        return queryItems;
      case 'normativa':
        return articleItems;
      case 'favoritos':
        return favoriteItems;
      case 'escenarios':
        return scenarioItems;
      default:
        return [];
    }
  };

  const currentTabItems = getTabItems();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. HERO (Mi Biblioteca - Celeste #D8F3F5 Theme) */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 md:p-9 shadow-xs overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Text Content */}
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#D8F3F5] text-[#0F3D56] border border-[#0F3D56]/20 text-xs font-bold px-3 py-1 rounded-full">
              <Bookmark className="w-3.5 h-3.5 text-[#0F3D56]" />
              Mi Biblioteca • Espacio Personal
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F3D56]">
              Mi Biblioteca
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
              Encuentra nuevamente tus consultas, artículos oficiales y escenarios guardados.
            </p>
          </div>

          {/* Flat Hero Illustration */}
          <div className="md:col-span-4 flex justify-center">
            <div className="relative rounded-[20px] overflow-hidden bg-[#D8F3F5]/30 border border-slate-200/80 p-2 shadow-2xs w-full max-w-xs">
              <img 
                src={libraryHeroIllustration} 
                alt="Mi Biblioteca HablaPE"
                referrerPolicy="no-referrer"
                className="w-full h-32 object-cover rounded-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESUMEN (Cuatro tarjetas uniformes) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F3D56] px-1">
          Resumen de contenido
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Consultas */}
          <button
            onClick={() => setActiveTab('consultas')}
            className={`p-4 rounded-[22px] text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs ${
              activeTab === 'consultas'
                ? 'bg-[#0F3D56] text-white border-[#0F3D56] shadow-xs ring-2 ring-[#0F3D56]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F3D56]/40 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${
                activeTab === 'consultas' ? 'bg-white/20 text-white' : 'bg-[#D8F3F5] text-[#0F3D56]'
              }`}>
                <MessageSquareText className="w-4 h-4" />
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                activeTab === 'consultas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {consultasCount}
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-extrabold">Consultas</h3>
              <p className={`text-[10px] font-medium ${activeTab === 'consultas' ? 'text-sky-200' : 'text-slate-500'}`}>
                {consultasCount} {consultasCount === 1 ? 'guardada' : 'guardadas'}
              </p>
            </div>
          </button>

          {/* Card 2: Normativa */}
          <button
            onClick={() => setActiveTab('normativa')}
            className={`p-4 rounded-[22px] text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs ${
              activeTab === 'normativa'
                ? 'bg-[#0F3D56] text-white border-[#0F3D56] shadow-xs ring-2 ring-[#0F3D56]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F3D56]/40 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${
                activeTab === 'normativa' ? 'bg-white/20 text-white' : 'bg-[#D8F3F5] text-[#0F3D56]'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                activeTab === 'normativa' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {normativaCount}
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-extrabold">Normativa</h3>
              <p className={`text-[10px] font-medium ${activeTab === 'normativa' ? 'text-sky-200' : 'text-slate-500'}`}>
                {normativaCount} {normativaCount === 1 ? 'artículo' : 'artículos'}
              </p>
            </div>
          </button>

          {/* Card 3: Favoritos */}
          <button
            onClick={() => setActiveTab('favoritos')}
            className={`p-4 rounded-[22px] text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs ${
              activeTab === 'favoritos'
                ? 'bg-[#0F3D56] text-white border-[#0F3D56] shadow-xs ring-2 ring-[#0F3D56]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F3D56]/40 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${
                activeTab === 'favoritos' ? 'bg-white/20 text-white' : 'bg-[#D8F3F5] text-[#0F3D56]'
              }`}>
                <Star className="w-4 h-4 text-[#0F3D56]" />
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                activeTab === 'favoritos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {favoritosCount}
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-extrabold">Favoritos</h3>
              <p className={`text-[10px] font-medium ${activeTab === 'favoritos' ? 'text-sky-200' : 'text-slate-500'}`}>
                {favoritosCount} {favoritosCount === 1 ? 'destacado' : 'destacados'}
              </p>
            </div>
          </button>

          {/* Card 4: Escenarios */}
          <button
            onClick={() => setActiveTab('escenarios')}
            className={`p-4 rounded-[22px] text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs ${
              activeTab === 'escenarios'
                ? 'bg-[#0F3D56] text-white border-[#0F3D56] shadow-xs ring-2 ring-[#0F3D56]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F3D56]/40 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${
                activeTab === 'escenarios' ? 'bg-white/20 text-white' : 'bg-[#D8F3F5] text-[#0F3D56]'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                activeTab === 'escenarios' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {escenariosCount}
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-extrabold">Escenarios</h3>
              <p className={`text-[10px] font-medium ${activeTab === 'escenarios' ? 'text-sky-200' : 'text-slate-500'}`}>
                {escenariosCount} {escenariosCount === 1 ? 'practicado' : 'practicados'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. CONTENIDO (Lista o Estado Vacío Elegante) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F3D56]">
            Elementos en {activeTab}
          </h2>

          {currentTabItems.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-bold cursor-pointer"
            >
              Vaciar sección
            </button>
          )}
        </div>

        {currentTabItems.length === 0 ? (
          /* ESTADO VACÍO */
          <div className="bg-white border border-slate-200/90 rounded-[24px] p-8 sm:p-12 text-center space-y-6 shadow-2xs">
            <div className="w-20 h-20 rounded-full bg-[#D8F3F5] border border-[#0F3D56]/20 flex items-center justify-center mx-auto text-[#0F3D56] shadow-2xs">
              <Bookmark className="w-9 h-9 text-[#0F3D56]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F3D56]">
                Todavía no has guardado contenido.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Empieza realizando tu primera consulta.
              </p>
            </div>

            {/* Botones: Consultar ahora | Explorar normativa */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigateTab && onNavigateTab('query')}
                className="w-full sm:w-auto px-6 py-3 rounded-[16px] bg-[#0F3D56] hover:bg-[#092B3E] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#15B6A6]" />
                <span>Consultar ahora</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('corpus')}
                className="w-full sm:w-auto px-6 py-3 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#0F3D56]" />
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
                className="bg-white border border-slate-200/90 rounded-[22px] p-5 shadow-2xs hover:shadow-xs hover:border-[#0F3D56]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-[16px] bg-[#D8F3F5] text-[#0F3D56] border border-[#0F3D56]/20 flex items-center justify-center shrink-0 mt-0.5">
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
                        {item.type === 'query' ? 'Consulta' : item.type === 'article' ? 'Norma Oficial' : 'Escenario'}
                      </span>

                      {item.articleCode && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8F3F5] text-[#0F3D56] border border-[#0F3D56]/20">
                          {item.articleCode}
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.timestamp}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-[#0F3D56] text-sm md:text-base leading-snug">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => onViewItemDetail(item)}
                    className="px-3.5 py-2 rounded-xl bg-[#0F3D56] hover:bg-[#092B3E] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Abrir detalle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite && onToggleFavorite(item.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      item.isFavorite
                        ? 'bg-[#D8F3F5] text-[#0F3D56] border-[#0F3D56]/30'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-[#0F3D56]'
                    }`}
                    title={item.isFavorite ? 'Quitar de favoritos' : 'Guardar favorito'}
                  >
                    <Star className="w-4 h-4 text-[#0F3D56]" />
                  </button>

                  <button
                    onClick={() => handleCopyText(item.id, item.title)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                    title="Compartir"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-[#2EB67D]" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
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

      {/* 4. NORMAS RECOMENDADAS / ACCESOS RÁPIDOS */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F3D56]">
              Normas más consultadas
            </h2>
            <p className="text-xs text-slate-500">
              Acceso directo a las disposiciones clave del Estado Peruano
            </p>
          </div>
        </div>

        {/* 3 Tarjetas: CPP, DS 012, Constitución */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickAccessNorms.map((norm) => (
            <div
              key={norm.id}
              className="bg-white border border-slate-200/90 rounded-[22px] p-5 shadow-2xs hover:shadow-xs hover:border-[#0F3D56]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#0F3D56] bg-[#D8F3F5] px-2.5 py-0.5 rounded-full border border-[#0F3D56]/20">
                    {norm.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3 text-[#2EB67D]" />
                    {norm.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-[#0F3D56]">
                  {norm.fullCode}
                </h3>

                <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {norm.summary}
                </p>
              </div>

              {/* Botón Ver */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Oficial Peruano</span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('corpus')}
                  className="px-4 py-2 rounded-xl bg-[#0F3D56] hover:bg-[#092B3E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Ver</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
