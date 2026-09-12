import { sendDocumentForSignature } from "@/lib/wesign/documents";
import { WeSignApiError } from "@/lib/wesign/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, signerMeans, signerSecondaryMeans, emailNote, templateId } = body;

    if (!customerId || !signerMeans) {
      return Response.json(
        { message: "customerId and signerMeans are required" },
        { status: 400 }
      );
    }

    const effectiveTemplateId = templateId ?? process.env.WESIGN_TEMPLATE_ID;
    if (!effectiveTemplateId) {
      return Response.json(
        { message: "templateId is required (or set WESIGN_TEMPLATE_ID)" },
        { status: 400 }
      );
    }

    const result = await sendDocumentForSignature({
      templateId: effectiveTemplateId,
      signerMeans,
      signerSecondaryMeans,
      emailNote,
    });

    return Response.json({ customerId, ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof WeSignApiError) {
      return Response.json(
        { message: error.message, resultCode: error.resultCode },
        { status: error.status }
      );
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
