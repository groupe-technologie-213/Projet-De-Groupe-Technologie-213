// src/app/(app)/imports/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseLogFile } from "@/lib/analysis/parser";

const BATCH_SIZE = 500;

export async function uploadImportAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." };
  }

  const file = formData.get("file") as File | null;
  const customName = (formData.get("name") as string | null)?.trim();

  if (!file || file.size === 0) {
    return { error: "Veuillez sélectionner un fichier CSV ou JSON valide." };
  }

  const importName = customName || file.name;
  const fileFormat = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";

  // 1. Création de l'import (statut 'pending' par défaut dans votre schéma)
  const { data: logImport, error: createError } = await supabase
    .from("log_imports")
    .insert({
      user_id: user.id,
      name: importName,
      file_name: file.name,
      file_format: fileFormat,
      status: "pending",
      total_lines: 0,
      invalid_lines: 0,
    })
    .select("id")
    .single();

  if (createError || !logImport) {
    return { error: createError?.message ?? "Impossible de créer l'import." };
  }

  try {
    const content = await file.text();
    const parsed = parseLogFile(content, file.name);

    // 2. Insertion par lots (batch insert) dans log_events
    for (let i = 0; i < parsed.events.length; i += BATCH_SIZE) {
      const batch = parsed.events.slice(i, i + BATCH_SIZE).map((ev) => ({
        import_id: logImport.id,
        user_id: user.id,
        occurred_at: ev.occurred_at,
        source_ip: ev.source_ip,
        event_type: ev.event_type,
        username: ev.username,
        user_agent: ev.user_agent,
      }));

      const { error: batchError } = await supabase.from("log_events").insert(batch);
      if (batchError) throw new Error(batchError.message);
    }

    // 3. Mise à jour de l'import avec les vrais compteurs et le statut 'analyzed'
    await supabase
      .from("log_imports")
      .update({
        status: "analyzed",
        total_lines: parsed.validCount + parsed.invalidCount,
        invalid_lines: parsed.invalidCount,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", logImport.id);

    revalidatePath("/imports");
    revalidatePath("/dashboard");

    return {
      success: true,
      validCount: parsed.validCount,
      invalidCount: parsed.invalidCount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'analyse";
    await supabase
      .from("log_imports")
      .update({ status: "failed" })
      .eq("id", logImport.id);

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