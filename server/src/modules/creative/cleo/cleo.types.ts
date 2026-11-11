/** Imported CLEO context only. None of these fields are a scored Bizcom KPI. */
export interface CleoTopic {
  topic: string;
  answers: number;
  shares: { unionCoop: number; carrefour: number; lulu: number; spinneys: number; waitrose: number; other: number };
  otherDisplay: string;
  leader: string;
  window: string;
}
export interface CleoQuestion {
  question: string;
  unionCoopPosition: string;
  competitor: string | null;
  competitorPosition: string | null;
  unionCoopCitations: number;
  totalCitations: number;
  result: string;
  window: string;
}
export interface CleoEnginePosition {
  brand: string;
  googleAio: number | null;
  perplexity: number | null;
  claude: number | null;
  chatgptSearch: number | null;
  window: string;
}
export interface CleoFunnelStage {
  stage: string;
  count: number;
  shareDisplay: string;
  window: string;
}
export interface CleoCitationDomain {
  rank: number;
  domain: string;
  citations: number;
  shareDisplay: string;
  trendDisplay: string;
  window: string;
}
export interface CleoPhrase {
  phrase: string;
  searches: number;
  distinctQuestions: number;
  window: string;
}
export interface CleoSnapshot {
  source: 'Source: CLEO - single-source, not independently verifiable.';
  sourceFile: string;
  captureDate: string;
  availableCaptures: string[];
  unscored: true;
  topics: CleoTopic[];
  allTopics: CleoTopic;
  questions: CleoQuestion[];
  questionSummary: string;
  positions: CleoEnginePosition[];
  engineSupport: string;
  funnel: CleoFunnelStage[];
  funnelSupport: string;
  domains: CleoCitationDomain[];
  language: CleoPhrase[];
  windowLabels: { topics: string; questions: string; positions: string; funnel: string; domains: string; language: string };
  caveats: string[];
}
