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

// Routes that are blocked while in pre-launch (under construction)
const preLaunchBlocked = ["/quote", "/shipping", "/dashboard", "/login", "/register"];
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Block app routes during pre-launch — redirect to landing page
  if (preLaunchBlocked.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
