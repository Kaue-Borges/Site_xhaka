export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: method === "GET" ? undefined : { "Content-Type": "application/json" },
    ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;
    try {
      message = (await response.json()).error || message;
    } catch {
      /* Response may be empty. */
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
