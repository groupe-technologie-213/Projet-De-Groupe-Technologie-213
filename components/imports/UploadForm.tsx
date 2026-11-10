// lib/components/imports/upload-form.tsx
"use client";

import { useState, useTransition } from "react";
import { uploadImportAction } from "../../app/(app)/imports/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UploadForm() {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setStatusMessage(null);

    startTransition(async () => {
      const res = await uploadImportAction(formData);
      if (res.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Import terminé : ${res.validCount} événements importés, ${res.invalidCount} lignes ignorées.`,
        });
        form.reset();
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Nouvel import de journaux</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nom de l&apos;import (optionnel)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Ex: Journaux Auth Production"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-1">
            Fichier (.csv ou .json)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,.json"
            required
            className="w-full text-sm"
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Import en cours..." : "Importer le fichier"}
        </Button>

        {statusMessage && (
          <p
            className={`text-sm font-medium ${
              statusMessage.type === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {statusMessage.text}
          </p>
        )}
      </form>
    </Card>
  );
}