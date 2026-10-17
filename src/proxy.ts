import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default_pawnpass_secret_2026";
const encodedKey = new TextEncoder().encode(secretKey);

async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; expiresAt: string };
  } catch {
    return null;
  }
}

// Default LAUNCHED to true so full platform and /login routes are active
const IS_LAUNCHED = process.env.LAUNCHED !== "false";

// Protected routes (require auth)
const protectedRoutes = ["/dashboard", "/shipping"];
const authRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  const isProtected = protectedRoutes.some((r) => path.startsWith(r));
  const isAuthRoute = authRoutes.includes(path);

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};