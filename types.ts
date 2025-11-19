export interface FinancialRecord {
  BA: string;
  monthly: string;
  actCode: string;
  amount: number;
}

export interface RawCsvRow {
  BA: string;
  monthly: string;
  actCode: string;
  amount: string;
  [key: string]: string; // Allow other columns loosely
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  READY = 'READY',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AnalysisResult {
  markdown: string;
  rawResponse: string;
}