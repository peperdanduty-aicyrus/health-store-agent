import { NextResponse, type NextRequest } from "next/server";
import { isSurveyHost } from "@/lib/survey/host";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" && isSurveyHost(request.headers.get("host"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/survey";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
