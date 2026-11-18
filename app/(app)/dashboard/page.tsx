import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatCard } from "@/components/dashboard/StatCard"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Vérifier l'utilisateur connecté
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-bold">Session non disponible</h1>
        <p className="mt-2 text-gray-500">
          Veuillez vous reconnecter pour consulter votre dashboard.
        </p>
        <Link href="/login" className="mt-4 inline-block text-blue-600">
          Se connecter
        </Link>
      </div>
    )
  }

  // Récupérer les données de Supabase en parallèle
  const [
    importsQuery,
    eventsQuery,
    openAlertsQuery,
    criticalAlertsQuery,
    recentAlertsQuery,
    recentImportsQuery,
  ] = await Promise.all([
    // Nombre total d'imports
    supabase
      .from("log_imports")
      .select("*", { count: "exact", head: true }),

    // Nombre total d'événements
    supabase
      .from("log_events")
      .select("*", { count: "exact", head: true }),

    // Nombre d'alertes ouvertes
    supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),

    // Nombre d'alertes critiques
    supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("severity", "critical"),

    // Les cinq dernières alertes
    supabase
      .from("alerts")
      .select(
        "id, title, severity, status, rule, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),

    // Les cinq derniers imports
    supabase
      .from("log_imports")
      .select(
        "id, name, file_name, file_format, status, total_lines, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // Détecter les erreurs de récupération
  const errors = [
    importsQuery.error,
    eventsQuery.error,
    openAlertsQuery.error,
    criticalAlertsQuery.error,
    recentAlertsQuery.error,
    recentImportsQuery.error,
  ].filter(Boolean)

  const imports = importsQuery.count ?? 0
  const events = eventsQuery.count ?? 0
  const openAlerts = openAlertsQuery.count ?? 0
  const criticalAlerts = criticalAlertsQuery.count ?? 0

  const alerts = recentAlertsQuery.data ?? []
  const recentImports = recentImportsQuery.data ?? []

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    })

  const severityStyle: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  const severityLabel: Record<string, string> = {
    low: "Faible",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  }

  const statusLabel: Record<string, string> = {
    open: "Ouverte",
    investigating: "En investigation",
    resolved: "Résolue",
    false_positive: "Faux positif",
  }

  const ruleLabel: Record<string, string> = {
    brute_force: "Force brute",
    password_spraying: "Password spraying",
    impossible_travel: "Déplacement impossible",
    off_hours: "Connexion hors horaires",
    new_ip: "Nouvelle adresse IP",
    manual: "Alerte manuelle",
  }

  return (
    <main className="space-y-8">

      {/* En-tête */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="mt-2 text-gray-500">
            Bienvenue sur LogSentinel.
            Voici l'état de votre sécurité.
          </p>
        </div>

        <Link
          href="/imports"
          className="rounded-lg bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
        >
          + Importer des logs
        </Link>
      </section>

      {/* Erreurs Supabase */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-700">
            Certaines données n'ont pas pu être chargées.
          </h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error?.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistiques */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Vue générale
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Fichiers importés"
            value={imports}
            icon="📁"
            color="border-blue-500"
          />

          <StatCard
            title="Événements"
            value={events}
            icon="📊"
            color="border-purple-500"
          />

          <StatCard
            title="Alertes ouvertes"
            value={openAlerts}
            icon="🔔"
            color="border-orange-500"
          />

          <StatCard
            title="Alertes critiques"
            value={criticalAlerts}
            icon="🚨"
            color="border-red-500"
          />

        </div>
      </section>

      {/* Dernières alertes */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Dernières alertes
            </h2>
            <p className="text-sm text-gray-500">
              Les cinq alertes les plus récentes
            </p>
          </div>

          <Link
            href="/alerts"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {alerts.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            Aucune alerte enregistrée pour le moment.
          </p>
        ) : (
          <div className="divide-y">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {alert.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {ruleLabel[alert.rule] ?? alert.rule}
                    {" · "}
                    {formatDate(alert.created_at)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Statut : {statusLabel[alert.status] ?? alert.status}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    severityStyle[alert.severity] ??
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {severityLabel[alert.severity] ?? alert.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Derniers imports */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Derniers imports
            </h2>
            <p className="text-sm text-gray-500">
              Vos fichiers de journaux récemment importés
            </p>
          </div>

          <Link
            href="/imports"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {recentImports.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            Aucun fichier importé pour le moment.
          </p>
        ) : (
          <div className="divide-y">
            {recentImports.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.file_format.toUpperCase()}
                    {" · "}
                    {item.total_lines} lignes
                    {" · "}
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item.status === "analyzed"
                    ? "Analysé"
                    : item.status === "failed"
                    ? "Échec"
                    : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions rapides */}
      <section className="rounded-xl bg-gray-900 p-6 text-white">
        <h2 className="text-xl font-bold">
          Protégez votre infrastructure
        </h2>

        <p className="mt-2 text-sm text-gray-300">
          Importez vos journaux de connexion pour détecter
          les comportements suspects et les menaces potentielles.
        </p>

        <Link
          href="/imports"
          className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-200"
        >
          Commencer une analyse →
        </Link>
      </section>

    </main>
  )
}



