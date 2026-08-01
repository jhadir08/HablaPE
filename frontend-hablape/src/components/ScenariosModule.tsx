import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Clock, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  UserCheck, 
  Building2, 
  Scale, 
  Sparkles, 
  Play, 
  RotateCcw, 
  X, 
  MessageSquare, 
  BookOpen, 
  Award, 
  AlertTriangle,
  ChevronRight,
  Zap,
  Check,
  Share2
} from 'lucide-react';
import { FrequentScenario } from '../types';
import heroIllustration from '../assets/images/hablape_simulator_hero_illustration_1785605743358.jpg';

interface ScenariosModuleProps {
  onSelectScenario: (scenario: FrequentScenario) => void;
}

interface ScenarioInteractive {
  id: string;
  category: string;
  categoryIcon: React.ElementType;
  title: string;
  shortDescription: string;
  level: 'Básico' | 'Intermedio' | 'Avanzado';
  estimatedTime: string;
  situationContext: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: {
      title: string;
      whatDidWell: string;
      whatToImprove: string;
      legalNorm: string;
      suggestedPhrase: string;
    };
  }[];
}

const INTERACTIVE_SCENARIOS: ScenarioInteractive[] = [
  {
    id: 'no-dni-fisico',
    category: 'Identificación',
    categoryIcon: UserCheck,
    title: 'No llevo mi DNI físico',
    shortDescription: '¿Qué alternativas oficiales tienes si te olvidaste la billetera en casa?',
    level: 'Básico',
    estimatedTime: '2 min',
    situationContext: 'Te encuentras caminando de regreso a casa por la noche y un efectivo policial de la PNP te hace la señal de detención para un control preventivo de identidad. Al buscar en tus bolsillos, descubres que dejaste tu billetera con tu DNI azul físico.',
    question: 'El policía te solicita mostrar tu documento de identidad. ¿Cómo debes actuar según la ley vigente 2025?',
    options: [
      {
        id: 'a',
        text: 'Informarle respetuosamente que posees tu DNI digital en la app de RENIEC de tu celular o mostrar tu Licencia de Conducir física/virtual.',
        isCorrect: true,
        feedback: {
          title: '¡Respuesta Correcta!',
          whatDidWell: 'Utilizaste un medio de identificación digital válido amparado por la ley peruana sin generar conflicto.',
          whatToImprove: 'Asegúrate de tener siempre instalada y abierta la app oficial de RENIEC para acelerar la comprobación.',
          legalNorm: 'D.S. N° 012-2025-IN Art. 8 (Identificación Digital)',
          suggestedPhrase: 'Buenas noches oficial, no cargo el DNI físico en este momento pero puedo mostrarle mi DNI digital oficial desde la aplicación de RENIEC en mi celular.'
        }
      },
      {
        id: 'b',
        text: 'Aceptar ser conducido de inmediato al calabozo de la comisaría sin mencionar que tienes tu celular con fotos de tus documentos.',
        isCorrect: false,
        feedback: {
          title: 'Decisión mejorable',
          whatDidWell: 'Mantuviste una actitud colaborativa.',
          whatToImprove: 'No debes asumir que el traslado a comisaría es inevitable sin intentar antes mostrar medios digitales o alternativos.',
          legalNorm: 'D.S. N° 012-2025-IN Art. 8 & CPP Art. 205',
          suggestedPhrase: 'Oficial, antes de cualquier traslado, por favor permítame mostrarle mi DNI digital o solicitar a un familiar que me traiga el documento.'
        }
      },
      {
        id: 'c',
        text: 'Exigir de manera enfadada que te dejen ir inmediatamente porque no has cometido ningún delito.',
        isCorrect: false,
        feedback: {
          title: 'Respuesta incorrecta',
          whatDidWell: 'Reconoces que no cometiste un delito.',
          whatToImprove: 'El control de identidad es una facultad policial preventiva. Reaccionar de forma agresiva puede interpretarse como desobediencia a la autoridad.',
          legalNorm: 'Código Procesal Penal Art. 205 (Atribución Policial)',
          suggestedPhrase: 'Oficial, entiendo que realiza un control preventivo, con gusto le muestro mi identificación digital.'
        }
      }
    ]
  },
  {
    id: 'revision-celular',
    category: 'Celulares',
    categoryIcon: Smartphone,
    title: 'La Policía quiere revisar mi celular',
    shortDescription: 'Conoce tus derechos ante solicitudes de revisión de mensajes, fotos o aplicaciones.',
    level: 'Intermedio',
    estimatedTime: '3 min',
    situationContext: 'Durante una intervención en la vía pública, el efectivo policial te pide tu teléfono inteligente y te exige que lo desbloquees para revisar tus fotos y tus conversaciones de WhatsApp.',
    question: '¿Cuál es la conducta protegida por la ley peruana ante este requerimiento?',
    options: [
      {
        id: 'a',
        text: 'Recordarle respetuosamente que el secreto de las telecomunicaciones es un derecho constitucional e inviolable, y que el control de DNI no faculta revisar tus chats.',
        isCorrect: true,
        feedback: {
          title: '¡Respuesta Correcta!',
          whatDidWell: 'Defendiste tu derecho fundamental a la privacidad de comunicaciones de manera serena y fundamentada.',
          whatToImprove: 'Mantén la calma y evita que el diálogo se convierta en una discusión acalorada.',
          legalNorm: 'Const. Art. 2 Inc. 10 & D.S. N° 012-2025-IN Art. 12',
          suggestedPhrase: 'Oficial, con todo respeto, el control de identidad me faculta mostrarle mi DNI, pero por Constitución mis comunicaciones y chats privados son inviolables sin orden de un juez.'
        }
      },
      {
        id: 'b',
        text: 'Entregar el celular desbloqueado y permitirle leer tus conversaciones privadas para terminar rápido.',
        isCorrect: false,
        feedback: {
          title: 'Riesgo de vulneración de privacidad',
          whatDidWell: 'Evitaste discusiones en la vía pública.',
          whatToImprove: 'Renunciar a tus derechos constitucionales por apuro sienta un precedente peligroso de abuso de poder.',
          legalNorm: 'Constitución Política del Perú Art. 2 Inc. 10',
          suggestedPhrase: 'Oficial, prefiero mantener bloqueado mi dispositivo ya que contiene información personal y bancaria protegida.'
        }
      },
      {
        id: 'c',
        text: 'Arrebatarle el teléfono de las manos al oficial y salir corriendo.',
        isCorrect: false,
        feedback: {
          title: 'Respuesta de alto riesgo',
          whatDidWell: 'Ninguno.',
          whatToImprove: 'Huir o forcejear con la policía constituye infracción penal grave por violencia o resistencia a la autoridad.',
          legalNorm: 'Código Penal Art. 368',
          suggestedPhrase: 'Oficial, le pido mantener la calma. Por normativa vigente, no corresponde la inspección de mi teléfono.'
        }
      }
    ]
  },
  {
    id: 'traslado-comisaria',
    category: 'Comisaría',
    categoryIcon: Building2,
    title: 'Me trasladan a la comisaría',
    shortDescription: 'Límites de tiempo, prohibición de calabozo y derecho a llamada telefónica.',
    level: 'Intermedio',
    estimatedTime: '3 min',
    situationContext: 'Al no poder corroborar tu identidad en la vía pública por falla de sistema, la Policía te traslada a la comisaría del sector en un patrullero para verificación biométrica.',
    question: 'Al ingresar a la comisaría, ¿cuáles son las garantías legales estrictas que debes solicitar?',
    options: [
      {
        id: 'a',
        text: 'Exigir ser registrado en el Libro de Registro de Retenidos, recordar que la retención es máximo 4 horas, prohibir tu ingreso a calabozos y pedir hacer una llamada.',
        isCorrect: true,
        feedback: {
          title: '¡Respuesta Impecable!',
          whatDidWell: 'Enumeraste con precisión las tres protecciones legales de la retención por identificación en Perú.',
          whatToImprove: 'Verifica la hora exacta de ingreso para contar el límite improrrogable de 4 horas.',
          legalNorm: 'CPP Art. 205 Incisos 4 y 5 (Ley 32130)',
          suggestedPhrase: 'Oficial de guardia, solicito amablemente que anoten mi hora de ingreso en el Libro de Registro de Retenidos y se me permita realizar una llamada telefónica a mi familiar.'
        }
      },
      {
        id: 'b',
        text: 'Aceptar sin objeción que te encierren en la celda común junto a detenidos por delitos graves.',
        isCorrect: false,
        feedback: {
          title: 'Vulneración de derechos',
          whatDidWell: 'No te opusiste a las autoridades.',
          whatToImprove: 'La ley prohíbe explícitamente ingresar a celdas a personas retenidas solo por comprobación de DNI.',
          legalNorm: 'Código Procesal Penal Art. 205.5',
          suggestedPhrase: 'Oficial, la norma establece que la retención no se realiza en celdas de detenidos sino en la sala de atención ciudadana.'
        }
      },
      {
        id: 'c',
        text: 'Exigir ser liberado en 5 minutos de forma prepotente.',
        isCorrect: false,
        feedback: {
          title: 'Respuesta inadecuada',
          whatDidWell: 'Valoras tu tiempo.',
          whatToImprove: 'La Policía tiene un plazo legal de hasta 4 horas para realizar las diligencias biométricas de comprobación.',
          legalNorm: 'Código Procesal Penal Art. 205.4',
          suggestedPhrase: 'Comprendo que el trámite lleva tiempo, estaré atento al cumplimiento del plazo de 4 horas.'
        }
      }
    ]
  },
  {
    id: 'identificacion-policial',
    category: 'Procedimiento policial',
    categoryIcon: ShieldCheck,
    title: 'El policía no quiere identificarse',
    shortDescription: 'Aprende cómo solicitar la identificación y número de placa del efectivo.',
    level: 'Básico',
    estimatedTime: '2 min',
    situationContext: 'Un agente vestido de civil o en uniforme se aproxima bruscamente y te ordena entregar tu DNI sin presentarse ni indicar la causa de la intervención.',
    question: '¿Cómo debes responder según los protocolos del Ministerio del Interior?',
    options: [
      {
        id: 'a',
        text: 'Pedirle cortésmente su nombre, apellidos, grado y la comisaría a la que pertenece antes o al momento de exhibir tu documento.',
        isCorrect: true,
        feedback: {
          title: '¡Excelente cultura ciudadana!',
          whatDidWell: 'Ejerciste tu derecho a saber quién te está interviniendo de acuerdo al Manual de DDHH de la PNP.',
          whatToImprove: 'Anota mentalmente o en tu teléfono el nombre y grado del efectivo.',
          legalNorm: 'Manual de DDHH aplicados a la Función Policial R.M. 1452-2018-IN',
          suggestedPhrase: 'Buenas tardes oficial, con mucho gusto le muestro mi DNI. Por favor, ¿podría brindarme su nombre, grado y la dependencia a la que pertenece?'
        }
      },
      {
        id: 'b',
        text: 'Negarte a mostrar el DNI hasta que un fiscal llegue a la escena.',
        isCorrect: false,
        feedback: {
          title: 'Exceso de pretensión',
          whatDidWell: 'Buscas garantías legales.',
          whatToImprove: 'Para un control preventivo de identidad en la calle no se requiere presencia fiscal previa.',
          legalNorm: 'Código Procesal Penal Art. 205',
          suggestedPhrase: 'Oficial, estoy dispuesto a identificarme inmediatamente en cuanto usted se identifique.'
        }
      },
      {
        id: 'c',
        text: 'Comenzar a grabar con el celular pegándolo a la cara del oficial mientras le gritas.',
        isCorrect: false,
        feedback: {
          title: 'Escalación innecesaria',
          whatDidWell: 'Sabes que puedes registrar intervenciones.',
          whatToImprove: 'Tienes derecho a grabar la intervención de forma prudente, pero invadir el espacio físico del oficial distorsiona la transparencia.',
          legalNorm: 'Directiva de Transparencia Policial PNP',
          suggestedPhrase: 'Oficial, procederé a registrar la intervención de manera respetuosa a una distancia prudente para seguridad de ambos.'
        }
      }
    ]
  },
  {
    id: 'ciudadano-extranjero',
    category: 'Extranjeros',
    categoryIcon: Globe,
    title: 'Soy ciudadano extranjero',
    shortDescription: 'Documentos válidos (Carnet de Extranjería/CPP) y plazo máximo de retención de 12 horas.',
    level: 'Avanzado',
    estimatedTime: '3 min',
    situationContext: 'Eres un residente extranjero viviendo en Lima y la policía te detiene durante un operativo de control de identidad y fiscalización migratoria.',
    question: '¿Qué documentos son totalmente legalizables en la intervención y cuál es el plazo de retención máximo?',
    options: [
      {
        id: 'a',
        text: 'Presentar tu Carnet de Extranjería, CPP o Pasaporte. Si hay traslado para verificación migratoria, el plazo máximo de retención es de 12 horas.',
        isCorrect: true,
        feedback: {
          title: '¡Conocimiento Legal Preciso!',
          whatDidWell: 'Reconociste los documentos migratorios oficializados y el límite temporal especial de 12 horas estipulado en la Ley 32130.',
          whatToImprove: 'Ten siempre la foto o copia física del CPP/Carnet guardada en la nube.',
          legalNorm: 'CPP Art. 205 (Modificado por Ley N° 32130 - 2025)',
          suggestedPhrase: 'Buenas tardes oficial, soy residente y aquí le muestro mi Carnet de Extranjería / CPP vigente verificado por Migraciones.'
        }
      },
      {
        id: 'b',
        text: 'Creer que como extranjero no tienes derecho a realizar ninguna llamada telefónica si te conducen a comisaría.',
        isCorrect: false,
        feedback: {
          title: 'Concepto erróneo',
          whatDidWell: 'Ninguno.',
          whatToImprove: 'Las garantías constitucionales de comunicación y trato digno se aplican a todas las personas en territorio nacional sin importar nacionalidad.',
          legalNorm: 'Constitución Política del Perú Art. 2 & Convenios de DDHH',
          suggestedPhrase: 'Solicito amablemente comunicarme con mi consulado o con un familiar cercano para informar mi ubicación.'
        }
      },
      {
        id: 'c',
        text: 'Pensar que te pueden retener indefinidamente por días hasta que abra Migraciones.',
        isCorrect: false,
        feedback: {
          title: 'Falso mito legal',
          whatDidWell: 'Ninguno.',
          whatToImprove: 'La ley impone un techo improrrogable de 12 horas para extranjeros durante el control de identidad.',
          legalNorm: 'Código Procesal Penal Art. 205 Inc. 4',
          suggestedPhrase: 'Oficial, de acuerdo a la ley 32130, el procedimiento de verificación migratoria tiene un tope máximo de 12 horas.'
        }
      }
    ]
  }
];

