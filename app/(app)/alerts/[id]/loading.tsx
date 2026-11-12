export default function AlertDetailLoading() {
  return (
    <div className="animate-pulse space-y-8 p-6 md:p-8">

      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-100" />
        </div>

        <div className="h-9 w-28 rounded-full bg-gray-200" />
      </div>

      {/* Informations principales */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="flex-1 space-y-4">
            <div className="h-7 w-72 max-w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-9 w-32 rounded-full bg-gray-200" />
            <div className="h-9 w-32 rounded-full bg-gray-100" />
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-7 w-40 max-w-full rounded bg-gray-200" />
          </div>
        ))}
      </section>

      {/* Utilisateurs concernés */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 h-6 w-52 rounded bg-gray-200" />

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-9 w-28 rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </section>

      {/* Adresses IP */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 h-6 w-56 rounded bg-gray-200" />

        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-11 w-full rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </section>

      {/* Informations complémentaires */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 h-6 w-64 rounded bg-gray-200" />

        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="h-5 w-44 max-w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-5">
          <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
        </div>
      </section>

      {/* Bouton retour */}
      <div className="h-11 w-40 rounded-lg bg-gray-200" />

    </div>
  );
}

