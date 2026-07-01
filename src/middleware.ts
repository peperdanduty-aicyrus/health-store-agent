import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, getAppMode } from "@/lib/app-mode";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = getAppMode();

  if (!canAccessPath(pathname, mode)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)).*)",
  ],
};
