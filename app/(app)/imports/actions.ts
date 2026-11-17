"use server";

import { revalidatePath } from "next/cache";
import { parseLogFile } from "@/lib/analysis/parser";
import { createClient } from "@/lib/supabase/server";

const BATCH_SIZE = 500;

export async function uploadImportAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." };
  }

  const file = formData.get("file");
  const name = formData.get("name");
  const customName = typeof name === "string" ? name.trim() : "";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Veuillez sélectionner un fichier CSV ou JSON valide." };
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".json")) {
    return { error: "Le fichier doit être au format CSV ou JSON." };
  }

  const fileFormat = fileName.endsWith(".json") ? "json" : "csv";

  const { data: logImport, error: createError } = await supabase
    .from("log_imports")
    .insert({
      user_id: user.id,
      name: customName || file.name,
      file_name: file.name,
      file_format: fileFormat,
      status: "pending",
      total_lines: 0,
      invalid_lines: 0,
    })
    .select("id")
    .single();

  if (createError || !logImport) {
    return { error: createError?.message ?? "Impossible de créer l’import." };
  }

  try {
    const parsed = parseLogFile(await file.text(), file.name);

    if (parsed.events.length === 0) {
      throw new Error("Le fichier ne contient aucun événement valide.");
    }

    for (let i = 0; i < parsed.events.length; i += BATCH_SIZE) {
      const batch = parsed.events.slice(i, i + BATCH_SIZE).map((event) => ({
        import_id: logImport.id,
        user_id: user.id,
        occurred_at: event.occurred_at,
        source_ip: event.source_ip,
        event_type: event.event_type,
        username: event.username,
        user_agent: event.user_agent,
      }));

      const { error } = await supabase.from("log_events").insert(batch);
      if (error) throw new Error(error.message);
    }

    const { error: updateError } = await supabase
      .from("log_imports")
      .update({
        total_lines: parsed.validCount + parsed.invalidCount,
        invalid_lines: parsed.invalidCount,
      })
      .eq("id", logImport.id)
      .eq("user_id", user.id);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/imports");
    revalidatePath("/dashboard");

    return {
      success: true,
      validCount: parsed.validCount,
      invalidCount: parsed.invalidCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l’import.";

    await supabase
      .from("log_imports")
      .update({ status: "failed" })
      .eq("id", logImport.id)
      .eq("user_id", user.id);

    revalidatePath("/imports");
    return { error: message };
  }
}

export async function renameImportAction(importId: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed) return { error: "Le nom ne peut pas être vide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("log_imports")
    .update({ name: trimmed })
    .eq("id", importId);

  if (error) return { error: error.message };

  revalidatePath("/imports");
  return { success: true };
}

export async function deleteImportAction(importId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("log_imports")
    .delete()
    .eq("id", importId);

  if (error) return { error: error.message };

  revalidatePath("/imports");
  revalidatePath("/dashboard");
  return { success: true };
}