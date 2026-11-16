import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    severity?: string;
    status?: string;
    rule?: string;
    search?: string;
    period?: string;
    ip?: string
  }>;
};

export default async function AlertsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const params = await searchParams;

  const severity = params.severity ?? "";
  const status = params.status ?? "";
  const rule = params.rule ?? "";
  const search = params.search?.trim() ?? "";
  const ip = params.ip?.trim() ?? ""
  const period = params.period ?? "";

  // Vérifier la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Veuillez vous connecter pour consulter vos alertes.
      </div>
    );
  }

  // Récupération des statistiques globales
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
  ]);

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
    .order("created_at", { ascending: false });

  // Filtre par gravité
  if (["low", "medium", "high", "critical"].includes(severity)) {
    query = query.eq("severity", severity);
  }

  // Filtre par statut
  if (
    ["open", "investigating", "resolved", "false_positive"].includes(status)
  ) {
    query = query.eq("status", status);
  }

  // Filtre par règle
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
    query = query.eq("rule", rule);
  }

  // Filtre par période
  const periodDurations: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  if (periodDurations[period]) {
    const cutoffDate = new Date(
      Date.now() - periodDurations[period]
    ).toISOString();

    query = query.gte("created_at", cutoffDate);
  }

  // Recherche par titre
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }
  // Recherche par IP
  if (ip) {
  query = query.contains("source_ips", [ip])
}

  const { data: alerts, error } = await query;

  // Libellés des gravités
  const severityLabels: Record<string, string> = {
    low: "Faible",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  };

  const severityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  // Libellés des statuts
  const statusLabels: Record<string, string> = {
    open: "Ouverte",
    investigating: "En investigation",
    resolved: "Résolue",
    false_positive: "Faux positif",
  };

  const ruleLabels: Record<string, string> = {
    brute_force: "Force brute",
    password_spraying: "Password spraying",
    impossible_travel: "Déplacement impossible",
    off_hours: "Connexion hors horaires",
    new_ip: "Nouvelle adresse IP",
    manual: "Manuelle",
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });

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

      {/* Statistiques globales */}
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
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Rechercher et filtrer
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Combine plusieurs critères pour retrouver rapidement une alerte.
          </p>
        </div>

        <form
          action="/alerts"
          method="GET"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {/* Recherche */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Recherche
            </label>
            <input
              id="search"
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Rechercher une alerte..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >Recherche par IP</label>
            <input
              type="text"
              name="ip"
             defaultValue={ip}
             placeholder="Ex. : 192.168.1.10"
             aria-label="Rechercher par adresse IP"
             className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
/>
          </div>

          {/* Gravité */}
          <div>
            <label
              htmlFor="severity"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Gravité
            </label>
            <select
              id="severity"
              name="severity"
              defaultValue={severity}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="">Toutes les gravités</option>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="open">Ouverte</option>
              <option value="investigating">En investigation</option>
              <option value="resolved">Résolue</option>
              <option value="false_positive">Faux positif</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <label
              htmlFor="period"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Période de création
            </label>
            <select
              id="period"
              name="period"
              defaultValue={period}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="">Toutes les périodes</option>
              <option value="24h">Dernières 24 heures</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </select>
          </div>

          {/* Règle */}
          <div>
            <label
              htmlFor="rule"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Type de détection
            </label>
            <select
              id="rule"
              name="rule"
              defaultValue={rule}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="">Toutes les règles</option>
              <option value="brute_force">Force brute</option>
              <option value="password_spraying">Password spraying</option>
              <option value="impossible_travel">Déplacement impossible</option>
              <option value="off_hours">Connexion hors horaires</option>
              <option value="new_ip">Nouvelle adresse IP</option>
              <option value="manual">Manuelle</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Appliquer les filtres
            </button>

            <Link
              href="/alerts"
              className="rounded-lg border px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Réinitialiser
            </Link>
          </div>
        </form>
      </section>

      {/* Tableau des alertes */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-2 border-b p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Liste des alertes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {alerts?.length ?? 0} résultat(s) trouvé(s)
            </p>
          </div>

          {(severity || status || rule || search || period) && (
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Filtres actifs
            </span>
          )}
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
            <Link
              href="/alerts"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Effacer les filtres
            </Link>
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
                    className="transition hover:bg-gray-50"
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
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
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
  );
}

