import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const pathname = await req.nextUrl.pathname;

    //check authenticated
    const isAuth = await getToken({ req });
    const isLoginPage = pathname.startsWith("/login");

    //redirect to dashboard if not authenticated and accessing login page
    if (!isAuth && isLoginPage) {
      return NextResponse.next();
    }

    //redirect to login if authenticated and accessing login page
    if (isAuth && isLoginPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const sensitivePage = ["/dashboard"];
    const isAccessingSensitivePage = sensitivePage.some((page) =>
      pathname.startsWith(page)
    );

    //redirect to login if not authenticated and accessing sensitive page
    if (!isAuth && isAccessingSensitivePage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      async authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
