import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/article(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.next();
    }
    const countCookie = req.cookies.get("article_view_count")?.value ?? "0";
    const viewCount = parseInt(countCookie, 10);
    if (viewCount < 3) {
      const response = NextResponse.next();
      response.cookies.set("article_view_count", String(viewCount + 1), {
        path: "/",
      });
      return response;
    }
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
