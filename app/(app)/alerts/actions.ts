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

export async function updateAlertStatus(formData: FormData) {
  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez être connecté pour modifier une alerte.");
  }

  const alertId = String(formData.get("alert_id") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  const allowedStatuses = [
    "open",
    "investigating",
    "resolved",
    "false_positive",
  ];

  if (!alertId || !allowedStatuses.includes(status)) {
    throw new Error("Identifiant ou statut invalide.");
  }

  // Mettre à jour uniquement une alerte appartenant à l'utilisateur
  const { data, error } = await supabase
    .from("alerts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Erreur modification statut :", error);
    throw new Error("Impossible de modifier le statut de cette alerte.");
  }

  if (!data) {
    throw new Error("Alerte introuvable ou accès non autorisé.");
  }

  // Actualiser les pages concernées
  revalidatePath(`/alerts/${alertId}`);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");

  redirect(`/alerts/${alertId}`);
}
export async function deleteAlert(formData: FormData) {
  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez être connecté pour supprimer une alerte.");
  }

  const alertId = String(formData.get("alert_id") ?? "").trim();

  if (!alertId) {
    throw new Error("Identifiant de l'alerte manquant.");
  }

  // Supprimer uniquement une alerte appartenant à l'utilisateur
  const { data, error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Erreur suppression alerte :", error);
    throw new Error("Impossible de supprimer cette alerte.");
  }

  if (!data) {
    throw new Error("Alerte introuvable ou accès non autorisé.");
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");

  redirect("/alerts");
}


type ActionState = {
  error: string | null;
};

export async function updateAlertNotes(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "Vous devez être connecté pour modifier une note.",
    };
  }

  const alertId = String(formData.get("alert_id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!alertId) {
    return { error: "Identifiant de l'alerte manquant." };
  }

  const { data, error } = await supabase
    .from("alerts")
    .update({
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Erreur enregistrement note :", error);
    return { error: "Impossible d'enregistrer la note." };
  }

  if (!data) {
    return {
      error: "Alerte introuvable ou accès non autorisé.",
    };
  }

  revalidatePath(`/alerts/${alertId}`);
  revalidatePath("/alerts");

  redirect(`/alerts/${alertId}`);
}