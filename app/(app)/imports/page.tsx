import { redirect } from "next/navigation";
import {
  ImportsTable,
  type LogImportItem,
} from "@/components/imports/ImportsTable";
import { UploadForm } from "@/components/imports/UploadForm";
import { createClient } from "@/lib/supabase/server";

export default async function ImportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("log_imports")
    .select("id, name, created_at, status, total_lines, invalid_lines")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const imports: LogImportItem[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    status:
      row.status === "pending" || row.status === "analyzed"
        ? row.status
        : "failed",
    event_count: Math.max(0, row.total_lines - row.invalid_lines),
    skipped_lines: row.invalid_lines,
  }));

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Imports</h1>
      <UploadForm />
      <ImportsTable imports={imports} />
    </main>
  );
}