import React from 'react';
import { Cpu, Database, ShieldCheck, CheckCircle2, FileJson, ArrowDown, Sparkles, Layers, Lock, Search } from 'lucide-react';

export const PipelineAuditModule: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: '1. Entrada Multimodal del Ciudadano',
      description: 'Recepciones en texto libre, grabación de voz (audio PCM/webm) o fotografía de documento/acta.',
      tech: 'React Frontend -> Express Orchestrator Hub',
      icon: Layers,
      badge: 'Multimodal'
    },
    {
      id: 2,
      title: '2. Gemma 4: Clasificación y Extracción (JSON Schema)',
      description: 'Gemma 4 (~12B) clasifica la intervención, extrae hechos presentes/faltantes y emite un contrato JSON estructurado.',
      tech: 'GoogleGenAI SDK (@google/genai) | gemini-3.6-flash',
      icon: Cpu,
      badge: 'Gemma 4 Brain',
      highlight: true
    },
    {
      id: 3,
      title: '3. Bucle de Aclaración de Datos Faltantes',
      description: 'Si faltan campos indispensables (ej. si hubo retención o si lleva DNI), el orquestador solicita precisión antes de avanzar.',
      tech: 'Motor de Decisión Determinístico',
      icon: Lock,
      badge: 'Seguridad'
    },
    {
      id: 4,
      title: '4. Recuperación Vectorial RAG en Corpus Oficial',
      description: 'Búsqueda semántica en base vectorial del corpus de leyes peruanas (D.S. N° 012-2025-IN, CPP Art. 205, D.Leg. 1267).',
      tech: 'Embedding Vector Search + Metadatos de Versión',
      icon: Database,
      badge: 'Corpus 2025'
    },
    {
      id: 5,
      title: '5. Motor Determinístico de Vigencia y Reglas',
      description: 'Valida que solo se cite normativa vigente (descartando decretos derogados como D.S. 026-2017-IN) y fija umbrales de relevancia.',
      tech: 'Filtro Determinístico Python/TS (Sin Alucinaciones)',
      icon: ShieldCheck,
      badge: 'Cero Alucinación'
    },
    {
      id: 6,
      title: '6. Gemma 4: Generación de Respuesta y Frases',
      description: 'Sintetiza la explicación en lenguaje claro, redacta frases sugeridas de diálogo con respeto y agrega enlaces a fuentes oficiales.',
      tech: 'Gemma 4 Restringido al Contexto RAG Recuperado',
      icon: Sparkles,
      badge: 'Generación Clara',
      highlight: true
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
            Arquitectura de Sistema & RAG Pipeline
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Auditoría Técnica del Motor Gemma 4 RAG
        </h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Esta vista expone el flujo interno de procesamiento de <strong className="text-white">HablaPE</strong>. Demuestra de manera transparente cómo <strong className="text-blue-300">Gemma 4</strong> actúa como el componente central de comprensión y generación en combinación con el motor RAG de normativa oficial peruana.
        </p>
      </div>

      {/* Tech Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-xs font-extrabold uppercase text-slate-500">Modelo Central</div>
          <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Gemma 4 (12B Multimodal)
          </div>
          <p className="text-[11px] text-slate-600">Comprensión de voz, texto e imagen con salida en JSON estricto.</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-xs font-extrabold uppercase text-slate-500">Garantía Anti-Alucinación</div>
          <div className="text-base font-extrabold text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Motor Determinístico
          </div>
          <p className="text-[11px] text-slate-600">Verifica la vigencia de normas y bloquea consultas sin evidencia.</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-xs font-extrabold uppercase text-slate-500">Base Normativa</div>
          <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-red-600" /> D.S. N° 012-2025-IN + CPP
          </div>
          <p className="text-[11px] text-slate-600">Corpus 100% oficial del Estado Peruano indexado con metadatos.</p>
        </div>
      </div>

      {/* Pipeline Diagram Sequence */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-600" />
          Flujo del Pipeline de Consulta (Paso a Paso)
        </h2>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <div className={`p-4 rounded-xl border transition-all ${
                  step.highlight 
                    ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        step.highlight ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">{step.title}</h3>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            step.highlight
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0 self-start md:self-center">
                      {step.tech}
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowDown className="w-5 h-5 text-slate-400 animate-bounce" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* JSON Schema Contract Box */}
      <div className="bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-2 font-bold text-slate-200">
            <FileJson className="w-4 h-4 text-emerald-400" />
            Contrato JSON Estructurado de Salida (Gemma 4)
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Strict Schema Enforcement
          </span>
        </div>

        <pre className="overflow-x-auto text-[11px] text-emerald-300 bg-slate-900/90 p-4 rounded-xl border border-slate-800 leading-relaxed">
{`{
  "scenario": {
    "category": "Control de Identidad Policial",
    "riskLevel": "bajo" | "medio" | "alto",
    "needsClarification": boolean
  },
  "facts": [
    { "category": "Sujeto", "detail": "...", "status": "present" | "missing" }
  ],
  "explanation": {
    "overview": "...",
    "citizenRights": ["..."],
    "whatPoliceCannotDo": ["..."]
  },
  "suggestedPhrases": [
    { "phrase": "...", "context": "...", "purpose": "..." }
  ],
  "legalReferences": [
    { "code": "D.S. N° 012-2025-IN", "article": "Art. 8", "version": "2025 (Vigente)" }
  ]
}`}
        </pre>
      </div>
    </div>
  );
};
