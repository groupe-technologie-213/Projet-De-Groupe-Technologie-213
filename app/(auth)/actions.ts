"use server"
import { headers } from "next/headers"
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

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont obligatoires." }
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." }
  }

  // Adresse du site (localhost en développement, Vercel en production)
  const origin = (await headers()).get("origin") ?? "http://localhost:3000"

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Le lien de l'email de confirmation renverra ici (étape 14)
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === "weak_password") {
      return { error: "Mot de passe trop faible : mélange lettres, chiffres et symboles." }
    }
    return { error: "Impossible de créer le compte. Réessaie dans quelques minutes." }
  }

  return { message: "Compte créé ! Vérifie tes emails pour confirmer ton adresse." }
}