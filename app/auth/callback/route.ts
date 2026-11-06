import { NextResponse } from "next/server"

// TODO (Membre 1) : échanger le code OAuth GitHub contre une session Supabase,
// puis rediriger vers un chemin interne uniquement (lib/safe-redirect.ts)
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url))
}
