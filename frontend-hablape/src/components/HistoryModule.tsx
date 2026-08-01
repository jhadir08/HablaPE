import React from 'react';
import { History, Bookmark, Trash2, ExternalLink, MessageSquareText, BookOpen, Clock } from 'lucide-react';
import { SavedItem } from '../types';

interface HistoryModuleProps {
  savedItems: SavedItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onViewItemDetail: (item: SavedItem) => void;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  savedItems,
  onClearHistory,
  onRemoveItem,
  onViewItemDetail
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-red-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
              Historial Local
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Consultas y Artículos Guardados</h1>
          <p className="text-xs text-slate-300 mt-1">
            Tus casos analizados y normas marcadas guardadas en tu navegador para acceso rápido.
          </p>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start md:self-center"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Historial</span>
          </button>
        )}
      </div>

      {/* Content */}
      {savedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No tienes elementos guardados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cuando realices una consulta o marques un artículo de ley, podrás guardarlo aquí para consultarlo más tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'query' 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {item.type === 'query' ? <MessageSquareText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.type === 'query' ? 'Caso de Intervención' : 'Norma Legal'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timestamp}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs md:text-sm truncate mt-0.5">{item.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.type === 'query' && (
                  <button
                    onClick={() => onViewItemDetail(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <span>Ver Resultado</span>
                  </button>
                )}

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Eliminar de guardados"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
