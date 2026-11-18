"use client";

import { useActionState, useState } from "react";
import { deleteAlert } from "../actions";

type ActionState = {
  error: string | null;
};

const initialState: ActionState = {
  error: null,
};

type Props = {
  alertId: string;
};

export default function DeleteAlertButton({ alertId }: Props) {
  const [confirming, setConfirming] = useState(false);

  const [state, formAction, isPending] = useActionState(
    deleteAlert,
    initialState
  );

  return (
    <div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Supprimer l'alerte
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer cette alerte ?
          </p>

          <div className="flex flex-wrap gap-2">
            <form action={formAction}>
              <input
                type="hidden"
                name="alert_id"
                value={alertId}
              />

              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Annuler
            </button>
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
        </div>
      )}
    </div>
  );
}