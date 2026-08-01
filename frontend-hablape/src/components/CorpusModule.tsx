import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Bookmark, 
  Share2, 
  FileText, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Smartphone, 
  Scale, 
  Building2, 
  UserCheck, 
  Check, 
  HelpCircle,
  Layers,
  ChevronRight,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { CorpusArticle, SavedItem } from '../types';
import { LEGAL_CORPUS } from '../data/legalCorpus';
import heroIllustration from '../assets/images/hablape_corpus_hero_illustration_1785605246438.jpg';

interface CorpusModuleProps {
  onSaveItem: (item: SavedItem) => void;
}

type ArticleDetailTab = 'resumen' | 'texto' | 'practico' | 'fuente';

export const CorpusModule: React.FC<CorpusModuleProps> = ({ onSaveItem }) => {
  const [corpusList, setCorpusList] = useState<CorpusArticle[]>(LEGAL_CORPUS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Selected article for Modal detail view
  const [selectedArticle, setSelectedArticle] = useState<CorpusArticle | null>(null);
  const [modalTab, setModalTab] = useState<ArticleDetailTab>('resumen');

  // Quick suggestions under search bar
  const quickSuggestions = [
    'DNI Digital',
    'Celular',
    'Retención',
    'Comisaría',
    'Control de identidad',
    'Constitución',
    'Derechos'
  ];

  // Material 3 Visual Category Cards definition (All uniform size and style)
  const categoryCards = [
    {
      id: 'all',
      title: 'Todas las normas',
      icon: Layers,
      emoji: '🌐',
      count: LEGAL_CORPUS.length
    },
    {
      id: 'Control de Identidad',
      title: 'Control de identidad',
      icon: UserCheck,
      emoji: '📘',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Control de Identidad' || art.tags.includes('identificación')).length
    },
    {
      id: 'Celulares',
      title: 'Celulares',
      icon: Smartphone,
      emoji: '📱',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Celulares' || art.tags.includes('celular') || art.tags.includes('DNI digital')).length
    },
    {
      id: 'Garantías Constitucionales',
      title: 'Derechos',
      icon: Scale,
      emoji: '⚖',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Garantías Constitucionales' || art.tags.includes('derechos')).length
    },
    {
      id: 'Constitución',
      title: 'Constitución',
      icon: BookOpen,
      emoji: '🏛',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Constitución' || art.code.includes('Const')).length
    },
    {
      id: 'Procedimientos',
      title: 'Procedimientos',
      icon: Building2,
      emoji: '🛡',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Procedimientos' || art.category === 'Atribuciones Policiales' || art.tags.includes('comisaria')).length
    }
  ];

  useEffect(() => {
    let filtered = [...LEGAL_CORPUS];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((art) => {
        if (selectedCategory === 'Celulares') {
          return art.category === 'Celulares' || art.tags.includes('celular') || art.tags.includes('DNI digital');
        }
        if (selectedCategory === 'Procedimientos') {
          return art.category === 'Procedimientos' || art.category === 'Atribuciones Policiales' || art.tags.includes('comisaria');
        }
        if (selectedCategory === 'Constitución') {
          return art.category === 'Constitución' || art.code.includes('Const');
        }
        return art.category === selectedCategory;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (art) =>
          art.documentTitle.toLowerCase().includes(q) ||
          art.code.toLowerCase().includes(q) ||
          art.articleNumber.toLowerCase().includes(q) ||
          art.title.toLowerCase().includes(q) ||
          art.content.toLowerCase().includes(q) ||
          (art.citizenSummary && art.citizenSummary.toLowerCase().includes(q)) ||
          art.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    setCorpusList(filtered);
  }, [searchQuery, selectedCategory]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBookmarkArticle = (article: CorpusArticle) => {
    onSaveItem({
      id: `article-${article.id}`,
      type: 'article',
      title: `${article.code} - ${article.articleNumber}: ${article.title}`,
      timestamp: new Date().toLocaleDateString('es-PE'),
      data: article
    });
    setSavedIds((prev) => new Set(prev).add(article.id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. HERO SUPERIOR (Limpio, Material Design 3) */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 md:p-9 shadow-xs overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Text Content */}
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 text-xs font-bold px-3 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
              Fuente Jurídica Transparente
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E293B]">
              Biblioteca Oficial
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium max-w-2xl">
              Toda la información utilizada por HablaPE proviene exclusivamente de normativa oficial vigente del Estado Peruano.
            </p>

            {/* 3 Indicadores horizontales (Chips suaves con icono) */}
            <div className="pt-2 flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Normativa vigente 2025
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Corpus oficial indexado
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Actualización automática
              </span>
            </div>
          </div>

          {/* Flat Hero Illustration */}
          <div className="md:col-span-4 flex justify-center">
            <div className="relative rounded-[20px] overflow-hidden bg-slate-50 border border-slate-200/80 p-2 shadow-2xs w-full max-w-xs">
              <img 
                src={heroIllustration} 
                alt="Biblioteca Oficial HablaPE"
                referrerPolicy="no-referrer"
                className="w-full h-32 object-cover rounded-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BUSCADOR CON BOTÓN FILTROS */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artículo, derecho, palabra clave o procedimiento..."
              className="w-full pl-12 pr-10 py-3 rounded-[16px] border border-slate-200 bg-slate-50/60 text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all shadow-2xs font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botón pequeño Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-3 rounded-[16px] text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              showFilters || selectedCategory !== 'all'
                ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Sugerencias Rápidas / Filtros desplegables */}
        {(showFilters || searchQuery) && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Términos frecuentes:</span>
            {quickSuggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => setSearchQuery(sug)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === sug.toLowerCase()
                    ? 'bg-[#0F4C81] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-[#0F4C81]'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. CATEGORÍAS (Tarjetas Pequeñas del Mismo Tamaño) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
            Categorías Jurídicas
          </h2>
          {selectedCategory !== 'all' && (
            <button 
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
            >
              Mostrar todas ({LEGAL_CORPUS.length})
            </button>
          )}
        </div>

        {/* Category Cards Grid: All uniform size */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categoryCards.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 rounded-[20px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 border h-28 group ${
                  isSelected 
                    ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-xs ring-2 ring-[#0F4C81]/20' 
                    : 'bg-white border-slate-200/90 hover:border-[#0F4C81]/40 text-slate-800 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {cat.count}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold line-clamp-1">
                    {cat.title}
                  </h3>
                  <p className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {cat.count} {cat.count === 1 ? 'artículo' : 'artículos'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. LISTA DE NORMAS (Tarjetas Elegantes con Resumen Ciudadano) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
            Normas Encontradas ({corpusList.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Respaldadas en el Diario Oficial El Peruano
          </span>
        </div>

        {corpusList.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-[24px] p-10 text-center text-slate-500 text-sm space-y-3">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No se encontraron artículos para tu búsqueda.</p>
            <p className="text-xs text-slate-400">Prueba con palabras como DNI, celular, comisaría o derechos.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0F4C81] cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {corpusList.map((article) => {
              const isSaved = savedIds.has(article.id);
              const summaryText = article.citizenSummary || article.content.slice(0, 150) + '...';

              return (
                <div
                  key={article.id}
                  className="bg-white border border-slate-200/90 rounded-[22px] p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-[#0F4C81]/40 transition-all space-y-4"
                >
                  {/* Header: Badge Verde + Código + Artículo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Verde: Vigente */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                        Vigente
                      </span>

                      <span className="font-extrabold text-xs text-[#0F4C81] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {article.code}
                      </span>

                      <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-200">
                        {article.articleNumber}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      Oficial 2025
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {article.documentTitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B] leading-snug">
                      {article.title}
                    </h3>
                  </div>

                  {/* Resumen Ciudadano Generado por IA (Sin texto completo abrumador) */}
                  <div className="bg-gradient-to-r from-teal-50/60 to-sky-50/60 border border-teal-200/60 rounded-[16px] p-4 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#0F766E]/10 text-[#0F766E] shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E]">
                        Resumen ciudadano
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">
                        {summaryText}
                      </p>
                    </div>
                  </div>

                  {/* Botones solicitados: Ver detalle | Guardar | Compartir */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    {/* Botón 1: Ver detalle */}
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        setModalTab('resumen');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#0D406E] text-white font-extrabold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver detalle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Secondary Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Botón 2: Guardar */}
                      <button
                        onClick={() => handleBookmarkArticle(article)}
                        disabled={isSaved}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                      </button>

                      {/* Botón 3: Compartir */}
                      <button
                        onClick={() => handleCopyText(`${article.code} - ${article.title}: ${summaryText}`, article.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copiedId === article.id ? 'Copiado' : 'Compartir'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DE DETALLE DE LA NORMA (Se abre únicamente al presionar Ver detalle) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0F4C81] text-white p-5 sm:p-6 space-y-2 relative">
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  {selectedArticle.code}
                </span>
                <span className="bg-emerald-500/20 text-emerald-200 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Vigente 2025
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white pr-8 leading-snug">
                {selectedArticle.articleNumber}: {selectedArticle.title}
              </h2>
              <p className="text-xs text-blue-100/80">
                {selectedArticle.documentTitle}
              </p>
            </div>

            {/* Modal Tabs Header */}
            <div className="bg-slate-100/80 border-b border-slate-200 p-2 flex overflow-x-auto gap-1">
              <button
                onClick={() => setModalTab('resumen')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'resumen'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Resumen ciudadano</span>
              </button>

              <button
                onClick={() => setModalTab('texto')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'texto'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span>Texto oficial completo</span>
              </button>

              <button
                onClick={() => setModalTab('practico')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'practico'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aplicación en la práctica</span>
              </button>

              <button
                onClick={() => setModalTab('fuente')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'fuente'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Fuente oficial</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {modalTab === 'resumen' && (
                <div className="space-y-4">
                  <div className="bg-teal-50/80 border border-teal-200/80 rounded-[18px] p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0F766E]" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">
                        Explicación ciudadana
                      </h3>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {selectedArticle.citizenSummary || selectedArticle.content}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-[18px] p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      Puntos clave para el ciudadano:
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>Protege tus derechos en procedimientos policiales e identificaciones.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>Exige cumplimiento estricto de los límites legales por parte de las autoridades.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {modalTab === 'texto' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Transcripción del documento publicado:</span>
                    <span>Versión: {selectedArticle.version}</span>
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-[18px] text-xs leading-relaxed font-mono whitespace-pre-line border border-slate-800 shadow-inner">
                    {selectedArticle.content}
                  </div>
                </div>
              )}

              {modalTab === 'practico' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/70 border border-blue-200/70 rounded-[18px] p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-[#0F4C81] flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#0F4C81]" />
                      <span>Cuándo HablaPE cita esta norma</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(selectedArticle.whenUsed || [
                        'Al absolver consultas sobre identificación en la vía pública.',
                        'Para validar tus derechos si utilizas DNI Digital.'
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#0F4C81] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedArticle.faqs && selectedArticle.faqs.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-[18px] p-4 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                        <span>Preguntas frecuentes</span>
                      </h4>
                      <div className="space-y-2">
                        {selectedArticle.faqs.map((faq, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                            <p className="text-xs font-bold text-slate-900">P: {faq.question}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">R: {faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'fuente' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-[18px] p-4 text-xs text-emerald-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                      Verificación en Fuentes Oficiales del Estado Peruano
                    </p>
                    <p className="text-slate-600">
                      HablaPE valida esta norma directamente contra el Sistema Peruano de Información Jurídica (SPIJ/MINJUS) y El Peruano.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <a
                      href={selectedArticle.spijUrl || selectedArticle.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-[18px] bg-white border border-slate-200 hover:border-[#0F4C81] transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sistema SPIJ MINJUS</span>
                        <h5 className="text-xs font-extrabold text-[#0F4C81] group-hover:underline">
                          Ver documento en SPIJ
                        </h5>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0F4C81] shrink-0" />
                    </a>

                    <a
                      href={selectedArticle.elPeruanoUrl || selectedArticle.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-[18px] bg-white border border-slate-200 hover:border-[#0F766E] transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Diario Oficial El Peruano</span>
                        <h5 className="text-xs font-extrabold text-[#0F766E] group-hover:underline">
                          Ver publicación en El Peruano
                        </h5>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0F766E] shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Normativa Oficial del Estado Peruano
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
