import { NextResponse } from "next/server";
import catalog from "@/catalog/pawnpass.json";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(catalog, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
