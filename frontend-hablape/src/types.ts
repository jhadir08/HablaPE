export type NavigationTab = 'query' | 'corpus' | 'scenarios' | 'history' | 'pipeline_audit';

export type Language = 'es' | 'en' | 'qu' | 'ay';

export type InputMode = 'text' | 'audio' | 'image';

export interface IdentifiedFact {
  category: string;
  detail: string;
  status: 'present' | 'missing' | 'implied';
}

export interface SuggestedPhrase {
  phrase: string;
  context: string;
  purpose: string;
}

export interface LegalReference {
  document: string;
  article: string;
  summary: string;
  officialUrl?: string;
  version: string;
  publishedDate: string;
  isVigente: boolean;
  chunkId?: string;
}

export interface DerivationChannel {
  entity: string;
  phone: string;
  purpose: string;
  website?: string;
}

export interface PipelineStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'warning' | 'error';
  details: string;
  timestamp?: string;
  data?: any;
}

export interface QueryResponse {
  id: string;
  timestamp: string;
  queryInput: {
    text?: string;
    mode: InputMode;
    fileName?: string;
  };
  scenario: {
    category: string;
    riskLevel: 'bajo' | 'medio' | 'alto';
    needsClarification: boolean;
    missingFields?: string[];
    clarificationPrompt?: string;
  };
  facts: IdentifiedFact[];
  explanation: {
    overview: string;
    citizenRights: string[];
    citizenDuties: string[];
    evidenceSummary: string[];
    whatToDo: string[];
    whatPoliceCanDo: string[];
    whatPoliceCannotDo: string[];
  };
  suggestedPhrases: SuggestedPhrase[];
  followUpQuestion?: string;
  legalReferences: LegalReference[];
  derivationChannels: DerivationChannel[];
  limitations: string;
  pipelineTrace: PipelineStep[];
  backendMeta?: {
    apiVersion: string;
    corpusVersion: string;
    modelProvider: string;
    answerMode: 'deterministic' | 'direct_gemma' | 'rag_gemma' | 'blocked';
    language: Language;
    translationApplied: boolean;
    validations: Array<{ name: string; passed: boolean; reason: string }>;
    privacy: {
      possible_personal_data: string[];
      raw_input_persisted: boolean;
      retention: string;
    };
  };
}

export interface CorpusArticle {
  id: string;
  documentTitle: string;
  code: string; // e.g. "D.S. N° 012-2025-IN" or "CPP Art. 205"
  category: string;
  articleNumber: string;
  title: string;
  content: string;
  publishedDate: string;
  effectiveDate: string;
  version: string;
  isVigente: boolean;
  supersedes?: string;
  officialUrl: string;
  spijUrl?: string;
  elPeruanoUrl?: string;
  tags: string[];
  citizenSummary?: string;
  whenUsed?: string[];
  relatedCases?: string[];
  faqs?: { question: string; answer: string }[];
}

export interface FrequentScenario {
  id: string;
  title: string;
  summary: string;
  iconName: string;
  userPrompt: string;
  keyTakeaways: string[];
  commonMisconceptions: string[];
  sampleAudioText?: string;
}

export interface SavedItem {
  id: string;
  type: 'query' | 'article' | 'phrase' | 'download';
  title: string;
  timestamp: string;
  isFavorite?: boolean;
  confidenceLevel?: string;
  summary?: string;
  articleCode?: string;
  downloadUrl?: string;
  fileSize?: string;
  data: any;
}
