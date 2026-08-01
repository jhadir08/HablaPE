import React from 'react';
import { ShieldCheck, CreditCard, Smartphone, Clock, Globe, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';
import { FREQUENT_SCENARIOS } from '../data/legalCorpus';
import { FrequentScenario } from '../types';

interface ScenariosModuleProps {
  onSelectScenario: (scenario: FrequentScenario) => void;
}

export const ScenariosModule: React.FC<ScenariosModuleProps> = ({ onSelectScenario }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'CreditCard': return CreditCard;
      case 'Smartphone': return Smartphone;
      case 'Clock': return Clock;
      case 'Globe': return Globe;
      default: return ShieldCheck;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            Casos Frecuentes y Simulador
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Simulador Práctico de Intervenciones Policiales
        </h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Practica situaciones reales de control de identidad en las calles del Perú. Conoce de antemano qué derechos te asisten y desmonta los mitos más comunes sobre la actuación policial.
        </p>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FREQUENT_SCENARIOS.map((sc) => {
          const Icon = getIcon(sc.iconName);
          return (
            <div
              key={sc.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{sc.title}</h3>
                    <p className="text-slate-500 text-xs">{sc.summary}</p>
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                    Puntos Clave de Ley:
                  </span>
                  {sc.keyTakeaways.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {/* Misconceptions */}
                <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs">
                  <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">
                    Mitos Desmentidos:
                  </span>
                  {sc.commonMisconceptions.map((mito, idx) => (
                    <p key={idx} className="text-amber-950 text-[11px]">
                      • {mito}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectScenario(sc)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Probar este caso en el Asistente</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
