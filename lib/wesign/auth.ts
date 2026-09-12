import { getWeSignConfig } from "./config";
import { weSignHttpRequest } from "./http";
import type { WeSignTokens } from "./types";

let cachedTokens: WeSignTokens | null = null;

export function invalidateToken() {
  cachedTokens = null;
}

export async function getValidToken(): Promise<string> {
  if (cachedTokens) return cachedTokens.token;

  const { username, password } = getWeSignConfig();
  // Field names (userName/password) are not shown in the 4.0.0 changelog excerpt we have;
  // verify against the OpenAPI spec (https://wse.comsigntrust.com/api/swagger) before go-live.
  cachedTokens = await weSignHttpRequest<WeSignTokens>("/v3/Users/login", {
    method: "POST",
    body: { userName: username, password },
  });

  return cachedTokens.token;
}
