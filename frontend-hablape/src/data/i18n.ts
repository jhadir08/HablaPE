import { Language } from '../types';

export interface UIStringMap {
  nav_query: string;
  nav_query_sub: string;
  nav_corpus: string;
  nav_corpus_sub: string;
  nav_scenarios: string;
  nav_scenarios_sub: string;
  nav_history: string;
  nav_history_sub: string;
  nav_audit: string;
  nav_audit_sub: string;
  nav_profile: string;
  nav_profile_sub: string;
  
  app_subtitle: string;
  official_tag: string;
  normativa_badge: string;
  
  profile_headline: string;
  profile_subhead: string;
  pref_section: string;
  lang_label: string;
  lang_desc: string;
  
  mode_text: string;
  mode_voice: string;
  mode_image: string;
  
  input_placeholder: string;
  submit_query: string;
  analyzing_title: string;
  
  rights_title: string;
  duties_title: string;
  what_to_do_title: string;
  official_sources_title: string;
  official_source_notice: string;
  
  phrase_suggested: string;
  copy_phrase: string;
  listen_phrase: string;
}

export const I18N_STRINGS: Record<Language, UIStringMap> = {
  es: {
    nav_query: 'Inicio',
    nav_query_sub: 'Consulta de Intervención',
    nav_corpus: 'Normativa',
    nav_corpus_sub: 'Leyes y D.S. 012-2025-IN',
    nav_scenarios: 'Practicar',
    nav_scenarios_sub: 'Simulador de Derechos',
    nav_history: 'Mi Biblioteca',
    nav_history_sub: 'Consultas y guardados',
    nav_audit: 'Auditoría Pipeline',
    nav_audit_sub: 'Trazabilidad y Reglas',
    nav_profile: 'Perfil',
    nav_profile_sub: 'Motor Gemma 4 RAG',
    
    app_subtitle: 'Asistente de Intervención Policial',
    official_tag: 'Información oficial actualizada',
    normativa_badge: 'Normativa Peruana 2025',
    
    profile_headline: 'Mi Perfil Ciudadano',
    profile_subhead: 'Personaliza tu experiencia dentro de HablaPE y administra tus preferencias de idioma, accesibilidad y privacidad.',
    pref_section: 'PREFERENCIAS DE APLICACIÓN',
    lang_label: 'Idioma de Interfaz y Respuesta',
    lang_desc: 'Selecciona tu idioma preferido para la experiencia HablaPE.',
    
    mode_text: 'Escribir',
    mode_voice: 'Hablar',
    mode_image: 'Tomar Foto',
    
    input_placeholder: 'Describe qué está ocurriendo durante la intervención policial...',
    submit_query: 'Consultar Derechos',
    analyzing_title: 'Analizando tu situación con Gemma 4...',
    
    rights_title: 'Tus Derechos Garantizados',
    duties_title: 'Tus Deberes Ciudadanos',
    what_to_do_title: '¿Qué puedes hacer?',
    official_sources_title: 'Fuente Oficial y Normativa Aplicada',
    official_source_notice: 'Texto normativo oficial en español (vigencia y validez legal intactas)',
    
    phrase_suggested: 'Frases Sugeridas para Comunicarte',
    copy_phrase: 'Copiar frase',
    listen_phrase: 'Escuchar',
  },
  en: {
    nav_query: 'Home',
    nav_query_sub: 'Intervention Query',
    nav_corpus: 'Regulations',
    nav_corpus_sub: 'Laws & D.S. 012-2025-IN',
    nav_scenarios: 'Practice',
    nav_scenarios_sub: 'Rights Simulator',
    nav_history: 'My Library',
    nav_history_sub: 'Queries & Saved items',
    nav_audit: 'Pipeline Audit',
    nav_audit_sub: 'Traceability & Rules',
    nav_profile: 'Profile',
    nav_profile_sub: 'Gemma 4 RAG Engine',
    
    app_subtitle: 'Police Intervention Assistant',
    official_tag: 'Updated official information',
    normativa_badge: 'Peruvian Regulations 2025',
    
    profile_headline: 'My Citizen Profile',
    profile_subhead: 'Customize your experience in HablaPE and manage your language, accessibility, and privacy preferences.',
    pref_section: 'APPLICATION PREFERENCES',
    lang_label: 'Interface & Response Language',
    lang_desc: 'Select your preferred language for HablaPE.',
    
    mode_text: 'Type',
    mode_voice: 'Speak',
    mode_image: 'Take Photo',
    
    input_placeholder: 'Describe what is happening during the police intervention...',
    submit_query: 'Check Rights',
    analyzing_title: 'Analyzing your situation with Gemma 4...',
    
    rights_title: 'Your Guaranteed Rights',
    duties_title: 'Your Citizen Duties',
    what_to_do_title: 'What can you do?',
    official_sources_title: 'Official Sources & Applicable Regulations',
    official_source_notice: 'Official legal text in Spanish (full legal validity preserved)',
    
    phrase_suggested: 'Suggested Communication Phrases',
    copy_phrase: 'Copy phrase',
    listen_phrase: 'Listen',
  },
  qu: {
    nav_query: 'Qallariy',
    nav_query_sub: 'Intervención Tapukuy',
    nav_corpus: 'Kamachikuykuna',
    nav_corpus_sub: 'Liykuna wan D.S. 012-2025-IN',
    nav_scenarios: 'Yachapakuy',
    nav_scenarios_sub: 'Derechokuna Yachachiy',
    nav_history: 'Ñawinchana Wasiy',
    nav_history_sub: 'Tapukuykuna Taqesqapas',
    nav_audit: 'Pipeline Auditay',
    nav_audit_sub: 'Trazabilidad wan Reglakuna',
    nav_profile: 'Kikiypa Perfilniy',
    nav_profile_sub: 'Motor Gemma 4 RAG',
    
    app_subtitle: 'Policía Intervención Yanapaq',
    official_tag: 'Musaqchasqa kamachikuy simi',
    normativa_badge: 'Perú Kamachikuykuna 2025',
    
    profile_headline: 'Kikiypa Runa Perfilniy',
    profile_subhead: 'HablaPE-pi simiykita, qawarinaykita wan pakay kawsaynikita allichay.',
    pref_section: 'APLIKASYON ALLICHANAKUNA',
    lang_label: 'Simi Akllana',
    lang_desc: 'Akllay ima simipim HablaPE yanapasunkiman.',
    
    mode_text: 'Qillqay',
    mode_voice: 'Rimay',
    mode_image: 'Ruptuta Hurquy',
    
    input_placeholder: 'Willarimuy imami qapariywan policía hawaykushasunki...',
    submit_query: 'Derechokuna Tapuy',
    analyzing_title: 'Gemma 4-wan hawaykusqaykita qawashaspa...',
    
    rights_title: 'Derechoykikuna Taqesqa',
    duties_title: 'Runap Ruwayninkuna',
    what_to_do_title: 'Imatataq ruwawaq?',
    official_sources_title: 'Kamachikuy Pukyukuna (Oficial)',
    official_source_notice: 'Castellano simipi oficila kamachikuy (Legal validez tapanalla)',
    
    phrase_suggested: 'Sumaq Rimaykuna Sugerido',
    copy_phrase: 'Rimay copiay',
    listen_phrase: 'Uyariy',
  },
  ay: {
    nav_query: 'Qalltawi',
    nav_query_sub: 'Intervención Jiskt’awi',
    nav_corpus: 'Kamanaka',
    nav_corpus_sub: 'Layinaka uka D.S. 012-2025-IN',
    nav_scenarios: 'Yatiqaña',
    nav_scenarios_sub: 'Derechonaka Yatiqaña',
    nav_history: 'P’ankawasiya',
    nav_history_sub: 'Jiskt’anaka imatana',
    nav_audit: 'Pipeline Auditariga',
    nav_audit_sub: 'Trazabilidad uka Reglanaka',
    nav_profile: 'Nayaj Perfilaja',
    nav_profile_sub: 'Motor Gemma 4 RAG',
    
    app_subtitle: 'Policía Intervención Yanapiri',
    official_tag: 'Machaq kamachi yatiy',
    normativa_badge: 'Perú Kamanaka 2025',
    
    profile_headline: 'Jaqi Perfilaja',
    profile_subhead: 'HablaPE aruma, uñjawi aruma uka privacidad askicham.',
    pref_section: 'APLIKASYON ASKIÑA',
    lang_label: 'Aru Akllaña',
    lang_desc: 'Akllaram kawkir arusampis HablaPE uñjañama.',
    
    mode_text: 'Qillqaña',
    mode_voice: 'Arsuña',
    mode_image: 'Jamuqa Apst’aña',
    
    input_placeholder: 'Qhanañacham imasa policía uka utji...',
    submit_query: 'Derechonaka Jiskt’aana',
    analyzing_title: 'Gemma 4 uñjasisa yatiyañama...',
    
    rights_title: 'Derechonakama Qhanata',
    duties_title: 'Jaqin Phuqhañanakapaj',
    what_to_do_title: 'Kunas lurañama?',
    official_sources_title: 'Kamachi Pukyunaka (Oficial)',
    official_source_notice: 'Castellano aruta oficial kamachi (Legal suma phuqa)',
    
    phrase_suggested: 'Sumaq Arsuwinaka',
    copy_phrase: 'Arsuwi copiana',
    listen_phrase: 'Ist’aña',
  },
};
