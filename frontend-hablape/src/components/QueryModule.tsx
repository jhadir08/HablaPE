import React, { useState, useRef } from 'react';
import { 
  Send, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  Upload, 
  Volume2, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  PhoneCall, 
  Info, 
  RotateCcw, 
  Bookmark, 
  HelpCircle,
  Sparkles,
  ChevronRight,
  FileText,
  ArrowRight,
  Shield,
  Camera,
  MessageSquareText,
  CreditCard,
  Smartphone,
  Clock,
  Globe
} from 'lucide-react';
import { InputMode, Language, QueryResponse, SavedItem } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { FREQUENT_SCENARIOS } from '../data/legalCorpus';
import heroIllustration from '../assets/images/hablape_hero_flat_illustration_1785604720032.jpg';

interface QueryModuleProps {
  onSaveItem: (item: SavedItem) => void;
  onOpenAudit: () => void;
  language?: Language;
}

export const QueryModule: React.FC<QueryModuleProps> = ({
  onSaveItem,
  onOpenAudit,
  language = 'es'
}) => {
  const t = I18N_STRINGS[language];
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Ref for smooth scrolling to query form
  const inputAreaRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // API Call state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>(t.analyzing);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playingPhraseIndex, setPlayingPhraseIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  const quickPrompts = [
    'Me pararon en la calle y no llevo mi DNI físico',
    'El policía me exige desbloquear el celular para ver mi WhatsApp',
    'Me están llevando a la comisaría por control de identidad. ¿Cuánto tiempo pueden retenerme?',
    '¿Qué debo decir si el oficial no me da su nombre ni el motivo de la intervención?',
    'Soy ciudadano extranjero con Carnet CPP y me hicieron un control de identidad'
  ];

  const transcribeAudio = async (blob: Blob, durationSeconds: number) => {
    setIsTranscribing(true);
    setErrorMessage(null);
    setAudioTranscript('');
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'audio/webm',
          'X-Consent-To-Process': 'true',
          'X-Audio-Duration-Seconds': String(durationSeconds),
        },
        body: blob,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error?.message || 'No se pudo transcribir la grabación.'
        );
      }
      const transcript = String(payload?.transcript || '').trim();
      if (!transcript) {
        throw new Error('No se detectó una voz comprensible en la grabación.');
      }
      setAudioTranscript(transcript);
      setInputText(transcript);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo transcribir la grabación.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start recording voice input
  const startRecording = async () => {
    if (!hasConsent) {
      setErrorMessage(
        'Acepta el procesamiento temporal antes de grabar el audio.'
      );
      return;
    }
    try {
      setErrorMessage(null);
      setAudioBlob(null);
      setAudioTranscript('');
      setInputText('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        void transcribeAudio(
          audioBlob,
          Math.max(recordingSecondsRef.current, 1)
        );
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            recordingSecondsRef.current = 30;
            setTimeout(() => stopRecording(), 0);
            return 30;
          }
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMessage('No se pudo acceder al micrófono. Por favor permite los permisos en tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMessage('La imagen debe ser JPG, PNG o WebP.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('La imagen no puede superar 5 MB.');
        e.target.value = '';
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const textQuery = textToSubmit || inputText;
    if (!textQuery.trim() && !filePreview) {
      return;
    }
    if (!hasConsent) {
      setErrorMessage('Debes aceptar el procesamiento temporal de tu relato antes de continuar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setQueryResult(null);
    setIsSaved(false);
    setLoadingStep(t.analyzing);

    // The actual route is selected by the backend agent.
    const steps = [
      'Gemma está comprendiendo la consulta...',
      'El agente está decidiendo entre respuesta directa y RAG...',
      'Consultando Vector Search solo si se necesita evidencia oficial...',
      'Validando que las fuentes provengan de chunks recuperados...',
      'Preparando la respuesta final...'
    ];

    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 900);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textQuery,
          mode: inputMode,
          imageBase64: filePreview,
          fileName: selectedFile?.name,
          consentToProcess: hasConsent,
          language
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error?.message || 'Error al procesar la consulta con el servidor'
        );
      }

      const data: QueryResponse = await response.json();
      setQueryResult(data);
    } catch (err: any) {
      console.error('Query error:', err);
      clearInterval(stepInterval);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar tu consulta. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPhrase = (phrase: string, index: number) => {
    navigator.clipboard.writeText(phrase);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeakPhrase = async (phrase: string, index: number) => {
    try {
      setPlayingPhraseIndex(index);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = {
          es: 'es-PE',
          en: 'en-US',
          qu: 'qu-PE',
          ay: 'ay-PE'
        }[language];
        utterance.rate = 0.95;
        utterance.onend = () => setPlayingPhraseIndex(null);
        utterance.onerror = () => setPlayingPhraseIndex(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setPlayingPhraseIndex(null), 3000);
      }
    } catch (err) {
      setPlayingPhraseIndex(null);
    }
  };

  const handleSaveToHistory = () => {
    if (!queryResult) return;
    onSaveItem({
      id: queryResult.id,
      type: 'query',
      title: queryResult.queryInput.text || 'Consulta de Intervención Policial',
      timestamp: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      data: queryResult
    });
    setIsSaved(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section: Minimalist, 35% Visual Area, Flat Illustration, Petroleum Blue & Teal Accents */}
      <div id="hero-banner" className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xs overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title & Subtitle */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 text-xs font-bold px-3 py-1 rounded-full">
                <Shield className="w-3.5 h-3.5 text-[#0F4C81]" />
                Asistente Ciudadano PE
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 text-xs font-semibold px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                Normativa Oficial Peruana
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E293B] leading-tight">
              ¿Cómo podemos ayudarte hoy?
            </h1>

            <p className="text-[#1E293B]/80 text-sm md:text-base leading-relaxed">
              Describe lo sucedido y recibirás orientación basada únicamente en normativa oficial peruana.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-6 py-3.5 rounded-[20px] bg-[#0F766E] hover:bg-[#0D655E] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-teal-900/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Comenzar consulta</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAudit}
                className="px-5 py-3.5 rounded-[20px] bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>¿Cómo funciona?</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Flat Illustration (~35% of space) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-sm rounded-[22px] overflow-hidden bg-slate-50 border border-slate-200/80 p-3 shadow-2xs">
              <img 
                src={heroIllustration} 
                alt="HablaPE Asistente Ciudadano Perú"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover rounded-[18px] transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métodos de Consulta: 3 Horizontal Cards (Hablar, Escribir, Fotografía) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F4C81] px-1">
          Métodos de Consulta
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Hablar por voz */}
          <div
            onClick={() => {
              setInputMode('audio');
              inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`group relative text-left p-6 rounded-[22px] border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
              inputMode === 'audio'
                ? 'bg-white border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F766E]/50 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-[18px] bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 flex items-center justify-center group-hover:bg-[#0F766E] group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Mic className="w-6 h-6" />
                </div>
                {inputMode === 'audio' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0F766E] text-white uppercase tracking-wider shadow-2xs">
                    Activo
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-[#1E293B] text-base group-hover:text-[#0F766E] transition-colors">
                  {t.modeVoice}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Explica tu situación hablando naturalmente.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[14px] bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Grabar audio</span>
              </button>
            </div>
          </div>

          {/* Card 2: Escribir consulta */}
          <div
            onClick={() => {
              setInputMode('text');
              inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`group relative text-left p-6 rounded-[22px] border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
              inputMode === 'text'
                ? 'bg-white border-[#0F4C81] shadow-md ring-2 ring-[#0F4C81]/20'
                : 'bg-white border-slate-200/90 hover:border-[#0F4C81]/50 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-[18px] bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 flex items-center justify-center group-hover:bg-[#0F4C81] group-hover:text-white transition-all duration-300 shadow-2xs">
                  <MessageSquareText className="w-6 h-6" />
                </div>
                {inputMode === 'text' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0F4C81] text-white uppercase tracking-wider shadow-2xs">
                    Activo
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-[#1E293B] text-base group-hover:text-[#0F4C81] transition-colors">
                  {t.modeText}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Describe lo ocurrido paso a paso.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[14px] bg-[#0F4C81] hover:bg-[#0D406E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Escribir mensaje</span>
              </button>
            </div>
          </div>

          {/* Card 3: Tomar una fotografía */}
          <div
            onClick={() => {
              setInputMode('image');
              inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`group relative text-left p-6 rounded-[22px] border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
              inputMode === 'image'
                ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/90 hover:border-blue-400/50 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-[18px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Camera className="w-6 h-6" />
                </div>
                {inputMode === 'image' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider shadow-2xs">
                    Activo
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-[#1E293B] text-base group-hover:text-blue-600 transition-colors">
                  {t.modeImage}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Analiza un acta, documento o DNI.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Subir imagen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Form Container */}
      <div ref={inputAreaRef} className="bg-white border border-slate-200/90 rounded-[20px] shadow-xs overflow-hidden">
        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Text Mode */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.inputPlaceholder}
                rows={4}
                className="w-full p-4 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-3 focus:ring-sky-500/15 transition-all resize-none"
              />
            </div>
          )}

          {/* Audio Mode */}
          {inputMode === 'audio' && (
            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-[18px] text-center space-y-4">
              <p className="text-xs text-slate-600 font-medium max-w-lg mx-auto">
                Graba hasta 30 segundos. Speech-to-Text generará una transcripción que podrás revisar antes de consultar.
              </p>

              <div className="flex flex-col items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg animate-pulse cursor-pointer border-2 border-sky-400"
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </button>
                )}

                <div className="text-xs font-semibold text-slate-700">
                  {isRecording ? (
                    <span className="text-sky-600 font-mono">
                      ● Grabando audio: {recordingSeconds}s
                    </span>
                  ) : isTranscribing ? (
                    <span className="text-sky-600">
                      Transcribiendo la grabación con Speech-to-Text...
                    </span>
                  ) : audioTranscript ? (
                    <span className="text-emerald-600">
                      ✓ Transcripción lista ({Math.round((audioBlob?.size || 0) / 1024)} KB)
                    </span>
                  ) : (
                    'Toca el micrófono para comenzar a grabar'
                  )}
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">
                  Transcripción automática — revísala y corrígela si es necesario
                </label>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setAudioTranscript(e.target.value);
                }}
                placeholder="La transcripción aparecerá aquí después de grabar..."
                rows={3}
                disabled={isTranscribing}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:border-sky-500 disabled:bg-slate-100 resize-y"
              />
              </div>
            </div>
          )}

          {/* Image Mode */}
          {inputMode === 'image' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-[18px] p-6 text-center hover:border-sky-400 transition-all bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-sky-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Sube una foto de tu DNI, Acta de Intervención o Documento Oficial
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Soporta JPG, PNG o WebP, hasta 5 MB
                  </p>
                </label>
              </div>

              {filePreview && (
                <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-800 truncate">{selectedFile?.name || 'Imagen seleccionada'}</p>
                    <p className="text-slate-500">Documento listo para análisis oficial</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="¿Qué duda específica tienes sobre esta acta o documento? (Opcional)..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
              />
            </div>
          )}

          <label className="flex items-start gap-3 p-3 bg-sky-50/70 border border-sky-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(event) => setHasConsent(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              Acepto que HablaPE procese temporalmente mi relato para generar esta orientación.
              El backend no persiste el texto completo y registra solamente metadatos técnicos.
            </span>
          </label>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Análisis sustentado en normativa del Estado Peruano</span>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || isTranscribing || !hasConsent || (!inputText.trim() && !filePreview)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>{t.submitQuery}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-950 border border-slate-800 rounded-[20px] p-6 text-white text-center space-y-4 shadow-lg animate-pulse">
          <div className="w-12 h-12 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Procesando con el agente HablaPE</h3>
            <p className="text-xs text-slate-300 mt-1">{loadingStep}</p>
          </div>
          <div className="max-w-md mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full w-3/4 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* Query Result Section */}
      {queryResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Scenario Overview Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  Escenario Detectado
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  queryResult.scenario.riskLevel === 'alto' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : queryResult.scenario.riskLevel === 'medio'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  Riesgo: {queryResult.scenario.riskLevel.toUpperCase()}
                </span>
                {queryResult.backendMeta?.answerMode && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                    {queryResult.backendMeta.answerMode === 'rag_gemma'
                      ? 'RAG + Gemma'
                      : queryResult.backendMeta.answerMode === 'direct_gemma'
                      ? 'Gemma directo'
                      : queryResult.backendMeta.answerMode === 'blocked'
                      ? 'Sin respuesta validada'
                      : 'Motor determinístico'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {queryResult.scenario.category}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToHistory}
                disabled={isSaved}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSaved ? 'Guardado en Historial' : 'Guardar Caso'}</span>
              </button>

              <button
                onClick={() => setQueryResult(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nueva Consulta</span>
              </button>
            </div>
          </div>

          {/* Identified Facts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              Contexto interpretado
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {queryResult.facts.map((fact, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{fact.category}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      fact.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : fact.status === 'missing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {fact.status === 'present' ? 'Confirmado' : fact.status === 'missing' ? 'Faltante' : 'Deducido'}
                    </span>
                  </div>
                  <p className="text-slate-600">{fact.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Explanation: Rights vs Cannot Do */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                Explicación en Lenguaje Claro
              </h3>
              <p className="text-sm md:text-[15px] text-slate-700 leading-7 whitespace-pre-line">
                {queryResult.explanation.overview}
              </p>
            </div>

            {/* Gemma paraphrases the retrieved evidence; exact sources stay below. */}
            {queryResult.explanation.evidenceSummary.length > 0 && (
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950">
                      {t.evidenceSummaryTitle}
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/80">
                      {t.evidenceSummaryNotice}
                    </p>
                  </div>
                </div>
                <div className={`grid grid-cols-1 gap-3 ${
                  queryResult.explanation.evidenceSummary.length >= 3
                    ? 'md:grid-cols-3'
                    : queryResult.explanation.evidenceSummary.length === 2
                    ? 'md:grid-cols-2'
                    : ''
                }`}>
                  {queryResult.explanation.evidenceSummary.map((item, idx) => (
                    <div key={idx} className="bg-white/80 border border-emerald-100 rounded-lg p-3 flex items-start gap-2.5 shadow-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(queryResult.explanation.whatPoliceCanDo.length > 0 ||
              queryResult.explanation.whatPoliceCannotDo.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queryResult.explanation.whatPoliceCanDo.length > 0 && (
                <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-600" />
                    {t.policeCanDoTitle}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {queryResult.explanation.whatPoliceCanDo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {queryResult.explanation.whatPoliceCannotDo.length > 0 && (
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    {t.policeCannotDoTitle}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {queryResult.explanation.whatPoliceCannotDo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            )}

            {/* Action Plan */}
            {queryResult.explanation.whatToDo.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                💡 {t.whatToDoTitle}:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                {queryResult.explanation.whatToDo.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            )}

            {queryResult.followUpQuestion && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4 text-sky-600" />
                    {t.continueTitle}
                  </h4>
                  <p className="mt-1.5 text-sm text-slate-700">{queryResult.followUpQuestion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInputText(queryResult.followUpQuestion || '');
                    setQueryResult(null);
                    requestAnimationFrame(() => {
                      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }}
                  className="shrink-0 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors"
                >
                  {t.continueButton}
                </button>
              </div>
            )}
          </div>

          {/* Sources stay separate from the generated explanation. */}
          {queryResult.legalReferences.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  {t.officialSources}
                </h3>
                {language !== 'es' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.officialSourceNotice}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Estas referencias provienen del corpus aprobado; no fueron elegidas por el modelo generativo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {queryResult.legalReferences.map((reference, index) => (
                  <article key={`${reference.document}-${reference.article}-${index}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <p className="text-xs font-bold text-slate-900">{reference.document}</p>
                    <p className="text-[11px] font-semibold text-sky-700">{reference.article}</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{reference.summary}</p>
                    {reference.officialUrl && (
                      <a
                        href={reference.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900"
                      >
                        Abrir fuente oficial
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-amber-900">{queryResult.limitations}</p>
          </div>

          {/* Suggested Phrases with Audio */}
          {queryResult.suggestedPhrases.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  🗣️ {t.phraseSuggested}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frases con sustento legal para comunicarte de forma asertiva durante la intervención.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {queryResult.suggestedPhrases.map((phraseObj, idx) => (
                <div key={idx} className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-sm font-semibold text-slate-100 italic leading-relaxed">
                    "{phraseObj.phrase}"
                  </p>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      <strong className="text-slate-300">Uso:</strong> {phraseObj.context}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPhrase(phraseObj.phrase, idx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-all"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedIndex === idx ? '✓' : t.copyPhrase}</span>
                      </button>

                      <button
                        onClick={() => handleSpeakPhrase(phraseObj.phrase, idx)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingPhraseIndex === idx ? 'animate-bounce text-yellow-300' : ''}`} />
                        <span>{playingPhraseIndex === idx ? '…' : t.listenPhrase}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}

      {/* Casos Frecuentes (Horizontal / Grid of Cards) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Casos frecuentes de intervención policial
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona una situación común para consultar tus derechos rápidamente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FREQUENT_SCENARIOS.map((sc) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case 'CreditCard': return CreditCard;
                case 'Smartphone': return Smartphone;
                case 'Clock': return Clock;
                case 'Globe': return Globe;
                default: return ShieldCheck;
              }
            };
            const ScenarioIcon = getIcon(sc.iconName);
            return (
              <div
                key={sc.id}
                onClick={() => {
                  setInputText(sc.userPrompt);
                  setInputMode('text');
                  inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="bg-white border border-slate-200/90 rounded-[20px] p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-[14px] bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <ScenarioIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs group-hover:text-sky-700 transition-colors">
                      {sc.title}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                      {sc.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[11px] font-bold text-sky-600 group-hover:text-sky-700 gap-1 pt-1">
                  <span>Consultar este caso</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
