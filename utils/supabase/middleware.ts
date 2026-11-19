import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type PendingCookie = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = new Set(["/login", "/activate-account"]);

export async function createClient(request: NextRequest) {
  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies.push(...cookiesToSet);
          Object.entries(headers).forEach(([key, value]) => {
            pendingHeaders[key] = value;
          });
        },
      },
    },
  );

  // Verify and refresh the token. Nothing should run between client creation
  // and this call, otherwise sessions can be dropped unexpectedly.
  const { data: claimsData } = await supabase.auth.getClaims();

  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);
  const isAuthenticated = Boolean(claimsData?.claims);

  let response: NextResponse;
  if (!isAuthenticated && !isPublicPath) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (isAuthenticated && isPublicPath) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next({ request });
  }

  // A redirect must carry the refreshed session cookies and the no-cache
  // headers, otherwise the refresh is discarded on navigation.
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  Object.entries(pendingHeaders).forEach(([key, value]) =>
    response.headers.set(key, value),
  );

  return response;
}
