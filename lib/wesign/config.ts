function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getWeSignConfig() {
  return {
    baseUrl: requiredEnv("WESIGN_API_BASE_URL").replace(/\/$/, ""),
    username: requiredEnv("WESIGN_USERNAME"),
    password: requiredEnv("WESIGN_PASSWORD"),
  };
}
