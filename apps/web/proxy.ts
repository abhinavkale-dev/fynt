import { NextResponse, NextRequest } from "next/server";
import { auth } from "./lib/auth";
function applySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    return response;
}
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublicFileRequest = /\.[^/]+$/.test(pathname);
    if (isPublicFileRequest ||
        pathname === "/" ||
        pathname.startsWith("/signin") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")) {
        return applySecurityHeaders(NextResponse.next());
    }
    const session = await auth.api.getSession({
        headers: request.headers,
    });
    if (!session) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return applySecurityHeaders(NextResponse.redirect(signInUrl));
    }
    return applySecurityHeaders(NextResponse.next());
}
export const config = {
    matcher: [
        "/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
    ],
};
