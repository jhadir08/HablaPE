import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, CheckCircle, AlertCircle, Bookmark, Copy, Check, Filter } from 'lucide-react';
import { CorpusArticle, SavedItem } from '../types';
import { LEGAL_CORPUS } from '../data/legalCorpus';

interface CorpusModuleProps {
  onSaveItem: (item: SavedItem) => void;
}

export const CorpusModule: React.FC<CorpusModuleProps> = ({ onSaveItem }) => {
  const [corpusList, setCorpusList] = useState<CorpusArticle[]>(LEGAL_CORPUS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', label: 'Todas las Normas' },
    { id: 'Control de Identidad', label: 'Control de Identidad' },
    { id: 'Atribuciones Policiales', label: 'Atribuciones Policiales' },
    { id: 'Garantías Constitucionales', label: 'Garantías Constitucionales' },
    { id: 'Derechos Humanos', label: 'Derechos Humanos' }
  ];

  useEffect(() => {
    let filtered = [...LEGAL_CORPUS];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((art) => art.category === selectedCategory);
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
          art.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    setCorpusList(filtered);
  }, [searchQuery, selectedCategory]);

  const handleCopyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
            Base de Conocimiento Oficial
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Corpus Legal Oficial de Control de Identidad (Perú)
        </h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Explora los artículos, normas y decretos supremos vigentes que respaldan las respuestas del sistema. Incluye la norma vigente <strong className="text-white">D.S. N° 012-2025-IN</strong>, las modificaciones del <strong className="text-white">Código Procesal Penal (Art. 205)</strong> y los manuales de DDHH de la PNP.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por artículo, término (ej. DNI digital, 4 horas, celular, retención)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corpus Articles List */}
      <div className="space-y-4">
        {corpusList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No se encontraron normas que coincidan con los criterios de búsqueda.
          </div>
        ) : (
          corpusList.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{article.code}</span>
                    <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded">
                      {article.articleNumber}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
                      article.isVigente
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {article.isVigente ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-red-600" />}
                      {article.version}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{article.title}</h3>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() => handleBookmarkArticle(article)}
                    disabled={savedIds.has(article.id)}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                      savedIds.has(article.id)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedIds.has(article.id) ? 'Guardado' : 'Guardar'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(`${article.code} (${article.articleNumber}): ${article.content}`, article.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === article.id ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Article Content */}
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100 font-sans">
                {article.content}
              </div>

              {/* Card Footer */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Etiquetas:</span>
                  {article.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>

                {article.officialUrl && (
                  <a
                    href={article.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 underline shrink-0"
                  >
                    <span>Ver en El Peruano / SPIJ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
