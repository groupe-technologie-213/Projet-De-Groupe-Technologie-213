import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeRedirect } from "@/lib/safe-redirect"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const redirectTo = safeRedirect(searchParams.get("redirect"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, origin))
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", origin))
}