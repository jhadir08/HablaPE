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
  FileText
} from 'lucide-react';
import { InputMode, QueryResponse, SavedItem } from '../types';

interface QueryModuleProps {
  onSaveItem: (item: SavedItem) => void;
  onOpenAudit: () => void;
}

export const QueryModule: React.FC<QueryModuleProps> = ({ onSaveItem, onOpenAudit }) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // API Call state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Analizando la consulta...');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playingPhraseIndex, setPlayingPhraseIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickPrompts = [
    'Me pararon en la calle y no llevo mi DNI físico',
    'El policía me exige desbloquear el celular para ver mi WhatsApp',
    'Me están llevando a la comisaría por control de identidad. ¿Cuánto tiempo pueden retenerme?',
    '¿Qué debo decir si el oficial no me da su nombre ni el motivo de la intervención?',
    'Soy ciudadano extranjero con Carnet CPP y me hicieron un control de identidad'
  ];

  // Start recording voice input
  const startRecording = async () => {
    try {
      setErrorMessage(null);
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

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAudioBase64(base64String);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMessage('No se pudo acceder al micrófono. Por favor permite los permisos en tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    if (!textQuery.trim() && !audioBase64 && !filePreview) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setQueryResult(null);
    setIsSaved(false);

    // Simulate pipeline steps visual
    const steps = [
      'Clasificando escenario de intervención...',
      'Extrayendo hechos e identificando información faltante...',
      'Consultando RAG en Corpus Oficial (D.S. N° 012-2025-IN y CPP Art. 205)...',
      'Validando motor determinístico de vigencia legal...',
      'Sintetizando explicación y frases recomendadas...'
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
          audioBase64: audioBase64,
          imageBase64: filePreview,
          fileName: selectedFile?.name
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error('Error al procesar la consulta con el servidor');
      }

      const data: QueryResponse = await response.json();
      setQueryResult(data);
    } catch (err: any) {
      console.error('Query error:', err);
      clearInterval(stepInterval);
      setErrorMessage('Ocurrió un error al procesar tu consulta. Intenta nuevamente.');
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
        utterance.lang = 'es-PE';
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Control de Identidad Policial
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Gemma 4 RAG
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Navegador de Derechos y Procedimientos
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Describe lo sucedido por texto, voz o subiendo la foto de un acta o documento. Analizaremos tu caso bajo el <strong className="text-white font-semibold">D.S. N° 012-2025-IN</strong> y el <strong className="text-white font-semibold">Código Procesal Penal (Art. 205)</strong>.
            </p>
          </div>
          
          <button
            onClick={onOpenAudit}
            className="self-start md:self-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-200 font-medium flex items-center gap-2 transition-all hover:border-slate-500 shadow-xs shrink-0"
          >
            <span>Ver Auditoría de Pipeline</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Input Area Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'text'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Texto</span>
          </button>
          
          <button
            onClick={() => setInputMode('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'audio'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            <span>Voz / Micrófono</span>
          </button>

          <button
            onClick={() => setInputMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'image'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Foto de Documento / Acta</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Quick Prompts Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Casos frecuentes de consulta rápida:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt);
                    setInputMode('text');
                  }}
                  className="text-xs bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200/90 text-slate-700 px-3 py-1.5 rounded-lg transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Text Mode */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ejemplo: Me detuvieron en la avenida Abancay. No tengo mi DNI físico y el policía insiste en llevarme a la comisaría sin permitirme dar mi número de DNI..."
                className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-slate-800 placeholder-slate-400 resize-none outline-none transition-all"
              />
            </div>
          )}

          {/* Audio Mode */}
          {inputMode === 'audio' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-4">
              <p className="text-xs text-slate-600">
                Graba tu relato de voz explicando la situación que viviste o estás presenciando.
              </p>

              <div className="flex flex-col items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg animate-pulse"
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </button>
                )}

                <div className="text-xs font-semibold text-slate-700">
                  {isRecording ? (
                    <span className="text-red-600 font-mono">
                      ● Grabando audio: {recordingSeconds}s
                    </span>
                  ) : audioBase64 ? (
                    <span className="text-emerald-600">
                      ✓ Grabación lista ({Math.round((audioBlob?.size || 0) / 1024)} KB)
                    </span>
                  ) : (
                    'Haz clic en el micrófono para comenzar a grabar'
                  )}
                </div>
              </div>

              {/* Optional text with audio */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Añadir comentario o aclaración adicional (Opcional)..."
                className="w-full p-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Image Mode */}
          {inputMode === 'image' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-all bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Sube una foto de tu DNI, Acta de Intervención o Documento Oficial
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Soporta formatos JPG, PNG (Capturas o foto de cámara)
                  </p>
                </label>
              </div>

              {filePreview && (
                <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-800 truncate">{selectedFile?.name || 'Imagen seleccionada'}</p>
                    <p className="text-slate-500">Imagen lista para análisis multimodal con Gemma 4</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Quitar
                  </button>
                </div>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="¿Qué consulta tienes sobre este documento o acta? (Opcional)..."
                className="w-full p-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Normativa oficial del Perú en tiempo real</span>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || (!inputText.trim() && !audioBase64 && !filePreview)}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Consultar Derechos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Pipeline State */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-center space-y-4 shadow-lg animate-pulse">
          <div className="w-12 h-12 bg-red-600/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Procesando con Gemma 4 RAG Engine</h3>
            <p className="text-xs text-slate-300 mt-1">{loadingStep}</p>
          </div>

          <div className="max-w-md mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full w-3/4 animate-pulse rounded-full" />
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
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : queryResult.scenario.riskLevel === 'medio'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  Riesgo: {queryResult.scenario.riskLevel.toUpperCase()}
                </span>
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
              Hechos Identificados en la Intervención
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
                        ? 'bg-red-100 text-red-800'
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
              <p className="text-xs text-slate-600 leading-relaxed">
                {queryResult.explanation.overview}
              </p>
            </div>

            {/* Rights & Duties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Citizen Rights */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Tus Derechos Fundamentales
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {queryResult.explanation.citizenRights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What Police CANNOT Do (Crucial protection) */}
              <div className="p-4 bg-red-50/60 border border-red-200/80 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Lo que la Policía NO Puede Hacer
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {queryResult.explanation.whatPoliceCannotDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                💡 Recomendaciones de Acción Inmediata:
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
          </div>

          {/* Suggested Phrases with Audio */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  🗣️ Frases Sugeridas con Respeto
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
                        <span>{copiedIndex === idx ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() => handleSpeakPhrase(phraseObj.phrase, idx)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingPhraseIndex === idx ? 'animate-bounce text-yellow-300' : ''}`} />
                        <span>{playingPhraseIndex === idx ? 'Reproduciendo...' : 'Escuchar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal References (RAG Sources) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sustento en Normativa Oficial Peruana (RAG Context)
            </h3>

            <div className="space-y-2">
              {queryResult.legalReferences.map((ref, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{ref.code || ref.document}</span>
                      <span className="bg-slate-200 text-slate-700 font-semibold text-[10px] px-1.5 py-0.5 rounded">
                        {ref.article}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                        {ref.version || 'Vigente'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{ref.summary}</p>
                  </div>

                  {ref.officialUrl && (
                    <a
                      href={ref.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs flex items-center gap-1 shrink-0 self-start md:self-center"
                    >
                      <span>Texto Oficial</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Derivation Channels & Hotlines */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-amber-700" />
              Canales Oficiales de Derivación y Reclamo Inmediato
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {queryResult.derivationChannels.map((channel, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{channel.entity}</div>
                    <div className="text-slate-600 text-[11px]">{channel.purpose}</div>
                  </div>
                  <a
                    href={`tel:${channel.phone.replace(/\D/g, '')}`}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{channel.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{queryResult.limitations}</p>
          </div>
        </div>
      )}
    </div>
  );
};
