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
  Shield, 
  Check, 
  HelpCircle,
  Layers,
  ArrowRight,
  ChevronRight
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
    'Derechos Humanos'
  ];

  // Visual Category Cards definition
  const categoryCards = [
    {
      id: 'all',
      title: 'Todas las Normas',
      icon: Layers,
      bgColor: 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700',
      activeColor: 'bg-[#0F4C81] text-white shadow-md ring-2 ring-[#0F4C81]/30',
      count: LEGAL_CORPUS.length
    },
    {
      id: 'Control de Identidad',
      title: 'Control de Identidad',
      icon: UserCheck,
      bgColor: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border border-blue-200/60',
      activeColor: 'bg-[#0F4C81] text-white shadow-md ring-2 ring-[#0F4C81]/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Control de Identidad' || art.tags.includes('identificación')).length
    },
    {
      id: 'Celulares',
      title: 'Celulares',
      icon: Smartphone,
      bgColor: 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-900 border border-teal-200/60',
      activeColor: 'bg-[#0F766E] text-white shadow-md ring-2 ring-[#0F766E]/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Celulares' || art.tags.includes('celular') || art.tags.includes('DNI digital')).length
    },
    {
      id: 'Garantías Constitucionales',
      title: 'Derechos',
      icon: Scale,
      bgColor: 'bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/60',
      activeColor: 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-500/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Garantías Constitucionales' || art.tags.includes('derechos')).length
    },
    {
      id: 'Procedimientos',
      title: 'Procedimientos',
      icon: Building2,
      bgColor: 'bg-sky-50/80 hover:bg-sky-100/80 text-sky-900 border border-sky-200/60',
      activeColor: 'bg-sky-600 text-white shadow-md ring-2 ring-sky-400/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Procedimientos' || art.category === 'Atribuciones Policiales' || art.tags.includes('comisaria')).length
    },
    {
      id: 'Constitución',
      title: 'Constitución',
      icon: BookOpen,
      bgColor: 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border border-amber-200/60',
      activeColor: 'bg-amber-700 text-white shadow-md ring-2 ring-amber-500/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Constitución' || art.code.includes('Const')).length
    },
    {
      id: 'Derechos Humanos',
      title: 'Derechos Humanos',
      icon: ShieldCheck,
      bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/60',
      activeColor: 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/30',
      count: LEGAL_CORPUS.filter((art) => art.category === 'Derechos Humanos').length
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
      {/* 1. HERO SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xs overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Text & Badges */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 text-xs font-bold px-3 py-1 rounded-full">
                <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
                Base Legal Transparente
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E293B] leading-tight">
              Biblioteca Oficial
            </h1>

            <p className="text-[#1E293B]/80 text-sm md:text-base leading-relaxed">
              Toda la información utilizada por HablaPE proviene exclusivamente de documentos oficiales del Estado Peruano.
            </p>

            {/* 3 Indicators with Green Checkmarks */}
            <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Normativa vigente 2025
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Corpus oficial indexado
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Actualización automática
              </span>
            </div>
          </div>

          {/* Right: Modern Flat Illustration */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-sm rounded-[22px] overflow-hidden bg-slate-50 border border-slate-200/80 p-3 shadow-2xs">
              <img 
                src={heroIllustration} 
                alt="Biblioteca Oficial HablaPE"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover rounded-[18px] transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BUSCADOR TIPO GOOGLE */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artículo, palabra clave o derecho..."
            className="w-full pl-12 pr-10 py-3.5 rounded-[18px] border border-slate-300/90 bg-slate-50/50 text-sm text-[#1E293B] placeholder-slate-400 focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all shadow-2xs font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestions Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 mr-1">Sugerencias rápidas:</span>
          {quickSuggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => setSearchQuery(sug)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                searchQuery.toLowerCase() === sug.toLowerCase()
                  ? 'bg-[#0F4C81] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-[#0F4C81]'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CATEGORÍAS (Tarjetas Visuales) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
            Explorar por Categoría
          </h2>
          {selectedCategory !== 'all' && (
            <button 
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              Ver todas ({LEGAL_CORPUS.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categoryCards.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 rounded-[20px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 group ${
                  isSelected ? cat.activeColor : cat.bgColor
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-[#0F4C81] shadow-2xs'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/90 text-slate-600'
                  }`}>
                    {cat.count}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold line-clamp-1">
                    {cat.title}
                  </h3>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {cat.count} {cat.count === 1 ? 'artículo' : 'artículos'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. RESULTADOS DE NORMAS (Tarjetas Modernas con Resumen Ciudadano de IA) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
            Normas Encontradas ({corpusList.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Resumen en lenguaje claro para ciudadanos
          </span>
        </div>

        {corpusList.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-[24px] p-10 text-center text-slate-500 text-sm space-y-3">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No se encontraron normas para tu búsqueda.</p>
            <p className="text-xs text-slate-400">Intenta con otros términos como DNI, celular, retención o comisaría.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0F4C81]"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {corpusList.map((article) => {
              const isSaved = savedIds.has(article.id);
              const summaryText = article.citizenSummary || article.content.slice(0, 140) + '...';

              return (
                <div
                  key={article.id}
                  className="bg-white border border-slate-200/90 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#0F4C81]/30 transition-all space-y-4"
                >
                  {/* Top Bar: Code, Article, Vigente Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#0F4C81] bg-[#0F4C81]/10 px-3 py-1 rounded-full border border-[#0F4C81]/20">
                        {article.code}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-200">
                        {article.articleNumber}
                      </span>
                    </div>

                    {/* Estado Vigente Badge */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      Estado Vigente
                    </span>
                  </div>

                  {/* Title & Document Source */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {article.documentTitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B] mt-0.5">
                      {article.title}
                    </h3>
                  </div>

                  {/* Resumen Ciudadano Generado por IA (Max 2 líneas) */}
                  <div className="bg-gradient-to-r from-teal-50/70 to-sky-50/70 border border-teal-200/60 rounded-[16px] p-3.5 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#0F766E]/10 text-[#0F766E] shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E]">
                        Resumen ciudadano (IA HablaPE)
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-0.5 line-clamp-2">
                        {summaryText}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Ver detalle, Guardar, Compartir, Fuente oficial */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {/* Primary Action: Ver Detalle */}
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        setModalTab('resumen');
                      }}
                      className="px-4 py-2.5 rounded-[14px] bg-[#0F4C81] hover:bg-[#0D406E] text-white font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver detalle completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-2">
                      {/* Guardar */}
                      <button
                        onClick={() => handleBookmarkArticle(article)}
                        disabled={isSaved}
                        className={`px-3 py-2 rounded-[14px] text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isSaved ? 'Guardado' : 'Guardar'}</span>
                      </button>

                      {/* Compartir */}
                      <button
                        onClick={() => handleCopyText(`${article.code} - ${article.title}: ${summaryText}`, article.id)}
                        className="px-3 py-2 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copiedId === article.id ? 'Copiado' : 'Compartir'}</span>
                      </button>

                      {/* Fuente Oficial */}
                      {article.officialUrl && (
                        <a
                          href={article.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-[14px] bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200/80 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Fuente oficial</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DETALLE DE ARTÍCULO (4 PESTAÑAS) */}
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
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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

            {/* Modal 4 Tabs Header */}
            <div className="bg-slate-100/80 border-b border-slate-200 p-2 flex overflow-x-auto gap-1">
              {/* Tab 1: Resumen ciudadano */}
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

              {/* Tab 2: Texto oficial */}
              <button
                onClick={() => setModalTab('texto')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'texto'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span>Texto oficial</span>
              </button>

              {/* Tab 3: Aplicaciones prácticas */}
              <button
                onClick={() => setModalTab('practico')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'practico'
                    ? 'bg-white text-[#0F4C81] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aplicaciones prácticas</span>
              </button>

              {/* Tab 4: Fuente oficial */}
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

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Pestaña 1: Resumen Ciudadano */}
              {modalTab === 'resumen' && (
                <div className="space-y-4">
                  <div className="bg-teal-50/80 border border-teal-200/80 rounded-[18px] p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0F766E]" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">
                        Explicación sencilla en lenguaje ciudadano
                      </h3>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {selectedArticle.citizenSummary || selectedArticle.content}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-[18px] p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      Key Takeaways para el ciudadano:
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>Respalda tus derechos fundamentales durante cualquier requerimiento de identificación.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <span>Obliga al efectivo policial a cumplir principios estricto de proporcionalidad y respeto.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Pestaña 2: Texto Oficial */}
              {modalTab === 'texto' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Transcripción del documento oficial:</span>
                    <span>Versión: {selectedArticle.version}</span>
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-[18px] text-xs leading-relaxed font-mono whitespace-pre-line border border-slate-800 shadow-inner">
                    {selectedArticle.content}
                  </div>
                </div>
              )}

              {/* Pestaña 3: Aplicaciones Prácticas */}
              {modalTab === 'practico' && (
                <div className="space-y-4">
                  {/* Card 1: Cuando HablaPE utiliza esta norma */}
                  <div className="bg-blue-50/70 border border-blue-200/70 rounded-[18px] p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-[#0F4C81] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F4C81]" />
                      <span>✔ Cuándo HablaPE utiliza esta norma</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(selectedArticle.whenUsed || [
                        'Al responder consultas sobre identificación policial en vía pública.',
                        'Para validar tus derechos si no portas DNI físico.'
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#0F4C81] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 2: Casos relacionados */}
                  <div className="bg-teal-50/70 border border-teal-200/70 rounded-[18px] p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-[#0F766E] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                      <span>✔ Casos relacionados</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {(selectedArticle.relatedCases || [
                        'Control de identidad preventivo en vía pública',
                        'Verificación biométrica en comisaría'
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#0F766E] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 3: Preguntas frecuentes */}
                  {selectedArticle.faqs && selectedArticle.faqs.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-[18px] p-4 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                        <span>✔ Preguntas frecuentes</span>
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

              {/* Pestaña 4: Fuente Oficial */}
              {modalTab === 'fuente' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-[18px] p-4 text-xs text-emerald-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                      Verificación en Bases de Datos Oficiales del Estado Peruano
                    </p>
                    <p className="text-slate-600">
                      HablaPE valida esta norma contra los repositorios jurídicos oficiales SPIJ (MINJUS) y el Diario Oficial El Peruano.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Botón SPIJ */}
                    <a
                      href={selectedArticle.spijUrl || selectedArticle.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-[18px] bg-white border border-slate-200 hover:border-[#0F4C81] hover:bg-slate-50 transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sistema Peruano de Info Jurídica</span>
                        <h5 className="text-xs font-extrabold text-[#0F4C81] group-hover:underline">
                          Ver documento en SPIJ
                        </h5>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0F4C81] shrink-0" />
                    </a>

                    {/* Botón El Peruano */}
                    <a
                      href={selectedArticle.elPeruanoUrl || selectedArticle.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-[18px] bg-white border border-slate-200 hover:border-[#0F766E] hover:bg-slate-50 transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Diario Oficial del Estado</span>
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
                Normativa Oficial del Estado Peruano 2025
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
