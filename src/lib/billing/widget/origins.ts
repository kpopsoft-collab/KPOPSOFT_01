export function normalizeWidgetOrigin(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid widget origin");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.hostname.includes("*")
  ) {
    throw new Error("Invalid widget origin");
  }
  return parsed.origin;
}

export function normalizeRequestOrigin(value: string | null): string {
  if (!value || value === "null") throw new Error("Invalid widget origin");
  return normalizeWidgetOrigin(value);
}

export function corsHeadersForOrigin(
  requestOrigin: string | null,
  allowedOrigin: string | null,
): Headers {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-KPOPSOFT-Widget",
    "Access-Control-Max-Age": "600",
    "X-Content-Type-Options": "nosniff",
  });
  if (
    requestOrigin &&
    allowedOrigin &&
    requestOrigin === allowedOrigin
  ) {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
  }
  return headers;
}