const FREQUENT_MYTHS = [
  {
    id: 'm1',
    myth: 'Si no llevo mi DNI azul/amarillo físico en el bolsillo, me van a detener de inmediato.',
    reality: 'FALSO. El D.S. N° 012-2025-IN autoriza identificarse mediante DNI digital en app de RENIEC, Licencia de Conducir o Pasaporte sin que implique infracción.',
    legalBasis: 'D.S. N° 012-2025-IN Art. 8'
  },
  {
    id: 'm2',
    myth: 'La Policía me puede enviar directo a un calabozo o celda común mientras revisan mis antecedentes.',
    reality: 'FALSO. El Art. 205.5 del Código Procesal Penal prohíbe taxativamente encerrar en calabozos a ciudadanos retenidos únicamente por comprobación de DNI.',
    legalBasis: 'CPP Art. 205.5 (Ley 32130)'
  },
  {
    id: 'm3',
    myth: 'Un efectivo policial puede obligarme a desbloquear mi celular y leer mis conversaciones de WhatsApp.',
    reality: 'FALSO. Por Art. 2 inc. 10 de la Constitución, las comunicaciones privadas son inviolables. El control de identidad jamás autoriza inspeccionar dispositivos.',
    legalBasis: 'Constitución Política Art. 2 Inc. 10'
  },
  {
    id: 'm4',
    myth: 'Pueden retenerme en la comisaría por más de 24 horas si el sistema de RENIEC se cae.',
    reality: 'FALSO. El tiempo máximo de retención es de 4 horas improrrogables para peruanos (12 horas para extranjeros). Cumplido el plazo sin delito, debes ser liberado.',
    legalBasis: 'CPP Art. 205 Inciso 4'
  }
];

