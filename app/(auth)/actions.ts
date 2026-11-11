"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { safeRedirect } from "@/lib/safe-redirect"

export type AuthState = {
  error?: string
  message?: string
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const redirectTo = safeRedirect(formData.get("redirect") as string | null)

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont obligatoires." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirme ton adresse email avant de te connecter." }
    }
    return { error: "Email ou mot de passe incorrect." }
  }
  redirect(redirectTo)
}