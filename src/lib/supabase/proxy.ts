import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const protectedPaths = [
  "/dashboard",
  "/simulaciones",
  "/novedades",
  "/aprender",
  "/progreso",
  "/perfil",
];
const authPaths = ["/login", "/register", "/forgot-password"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function preventSharedCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: verifiedJwt } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(verifiedJwt?.claims.sub);
  const { pathname, search } = request.nextUrl;

  if (matchesPath(pathname, protectedPaths) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return preventSharedCaching(NextResponse.redirect(loginUrl));
  }

  if (matchesPath(pathname, authPaths) && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return preventSharedCaching(NextResponse.redirect(dashboardUrl));
  }

  return matchesPath(pathname, [...protectedPaths, ...authPaths])
    ? preventSharedCaching(response)
    : response;
}
