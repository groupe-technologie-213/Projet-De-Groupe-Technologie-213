export default function ImportsLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Chargement des imports">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />

      {/* Formulaire d'import */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-5 w-56 rounded bg-gray-200" />
        <div className="h-10 w-full rounded-md bg-gray-100" />
        <div className="h-10 w-full rounded-md bg-gray-100" />
        <div className="h-10 w-40 rounded-md bg-gray-200" />
      </div>

      {/* Tableau des imports */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="grid grid-cols-4 gap-4 border-b p-4 last:border-0">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}