import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) throw new Error("SESSION_SECRET is not set");
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

const IS_LAUNCHED = process.env.LAUNCHED === "true";

// Routes blocked during pre-launch
const preLaunchBlocked = ["/quote", "/shipping", "/dashboard", "/login", "/register", "/verify"];

// Protected routes (require auth) — only enforced when launched
const protectedRoutes = ["/dashboard", "/shipping"];
const authRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Pre-launch: block all app routes
  if (!IS_LAUNCHED && preLaunchBlocked.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // When launched: protect routes requiring auth
  if (IS_LAUNCHED) {
    const cookie = req.cookies.get("session")?.value;
    const session = await decrypt(cookie);

    const isProtected = protectedRoutes.some(r => path.startsWith(r));
    const isAuthRoute = authRoutes.includes(path);

    if (isProtected && !session?.userId) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isAuthRoute && session?.userId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
