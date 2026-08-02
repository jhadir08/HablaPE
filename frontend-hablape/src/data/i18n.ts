import type { Language } from '../types';

export type UIStrings = {
  navQuery: string;
  navQuerySub: string;
  navCorpus: string;
  navCorpusSub: string;
  navScenarios: string;
  navScenariosSub: string;
  navHistory: string;
  navHistorySub: string;
  navProfile: string;
  navProfileSub: string;
  navAudit: string;
  navAuditSub: string;
  appSubtitle: string;
  officialTag: string;
  regulationsBadge: string;
  profileHeadline: string;
  profileSubhead: string;
  preferenceSection: string;
  languageTitle: string;
  languageDescription: string;
  modeText: string;
  modeVoice: string;
  modeImage: string;
  inputPlaceholder: string;
  submitQuery: string;
  analyzing: string;
  rightsTitle: string;
  dutiesTitle: string;
  evidenceSummaryTitle: string;
  evidenceSummaryNotice: string;
  policeCanDoTitle: string;
  policeCannotDoTitle: string;
  whatToDoTitle: string;
  continueTitle: string;
  continueButton: string;
  officialSources: string;
  officialSourceNotice: string;
  phraseSuggested: string;
  copyPhrase: string;
  listenPhrase: string;
};

export const I18N_STRINGS: Record<Language, UIStrings> = {
  es: {
    navQuery: 'Inicio',
    navQuerySub: 'Consulta ciudadana',
    navCorpus: 'Normativa',
    navCorpusSub: 'Fuentes oficiales',
    navScenarios: 'Practicar',
    navScenariosSub: 'Simulador de derechos',
    navHistory: 'Mi Biblioteca',
    navHistorySub: 'Consultas y guardados',
    navProfile: 'Perfil',
    navProfileSub: 'Preferencias de HablaPE',
    navAudit: 'Auditoría Pipeline',
    navAuditSub: 'Trazabilidad y reglas',
    appSubtitle: 'Asistente de Intervención Policial',
    officialTag: 'Información oficial actualizada',
    regulationsBadge: 'Normativa Peruana',
    profileHeadline: 'Mi Perfil Ciudadano',
    profileSubhead: 'Personaliza tu experiencia dentro de HablaPE y administra tus preferencias de idioma, accesibilidad y privacidad.',
    preferenceSection: 'PREFERENCIAS DE APLICACIÓN',
    languageTitle: 'Idioma de interfaz y respuesta',
    languageDescription: 'El agente comprende la consulta y responde en el idioma elegido.',
    modeText: 'Escribir consulta',
    modeVoice: 'Hablar por voz',
    modeImage: 'Tomar una fotografía',
    inputPlaceholder: 'Describe qué está ocurriendo durante la intervención policial...',
    submitQuery: 'Consultar',
    analyzing: 'Analizando consulta...',
    rightsTitle: 'Evidencia oficial relevante',
    dutiesTitle: 'Tus deberes ciudadanos',
    evidenceSummaryTitle: 'Las fuentes, en palabras simples',
    evidenceSummaryNotice: 'Resumen redactado por Gemma a partir de los documentos recuperados. Las fuentes oficiales exactas aparecen más abajo.',
    policeCanDoTitle: 'Qué puede hacer la Policía',
    policeCannotDoTitle: 'Qué no puede hacer la Policía',
    whatToDoTitle: 'Recomendaciones de acción inmediata',
    continueTitle: 'Puedes continuar la conversación',
    continueButton: 'Continuar',
    officialSources: 'Fuentes utilizadas por el backend',
    officialSourceNotice: 'El texto de la fuente se conserva en español para no alterar su contenido oficial.',
    phraseSuggested: 'Frases sugeridas para comunicarte',
    copyPhrase: 'Copiar',
    listenPhrase: 'Escuchar',
  },
  en: {
    navQuery: 'Home',
    navQuerySub: 'Citizen query',
    navCorpus: 'Regulations',
    navCorpusSub: 'Official sources',
    navScenarios: 'Practice',
    navScenariosSub: 'Rights simulator',
    navHistory: 'My Library',
    navHistorySub: 'Queries and saved items',
    navProfile: 'Profile',
    navProfileSub: 'HablaPE preferences',
    navAudit: 'Pipeline Audit',
    navAuditSub: 'Traceability and rules',
    appSubtitle: 'Police Intervention Assistant',
    officialTag: 'Updated official information',
    regulationsBadge: 'Peruvian Regulations',
    profileHeadline: 'My Citizen Profile',
    profileSubhead: 'Customize your HablaPE experience and manage language, accessibility, and privacy preferences.',
    preferenceSection: 'APPLICATION PREFERENCES',
    languageTitle: 'Interface and response language',
    languageDescription: 'The agent understands the query and replies in the selected language.',
    modeText: 'Write a query',
    modeVoice: 'Speak by voice',
    modeImage: 'Take a photo',
    inputPlaceholder: 'Describe what is happening during the police intervention...',
    submitQuery: 'Ask',
    analyzing: 'Analyzing query...',
    rightsTitle: 'Relevant official evidence',
    dutiesTitle: 'Your citizen duties',
    evidenceSummaryTitle: 'The sources, in plain language',
    evidenceSummaryNotice: 'Summary drafted by Gemma from the retrieved documents. The exact official sources appear below.',
    policeCanDoTitle: 'What the police may do',
    policeCannotDoTitle: 'What the police may not do',
    whatToDoTitle: 'Recommended immediate actions',
    continueTitle: 'You can continue the conversation',
    continueButton: 'Continue',
    officialSources: 'Sources used by the backend',
    officialSourceNotice: 'Official source text remains in Spanish so its content is not altered.',
    phraseSuggested: 'Suggested communication phrases',
    copyPhrase: 'Copy',
    listenPhrase: 'Listen',
  },
  qu: {
    navQuery: 'Qallariy',
    navQuerySub: 'Runa tapukuynin',
    navCorpus: 'Kamachikuykuna',
    navCorpusSub: 'Oficial pukyukuna',
    navScenarios: 'Yachapakuy',
    navScenariosSub: 'Derechokuna yachachiy',
    navHistory: 'Ñawinchana wasiy',
    navHistorySub: 'Tapukuykuna waqaychasqa',
    navProfile: 'Perfil',
    navProfileSub: 'HablaPE allinchanakuna',
    navAudit: 'Pipeline auditay',
    navAuditSub: 'Trazabilidad wan reglakuna',
    appSubtitle: 'Policía intervención yanapaq',
    officialTag: 'Musuqchasqa oficial willakuy',
    regulationsBadge: 'Perú kamachikuykuna',
    profileHeadline: 'Kikiypa runa perfilniy',
    profileSubhead: 'HablaPE-pi simiykita, qawarinaykita wan pakay kawsaynikita allichay.',
    preferenceSection: 'APLIKASYON ALLICHANAKUNA',
    languageTitle: 'Interfazpa kutichikuypa simin',
    languageDescription: 'Agenteqa tapukuynikita hamutan, akllasqa simipitaq kutichin.',
    modeText: 'Qillqay',
    modeVoice: 'Rimay',
    modeImage: 'Ruptuta hurquy',
    inputPlaceholder: 'Willarimuy imami policía hawaykushasunki...',
    submitQuery: 'Tapuy',
    analyzing: 'Tapukuyta qawachkan...',
    rightsTitle: 'Oficial kamachikuykuna',
    dutiesTitle: 'Runap ruwayninkuna',
    evidenceSummaryTitle: 'Pukyukuna, mana sasachakuspalla',
    evidenceSummaryNotice: "Gemmaqa tarisqa qillqakunamanta pisillapi sut'inchan. Oficial pukyukunaqa uraypim kachkan.",
    policeCanDoTitle: 'Policíapa ruwanan atisqan',
    policeCannotDoTitle: 'Policíapa mana ruwanan atisqan',
    whatToDoTitle: 'Imatataq ruwawaq',
    continueTitle: 'Rimayta qatichiyta atiwaq',
    continueButton: 'Qatichiy',
    officialSources: 'Backend nisqapa llamkachisqan pukyukuna',
    officialSourceNotice: 'Oficial qillqasqaqa kastilla simipi waqaychasqa, mana hukman tikranapaq.',
    phraseSuggested: 'Sumaq rimaykuna',
    copyPhrase: 'Rimayta copiay',
    listenPhrase: 'Uyariy',
  },
  ay: {
    navQuery: 'Qalltawi',
    navQuerySub: 'Jaqina jiskt’awipa',
    navCorpus: 'Kamanaka',
    navCorpusSub: 'Oficial phuqhawinaka',
    navScenarios: 'Yatiqaña',
    navScenariosSub: 'Derechonaka yatiqaña',
    navHistory: 'P’ankawasi',
    navHistorySub: 'Jiskt’awinaka imatanaka',
    navProfile: 'Perfil',
    navProfileSub: 'HablaPE askichawinaka',
    navAudit: 'Pipeline auditariga',
    navAuditSub: 'Trazabilidad uka reglanaka',
    appSubtitle: 'Policía intervención yanapiri',
    officialTag: 'Machaq oficial yatiyawi',
    regulationsBadge: 'Perú kamanaka',
    profileHeadline: 'Jaqi perfilaja',
    profileSubhead: 'HablaPE aruma, uñjawi aruma uka privacidad askicham.',
    preferenceSection: 'APLIKASYON ASKIÑA',
    languageTitle: 'Interfaz ukat jaysäwina aru',
    languageDescription: 'Agente ukaxa jiskt’awima amuyt’i ukat ajllita arumpi jaysi.',
    modeText: 'Qillqaña',
    modeVoice: 'Arsuña',
    modeImage: 'Jamuqa apst’aña',
    inputPlaceholder: 'Qhanañacham imasa policía uka utji...',
    submitQuery: 'Jiskt’aña',
    analyzing: 'Jiskt’awi uñakipaski...',
    rightsTitle: 'Oficial kamanaka',
    dutiesTitle: 'Jaqin phuqhañanakapaj',
    evidenceSummaryTitle: 'Phuqhawinaka, jasaki arunakana',
    evidenceSummaryNotice: "Gemma ukaxa jikxatata qillqatanakat mä juk'a qhanañchi. Oficial phuqhawinakaxa aynachankiwa.",
    policeCanDoTitle: 'Policía kunsa luraspawa',
    policeCannotDoTitle: 'Policía kunsa jani lurkaspawa',
    whatToDoTitle: 'Kunas lurañama',
    continueTitle: 'Aruskipäwimpi sarantaskakismawa',
    continueButton: 'Sarantaskakiña',
    officialSources: 'Backend apnaqata oficial phuqhawinaka',
    officialSourceNotice: 'Oficial qillqataxa kastill arunwa qhiparaski, jan mayjt’ayañataki.',
    phraseSuggested: 'Sumaq arsuwinaka',
    copyPhrase: 'Arsuwi copiana',
    listenPhrase: 'Ist’aña',
  },
};
