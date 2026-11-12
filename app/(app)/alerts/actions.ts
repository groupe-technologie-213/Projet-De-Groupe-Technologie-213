"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createAlert(formData: FormData) {
  const supabase = await createClient()

  // Vérifier l'utilisateur connecté
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Vous devez être connecté pour créer une alerte.")
  }

  const title = String(formData.get("title") ?? "").trim()
  const explanation = String(formData.get("explanation") ?? "").trim()
  const rule = String(formData.get("rule") ?? "")
  const severity = String(formData.get("severity") ?? "")
  const status = String(formData.get("status") ?? "open")
  const notes = String(formData.get("notes") ?? "").trim()
  const importId = String(formData.get("import_id") ?? "").trim()

  const usernames = String(formData.get("usernames") ?? "")
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean)

  const sourceIps = String(formData.get("source_ips") ?? "")
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean)

  // Validation
  if (!title || !explanation) {
    throw new Error("Le titre et la description sont obligatoires.")
  }

  const allowedRules = [
    "brute_force",
    "password_spraying",
    "impossible_travel",
    "off_hours",
    "new_ip",
    "manual",
  ]

  const allowedSeverities = [
    "low",
    "medium",
    "high",
    "critical",
  ]

  const allowedStatuses = [
    "open",
    "investigating",
    "resolved",
    "false_positive",
  ]

  if (!allowedRules.includes(rule)) {
    throw new Error("Type de menace invalide.")
  }

  if (!allowedSeverities.includes(severity)) {
    throw new Error("Niveau de gravité invalide.")
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Statut invalide.")
  }

  // Vérification des adresses IP
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$|^[0-9a-fA-F:]+$/

  if (sourceIps.some((ip) => !ipRegex.test(ip))) {
    throw new Error("Une ou plusieurs adresses IP sont invalides.")
  }

  // Enregistrement dans Supabase
  const { error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      import_id: importId || null,
      title,
      explanation,
      rule,
      severity,
      status,
      usernames,
      source_ips: sourceIps,
      event_count: 0,
      notes: notes || null,
    })

  if (error) {
    console.error("Erreur création alerte :", error)
    throw new Error(`Impossible de créer l'alerte : ${error.message}`)
  }

  revalidatePath("/alerts")
  revalidatePath("/dashboard")

  redirect("/alerts")
}