export default function Loading() {
  return (
    <main
      className="min-h-screen space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
    >
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-80 max-w-full rounded bg-gray-100" />
        </div>

        <div className="h-11 w-44 rounded-lg bg-gray-200" />
      </div>

      {/* Statistiques */}
      <section className="space-y-4">
        <div className="h-6 w-40 rounded bg-gray-200" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-9 w-9 rounded-lg bg-gray-100" />
              </div>

              <div className="mt-5 h-9 w-20 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Dernières alertes */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b p-5">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-56 rounded bg-gray-100" />
        </div>

        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div className="flex-1 space-y-3">
                <div className="h-4 w-48 max-w-full rounded bg-gray-200" />
                <div className="h-3 w-36 rounded bg-gray-100" />
              </div>

              <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Derniers imports */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b p-5">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-56 rounded bg-gray-100" />
        </div>

        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div className="flex-1 space-y-3">
                <div className="h-4 w-44 max-w-full rounded bg-gray-200" />
                <div className="h-3 w-56 max-w-full rounded bg-gray-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Animation de chargement */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

        <p className="text-sm font-medium text-gray-500">
          Chargement des données de sécurité...
        </p>
      </div>
    </main>
  )
}

