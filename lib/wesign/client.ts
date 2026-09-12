import { weSignHttpRequest, type HttpRequestOptions } from "./http";
import { WeSignApiError } from "./errors";
import { getValidToken, invalidateToken } from "./auth";

export async function weSignRequest<T>(
  path: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  const withAuth = async () => ({
    ...options,
    headers: { Authorization: `Bearer ${await getValidToken()}`, ...options.headers },
  });

  try {
    return await weSignHttpRequest<T>(path, await withAuth());
  } catch (error) {
    if (error instanceof WeSignApiError && error.status === 401) {
      invalidateToken();
      return await weSignHttpRequest<T>(path, await withAuth());
    }
    throw error;
  }
}
