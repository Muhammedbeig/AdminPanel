import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // 1. Skip static files and API routes to save performance
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") || 
    pathname.startsWith("/static") || 
    pathname.includes(".") // Skipping files like image.png
  ) {
    return NextResponse.next();
  }

  try {
    // 2. Fetch redirect rule from your internal API (or use direct DB if not on Edge)
    // Note: Fetching full URL is required in Middleware
    const fetchUrl = `${req.nextUrl.origin}/api/redirect-check?path=${encodeURIComponent(pathname)}`;
    const res = await fetch(fetchUrl);
    
    if (res.ok) {
      const data = await res.json();
      
      if (data.redirect) {
        // Handle 410 Gone (Content Deleted)
        if (data.redirect.type === 410) {
          return new NextResponse(null, { status: 410 });
        }

        // Handle Standard Redirects (301, 302, 307, 308)
        return NextResponse.redirect(
          new URL(data.redirect.destination, req.url), 
          data.redirect.type
        );
      }
    }
  } catch (e) {
    // Fail silently and let the site load if check fails
    console.error("Redirect check failed", e);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
