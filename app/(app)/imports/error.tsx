"use client"

import Link from "next/link"

// Affiché si le chargement de la page Imports échoue (base injoignable, erreur inattendue…)
export default function ImportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-lg space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-semibold text-red-800">Impossible de charger tes imports</h1>
      <p className="text-sm text-red-700">
        Une erreur est survenue. Vérifie ta connexion Internet, puis réessaie.
      </p>
      {error.digest && <p className="text-xs text-red-500">Code de l&apos;erreur : {error.digest}</p>}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}