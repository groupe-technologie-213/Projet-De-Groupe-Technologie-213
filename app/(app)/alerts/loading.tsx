export default function AlertsLoading() {
  return (
    <div className="space-y-8 p-6 md:p-8 animate-pulse">

      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-100" />
        </div>

        <div className="h-11 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-16 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row">
        <div className="h-10 flex-1 rounded-lg bg-gray-100" />
        <div className="h-10 w-full rounded-lg bg-gray-100 sm:w-40" />
        <div className="h-10 w-full rounded-lg bg-gray-100 sm:w-40" />
      </div>

      {/* Tableau des alertes */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* En-tête du tableau */}
        <div className="grid grid-cols-4 gap-4 border-b p-5">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>

        {/* Lignes */}
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="grid grid-cols-4 items-center gap-4 border-b p-5 last:border-0"
          >
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>

            <div className="h-6 w-20 rounded-full bg-gray-200" />

            <div className="h-6 w-24 rounded-full bg-gray-100" />

            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>

    </div>
  );
}

