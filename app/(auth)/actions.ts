"use server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isAuthRetryableFetchError } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeRedirect } from "@/lib/safe-redirect"

export type AuthState = {
  error?: string
  message?: string
}
const NETWORK_ERROR = "Service de connexion injoignable. Vérifie ta connexion Internet et réessaie."
async function getOrigin() {
  return (await headers()).get("origin") ?? "http://localhost:3000"
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
    if (isAuthRetryableFetchError(error)) {
      return { error: NETWORK_ERROR }
    }
    return { error: "Email ou mot de passe incorrect." }
  }
  redirect(redirectTo)
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont obligatoires." }
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." }
  }

 
  const origin = await getOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === "weak_password") {
      return { error: "Mot de passe trop faible : mélange lettres, chiffres et symboles." }
    }
    if (isAuthRetryableFetchError(error)) {
      return { error: NETWORK_ERROR }
    }
    return { error: "Impossible de créer le compte. Réessaie dans quelques minutes." }
  }

  if (data.session) {
    redirect("/dashboard")
  }

  return { message: "Compte créé ! Vérifie tes emails pour confirmer ton adresse." }
}

export async function signInWithGithub(formData: FormData) {
  const redirectTo = safeRedirect(formData.get("redirect") as string | null)
  const origin = await getOrigin()

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error || !data.url) {
    redirect("/login?error=github")
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}