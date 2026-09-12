import { weSignRequest } from "./client";
import type {
  CreateDocumentCollectionRequest,
  CreateDocumentCollectionResponse,
  DistributionRequest,
  DistributionResponse,
  DocumentCollectionInfo,
} from "./types";

export function createDocumentCollection(request: CreateDocumentCollectionRequest) {
  return weSignRequest<CreateDocumentCollectionResponse>("/v3/DocumentCollections", {
    method: "POST",
    body: request,
  });
}

export function sendDistribution(request: DistributionRequest) {
  return weSignRequest<DistributionResponse>("/v3/Distribution", {
    method: "POST",
    body: request,
  });
}

export function getDocumentCollectionInfo(id: string) {
  return weSignRequest<DocumentCollectionInfo>(`/v3/DocumentCollections/info/${id}`);
}

export interface SendDocumentForSignatureParams {
  templateId: string;
  signerMeans: string;
  signerSecondaryMeans?: string;
  emailNote?: string;
}

export async function sendDocumentForSignature(params: SendDocumentForSignatureParams) {
  const collection = await createDocumentCollection({
    templateId: params.templateId,
    dateFormat: 1,
    signers: [
      {
        signerMeans: params.signerMeans,
        signerSecondaryMeans: params.signerSecondaryMeans,
        emailNote: params.emailNote,
      },
    ],
  });

  // sendingMethod is intentionally omitted so WeSign derives it from signerMeans
  // (valid email -> Email, otherwise SMS), per changelog section 2.5.
  const distribution = await sendDistribution({
    documentCollectionId: collection.id,
    signers: [{ signerMeans: params.signerMeans }],
  });

  return { documentCollectionId: collection.id, distributionId: distribution.id };
}
