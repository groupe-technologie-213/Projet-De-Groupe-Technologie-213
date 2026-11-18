"use client";

import { useActionState } from "react";
import { updateAlertStatus } from "@/app/(app)/alerts/actions";

type ActionState = {
  error: string | null;
};

const initialState: ActionState = {
  error: null,
};

type StatusFormProps = {
  alertId: string;
  currentStatus: string;
};

export default function StatusForm({
  alertId,
  currentStatus,
}: StatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAlertStatus,
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input type="hidden" name="alert_id" value={alertId} />

      <select
        name="status"
        defaultValue={currentStatus}
        aria-label="Nouveau statut de l'alerte"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="open">Ouverte</option>
        <option value="investigating">En investigation</option>
        <option value="resolved">Résolue</option>
        <option value="false_positive">Faux positif</option>
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Modification..." : "Modifier le statut"}
      </button>

      {state.error && (
        <p className="text-sm text-red-600 sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}