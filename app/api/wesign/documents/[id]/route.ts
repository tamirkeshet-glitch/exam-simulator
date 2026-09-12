import { getDocumentCollectionInfo } from "@/lib/wesign/documents";
import { WeSignApiError } from "@/lib/wesign/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const info = await getDocumentCollectionInfo(id);
    return Response.json(info, { status: 200 });
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
