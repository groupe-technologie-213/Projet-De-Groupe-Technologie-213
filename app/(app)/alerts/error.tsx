"use client";

import { useEffect } from "react";
import Link from "next/link";

type AlertsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AlertsError({
  error,
  reset,
}: AlertsErrorProps) {
  useEffect(() => {
    console.error("Erreur de la page Alertes :", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

        {/* Icône */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          ⚠️
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900">
          Impossible de charger les alertes
        </h1>

        {/* Description */}
        <p className="mt-3 leading-6 text-gray-600">
          Une erreur est survenue lors de la récupération des alertes
          de sécurité. Cela peut être dû à un problème de connexion
          ou à une erreur du serveur.
        </p>

        {/* Référence de l'erreur */}
        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">
            Référence : {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            <span>↻</span>
            Réessayer
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <span>⌂</span>
            Retour au dashboard
          </Link>
        </div>

        {/* Pied de page */}
        <p className="mt-6 text-xs text-gray-400">
          LogSentinel — Surveillance et détection des menaces
        </p>

      </div>
    </div>
  );
}

