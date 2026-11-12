import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

type Props = {
  searchParams: Promise<{
    severity?: string
    status?: string
    rule?: string
    search?: string
  }>
}

export default async function AlertsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams

  const severity = params.severity ?? ""
  const status = params.status ?? ""
  const rule = params.rule ?? ""
  const search = params.search?.trim() ?? ""

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Veuillez vous connecter pour consulter vos alertes.
      </div>
    )
  }

  // Récupération des statistiques
  const [
    totalQuery,
    openQuery,
    criticalQuery,
    resolvedQuery,
  ] = await Promise.all([
    supabase.from("alerts").select("*", { count: "exact", head: true }),
    supabase.from("alerts").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("alerts").select("*", { count: "exact", head: true }).eq("severity", "critical"),
    supabase.from("alerts").select("*", { count: "exact", head: true }).eq("status", "resolved"),
  ])

  // Construction de la requête des alertes
  let query = supabase
    .from("alerts")
    .select(`
      id,
      title,
      explanation,
      rule,
      severity,
      status,
      usernames,
      source_ips,
      event_count,
      created_at
    `)
    .order("created_at", { ascending: false })

  if (
    ["low", "medium", "high", "critical"].includes(severity)
  ) {
    query = query.eq("severity", severity)
  }

  if (
    ["open", "investigating", "resolved", "false_positive"].includes(status)
  ) {
    query = query.eq("status", status)
  }

  if (
    [
      "brute_force",
      "password_spraying",
      "impossible_travel",
      "off_hours",
      "new_ip",
      "manual",
    ].includes(rule)
  ) {
    query = query.eq("rule", rule)
  }

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  const { data: alerts, error } = await query

  const severityLabels: Record<string, string> = {
    low: "Faible",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  }

  const severityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  const statusLabels: Record<string, string> = {
    open: "Ouverte",
    investigating: "En investigation",
    resolved: "Résolue",
    false_positive: "Faux positif",
  }

  const ruleLabels: Record<string, string> = {
    brute_force: "Force brute",
    password_spraying: "Password spraying",
    impossible_travel: "Déplacement impossible",
    off_hours: "Connexion hors horaires",
    new_ip: "Nouvelle adresse IP",
    manual: "Manuelle",
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    })

  return (
    <main className="space-y-8">

      {/* En-tête */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Alertes de sécurité
          </h1>
          <p className="mt-2 text-gray-500">
            Surveillez et gérez les menaces détectées dans vos journaux.
          </p>
        </div>

        <Link
          href="/alerts/new"
          className="rounded-lg bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
        >
          + Nouvelle alerte
        </Link>
      </section>

      {/* Statistiques */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total des alertes"
          value={totalQuery.count ?? 0}
          icon="📊"
        />

        <StatCard
          title="Alertes ouvertes"
          value={openQuery.count ?? 0}
          icon="🔔"
        />

        <StatCard
          title="Alertes critiques"
          value={criticalQuery.count ?? 0}
          icon="🚨"
        />

        <StatCard
          title="Alertes résolues"
          value={resolvedQuery.count ?? 0}
          icon="✅"
        />

      </section>

      {/* Filtres */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Rechercher et filtrer
        </h2>

        <form
          action="/alerts"
          method="GET"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Rechercher une alerte..."
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            name="severity"
            defaultValue={severity}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            <option value="">Toutes les gravités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="critical">Critique</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="open">Ouverte</option>
            <option value="investigating">En investigation</option>
            <option value="resolved">Résolue</option>
            <option value="false_positive">Faux positif</option>
          </select>

          <select
            name="rule"
            defaultValue={rule}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            <option value="">Toutes les règles</option>
            <option value="brute_force">Force brute</option>
            <option value="password_spraying">Password spraying</option>
            <option value="impossible_travel">Déplacement impossible</option>
            <option value="off_hours">Connexion hors horaires</option>
            <option value="new_ip">Nouvelle adresse IP</option>
            <option value="manual">Manuelle</option>
          </select>

          <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Appliquer les filtres
            </button>

            <Link
              href="/alerts"
              className="rounded-lg border px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Réinitialiser
            </Link>
          </div>
        </form>
      </section>

      {/* Tableau des alertes */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Liste des alertes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {alerts?.length ?? 0} résultat(s) trouvé(s)
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-6 text-red-600">
            Erreur Supabase : {error.message}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">🛡️</div>
            <h3 className="mt-4 font-semibold text-gray-900">
              Aucune alerte trouvée
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Aucune alerte ne correspond à tes critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Alerte</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Gravité</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 font-semibold">Événements</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {alert.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {alert.explanation}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {ruleLabels[alert.rule] ?? alert.rule}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          severityColors[alert.severity] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {severityLabels[alert.severity] ?? alert.severity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {statusLabels[alert.status] ?? alert.status}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {alert.event_count}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(alert.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/alerts/${alert.id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>
        <span className="text-2xl">{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-bold text-gray-900">
        {value.toLocaleString("fr-FR")}
      </p>
    </div>
  )
}

