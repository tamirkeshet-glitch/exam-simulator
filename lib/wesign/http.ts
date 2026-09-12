import { getWeSignConfig } from "./config";
import { WeSignApiError, describeResultCode } from "./errors";

export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function weSignHttpRequest<T>(
  path: string,
  { method = "GET", body, headers = {} }: HttpRequestOptions = {}
): Promise<T> {
  const { baseUrl } = getWeSignConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const resultCode = data?.ResultCode;
    throw new WeSignApiError(
      describeResultCode(resultCode) ??
        data?.message ??
        `WeSign request failed (${response.status})`,
      response.status,
      resultCode,
      data
    );
  }

  return data as T;
}