export const ScenariosModule: React.FC<ScenariosModuleProps> = ({ onSelectScenario }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Interactive Simulator State
  const [activeScenario, setActiveScenario] = useState<ScenarioInteractive | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set(['no-dni-fisico', 'identificacion-policial']));

  // Categories definition
  const categories = [
    { id: 'all', title: 'Todos los Casos', icon: Zap, bg: 'bg-slate-100 text-slate-700' },
    { id: 'Identificación', title: 'Identificación', icon: UserCheck, bg: 'bg-blue-50 text-[#0F4C81]' },
    { id: 'Celulares', title: 'Celulares', icon: Smartphone, bg: 'bg-teal-50 text-[#0F766E]' },
    { id: 'Comisaría', title: 'Comisaría', icon: Building2, bg: 'bg-indigo-50 text-indigo-800' },
    { id: 'Procedimiento policial', title: 'Procedimiento', icon: ShieldCheck, bg: 'bg-sky-50 text-sky-800' },
    { id: 'Extranjeros', title: 'Extranjeros', icon: Globe, bg: 'bg-emerald-50 text-emerald-800' },
  ];

  const filteredScenarios = selectedCategory === 'all'
    ? INTERACTIVE_SCENARIOS
    : INTERACTIVE_SCENARIOS.filter((sc) => sc.category === selectedCategory);

  const handleStartPractice = (scenario: ScenarioInteractive) => {
    setActiveScenario(scenario);
    setSelectedOptionId(null);
  };

  const handleSelectOption = (optionId: string) => {
    if (!activeScenario) return;
    setSelectedOptionId(optionId);
    if (!completedScenarios.has(activeScenario.id)) {
      setCompletedScenarios((prev) => new Set(prev).add(activeScenario.id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. HERO SECTION (Material Design 3 & Google Learning style) */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xs overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title & Subtitle */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 text-xs font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                Simulador Ciudadano Interactivo
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E293B] leading-tight">
              Practica situaciones reales
            </h1>

            <p className="text-[#1E293B]/80 text-sm md:text-base leading-relaxed">
              Aprende cómo actuar durante un control de identidad antes de que ocurra. Descubre tus derechos mediante simulaciones sencillas basadas exclusivamente en normativa oficial peruana.
            </p>

            {/* 3 Indicators with Green Checkmarks */}
            <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Escenarios interactivos
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Basado en normativa oficial
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Aprende en menos de 3 minutos
              </span>
            </div>
          </div>

          {/* Right Column: Flat Illustration */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-sm rounded-[22px] overflow-hidden bg-slate-50 border border-slate-200/80 p-3 shadow-2xs">
              <img 
                src={heroIllustration} 
                alt="Simulador Práctico de Intervenciones HablaPE"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover rounded-[18px] transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS & ACHIEVEMENTS BAR (Duolingo Style) */}
      <div className="bg-white border border-slate-200/90 rounded-[22px] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#1E293B]">
                Tu Progreso de Aprendizaje
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Has completado <span className="font-extrabold text-[#0F4C81]">{completedScenarios.size}</span> de <span className="font-bold">{INTERACTIVE_SCENARIOS.length}</span> escenarios interactivos
            </p>
          </div>

          {/* Achievements Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Has aprendido:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200/80">
              <Check className="w-3 h-3 text-[#22C55E]" /> DNI Digital
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-[#0F4C81] border border-blue-200/80">
              <Check className="w-3 h-3 text-[#22C55E]" /> Retención (máx 4h)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <Check className="w-3 h-3 text-[#22C55E]" /> Derechos en control
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div 
            className="bg-gradient-to-r from-[#0F4C81] to-[#0F766E] h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedScenarios.size / INTERACTIVE_SCENARIOS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. CATEGORÍAS (Tarjetas Grandes) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81] px-1">
          Categorías de Práctica
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-[20px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 border ${
                  isSelected 
                    ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-md ring-2 ring-[#0F4C81]/30'
                    : 'bg-white border-slate-200/90 text-slate-800 hover:border-[#0F4C81]/40 hover:shadow-xs'
                }`}
              >
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#0F4C81]'
                }`}>
                  <IconComp className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-xs font-extrabold line-clamp-1">
                    {cat.title}
                  </h3>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {INTERACTIVE_SCENARIOS.filter(s => cat.id === 'all' || s.category === cat.id).length} casos
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ESCENARIOS INTERACTIVOS (Tarjetas Modernas de Práctica) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
            Escenarios Disponibles ({filteredScenarios.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Selecciona uno para iniciar la simulación
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScenarios.map((scenario) => {
            const CategoryIcon = scenario.categoryIcon;
            const isCompleted = completedScenarios.has(scenario.id);

            return (
              <div
                key={scenario.id}
                className="bg-white border border-slate-200/90 rounded-[22px] p-6 shadow-xs hover:shadow-md hover:border-[#0F4C81]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category Badge & Level & Completed Status */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <CategoryIcon className="w-3.5 h-3.5 text-[#0F4C81]" />
                      {scenario.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                        ⏱ {scenario.estimatedTime}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          <Check className="w-3 h-3 text-[#22C55E]" /> Completado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Short Description */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1E293B]">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {scenario.shortDescription}
                    </p>
                  </div>

                  {/* Level Badge */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      scenario.level === 'Básico' 
                        ? 'bg-teal-50 text-[#0F766E] border border-teal-200/80' 
                        : scenario.level === 'Intermedio'
                        ? 'bg-blue-50 text-[#0F4C81] border border-blue-200/80'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200/80'
                    }`}>
                      Nivel: {scenario.level}
                    </span>
                  </div>
                </div>

                {/* Practicar Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleStartPractice(scenario)}
                    className="w-full py-3 px-4 rounded-[16px] bg-[#0F4C81] hover:bg-[#0D406E] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Practicar este escenario</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. SECCIÓN MITOS FRECUENTES (Carrusel / Tarjetas con Realidad y Fundamento) */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">
              Mitos Frecuentes Desmentidos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aprende a diferenciar las creencias populares de la realidad legal peruana
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FREQUENT_MYTHS.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-[22px] p-5 shadow-xs space-y-3"
            >
              {/* Mito Card Header */}
              <div className="bg-amber-50/80 border border-amber-200/70 rounded-[16px] p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ❌ Mito popular
                </span>
                <p className="text-xs font-bold text-amber-950 leading-relaxed">
                  "{item.myth}"
                </p>
              </div>

              {/* Realidad Card */}
              <div className="bg-teal-50/70 border border-teal-200/70 rounded-[16px] p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ✔ Realidad Legal
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {item.reality}
                </p>
              </div>

              {/* Fundamento Oficial */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="font-bold text-[#0F4C81]">
                  📘 Fundamento: {item.legalBasis}
                </span>
                <button
                  onClick={() => {
                    onSelectScenario({
                      id: item.id,
                      iconName: 'ShieldCheck',
                      title: item.myth,
                      summary: item.reality,
                      keyTakeaways: [item.legalBasis],
                      commonMisconceptions: [item.myth],
                      fullLegalAnalysis: item.reality
                    });
                  }}
                  className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Consultar en HablaPE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MODAL / VISTA DE SIMULACIÓN INTERACTIVA (Estilo Duolingo & Google Learning) */}
      {activeScenario && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Simulation Header */}
            <div className="bg-[#0F4C81] text-white p-5 sm:p-6 space-y-2 relative">
              <button
                onClick={() => setActiveScenario(null)}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                aria-label="Cerrar simulación"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  Simulador interactivo
                </span>
                <span className="bg-teal-500/20 text-teal-200 font-bold text-xs px-2.5 py-0.5 rounded-full border border-teal-400/30">
                  {activeScenario.category}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white pr-8 leading-snug">
                {activeScenario.title}
              </h2>
            </div>

            {/* Simulation Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Context Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-[18px] p-4 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  📍 Situación inicial:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {activeScenario.situationContext}
                </p>
              </div>

              {/* Question */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E293B] leading-snug">
                  ❓ {activeScenario.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5">
                  {activeScenario.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={selectedOptionId !== null}
                        className={`w-full text-left p-4 rounded-[18px] border text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? opt.isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-semibold shadow-xs'
                              : 'bg-amber-50/90 border-amber-400 text-amber-950 font-semibold shadow-xs'
                            : selectedOptionId !== null
                            ? 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-75'
                            : 'bg-white border-slate-200/90 text-slate-700 hover:border-[#0F4C81]/50 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Immediate Feedback Card (Gemma / HablaPE Explanation) */}
              {selectedOptionId && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 pt-2">
                  {(() => {
                    const selectedOpt = activeScenario.options.find(o => o.id === selectedOptionId);
                    if (!selectedOpt) return null;
                    const fb = selectedOpt.feedback;

                    return (
                      <div className={`rounded-[20px] p-5 border space-y-4 shadow-2xs ${
                        selectedOpt.isCorrect
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}>
                        {/* Feedback Banner */}
                        <div className="flex items-center gap-2">
                          {selectedOpt.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          )}
                          <h4 className="font-extrabold text-sm sm:text-base">
                            {selectedOpt.isCorrect ? '✔ Lo hiciste bien' : '⚠️ Lo que debes recordar'}
                          </h4>
                        </div>

                        {/* What did well & What to improve */}
                        <div className="space-y-2 text-xs leading-relaxed">
                          <p className="font-medium">
                            <strong className="font-bold">Análisis:</strong> {fb.whatDidWell}
                          </p>
                          {fb.whatToImprove && (
                            <p className="font-medium text-slate-700">
                              <strong className="font-bold text-slate-900">Recomendación:</strong> {fb.whatToImprove}
                            </p>
                          )}
                        </div>

                        {/* Norma utilizada */}
                        <div className="bg-white/90 p-3 rounded-[14px] border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F4C81] block">
                            📘 Norma oficial utilizada:
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {fb.legalNorm}
                          </span>
                        </div>

                        {/* Frase sugerida */}
                        <div className="bg-teal-50/90 p-3.5 rounded-[14px] border border-teal-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E] flex items-center gap-1">
                            💬 Frase sugerida respetuosa para decir en voz alta:
                          </span>
                          <p className="text-xs font-extrabold text-[#0F766E] italic leading-relaxed">
                            "{fb.suggestedPhrase}"
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Simulation Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedOptionId(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Intentar de nuevo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (activeScenario) {
                      onSelectScenario({
                        id: activeScenario.id,
                        iconName: 'ShieldCheck',
                        title: activeScenario.title,
                        summary: activeScenario.shortDescription,
                        keyTakeaways: [activeScenario.options.find(o => o.isCorrect)?.feedback.legalNorm || ''],
                        commonMisconceptions: [],
                        fullLegalAnalysis: activeScenario.situationContext
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white font-extrabold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consultar con HablaPE</span>
                </button>

                <button
                  onClick={() => setActiveScenario(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
