import { NextRequest, NextResponse } from "next/server";

/**
 * A per-request nonce lets us drop 'unsafe-inline' from script-src while
 * still allowing Next.js's own inline hydration scripts — Next detects this
 * exact pattern (a nonce in the CSP response header) and stamps its inline
 * <script> tags with a matching nonce attribute automatically.
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization files — no HTML/scripts to protect there.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
