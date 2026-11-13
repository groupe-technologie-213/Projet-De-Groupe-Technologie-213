"use client";

import { useState } from "react";
import { deleteAlert } from "../actions";

type Props = {
  alertId: string;
};

export default function DeleteAlertButton({ alertId }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700"
        >
          Supprimer l'alerte
        </button>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-3 text-sm font-medium text-red-800">
            Voulez-vous vraiment supprimer cette alerte ?
            Cette action est irréversible.
          </p>

          <div className="flex flex-wrap gap-2">
            <form action={deleteAlert}>
              <input
                type="hidden"
                name="alert_id"
                value={alertId}
              />

              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirmer la suppression
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}