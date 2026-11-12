import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  // Défense en profondeur : proxy.ts bloque déjà, mais on revérifie ici
  if (!data?.claims) {
    redirect("/login")
  }

  const email = data.claims.email ?? ""

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar email={email} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}