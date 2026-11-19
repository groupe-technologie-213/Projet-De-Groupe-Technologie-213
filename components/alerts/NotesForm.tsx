"use client";

import { useActionState } from "react";
import { updateAlertNotes } from "@/app/(app)/alerts/actions";

const initialState = {
  error: null as string | null,
};

type NotesFormProps = {
  alertId: string;
  initialNotes: string | null;
};

export default function NotesForm({
  alertId,
  initialNotes,
}: NotesFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAlertNotes,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="alert_id" value={alertId} />

      <textarea
        name="notes"
        defaultValue={initialNotes ?? ""}
        rows={5}
        placeholder="Ajouter vos observations sur cette alerte..."
        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer la note"}
      </button>
    </form>
  );
}