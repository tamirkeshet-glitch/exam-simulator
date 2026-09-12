export interface WeSignTokens {
  token: string;
  refreshToken: string;
  authToken: string;
}

export type DateFormat = 1 | 2 | 3 | 4; // 1=Israeli 2=US 3=ISO 4=European
export type SendingMethod = 1 | 2 | 4; // 1=SMS 2=Email 4=WhatsApp

export interface WeSignConfiguration {
  maxTemplatesPerProcess: number;
  enableFreeTrailUsers: boolean;
  [key: string]: unknown;
}

export interface WeSignSignerInput {
  signerMeans: string;
  signerSecondaryMeans?: string;
  emailNote?: string;
}

export interface CreateDocumentCollectionRequest {
  templateId: string;
  dateFormat: DateFormat;
  signers: WeSignSignerInput[];
}

export interface CreateDocumentCollectionResponse {
  id: string;
  [key: string]: unknown;
}

export interface DistributionSignerInput {
  signerMeans: string;
  sendingMethod?: SendingMethod;
}

export interface DistributionRequest {
  documentCollectionId: string;
  signers: DistributionSignerInput[];
}

export interface DistributionResponse {
  id: string;
  [key: string]: unknown;
}

export interface WeSignSignerStatus {
  signerMeans: string;
  timeSent: string | null;
  [key: string]: unknown;
}

export interface DocumentCollectionInfo {
  id: string;
  signers: WeSignSignerStatus[];
  [key: string]: unknown;
}
