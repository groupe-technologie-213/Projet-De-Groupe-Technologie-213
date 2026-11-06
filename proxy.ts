import { NextResponse } from "next/server"

// TODO (Membre 1) : rafraîchir la session Supabase (lib/supabase/proxy.ts)
// et rediriger vers /login si l'utilisateur n'est pas connecté
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
