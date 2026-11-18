import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SeverityBadge from "@/components/alerts/SeverityBadge";
import StatusForm from "@/components/alerts/StatusForm";
import DeleteAlertButton from "./deleteAlertButton";
import { updateAlertNotes } from "../actions";
import NotesForm from "@/components/alerts/NotesForm";

type Props = {
  params: Promise<{ id: string }>;
};
const statusStyles: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  investigating: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  false_positive: "bg-gray-100 text-gray-700",
};
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
  manual: "Alerte manuelle",
};

function formatDate(date: string | null) {
  if (!date) return "Non renseignée";

  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8">
        <p>Vous devez être connecté pour consulter cette alerte.</p>
      </div>
    );
  }

  const { data: alert, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !alert) {
    notFound();
  }

  // Chronologie construite à partir des dates déjà disponibles.
 const securityEvents = [
  {
    id: "first_seen",
    title: "Première détection",
    description: "Première apparition de l'événement détecté.",
    date: alert.first_seen,
  },
  {
    id: "last_seen",
    title: "Dernière détection",
    description: "Dernière apparition connue de l'événement détecté.",
    date: alert.last_seen,
  },
]
  .filter((event) => event.date)
  .sort(
    (a, b) =>
      new Date(b.date!).getTime() - new Date(a.date!).getTime()
  );

const alertEvents = [
  {
    id: "created",
    title: "Alerte créée",
    description: "L'alerte a été enregistrée dans LogSentinel.",
    date: alert.created_at,
    icon: "+",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "updated",
    title: "Dernière modification",
    description: `Statut actuel : ${
      statusLabels[alert.status] || alert.status
    }.`,
    date: alert.updated_at,
    icon: "↻",
    color: "bg-green-100 text-green-700",
  },
]
  .filter((event) => event.date)
  .sort(
    (a, b) =>
      new Date(b.date!).getTime() - new Date(a.date!).getTime()
  );

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/alerts"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Retour aux alertes
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Détail de l'alerte
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Identifiant : {alert.id}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              statusStyles[alert.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabels[alert.status] || alert.status}
          </span>

          
          <StatusForm
  alertId={alert.id}
  currentStatus={alert.status}
/>
        </div>
      </div>

      {/* Informations principales */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {alert.title}
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {alert.explanation || "Aucune explication disponible."}
            </p>
          </div>

         
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-500">
              Gravité
            </span>

            <SeverityBadge severity={alert.severity} />

            <span className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm text-gray-700">
              {ruleLabels[alert.rule] || alert.rule}
            </span>
          </div>
        </div> 
      </section>

      {/* Statistiques */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Nombre d'événements</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {alert.event_count ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Première détection</p>
          <p className="mt-2 font-semibold text-gray-900">
            {formatDate(alert.first_seen)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Dernière détection</p>
          <p className="mt-2 font-semibold text-gray-900">
            {formatDate(alert.last_seen)}
          </p>
        </div>
      </section>

      {/* Utilisateurs concernés */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Utilisateurs concernés
        </h2>

        {alert.usernames?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {alert.usernames.map((username: string) => (
              <span
                key={username}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700"
              >
                {username}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun utilisateur renseigné.
          </p>
        )}
      </section>

      {/* Adresses IP */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Adresses IP impliquées
        </h2>

        {alert.source_ips?.length > 0 ? (
          <div className="space-y-2">
            {alert.source_ips.map((ip: string) => (
              <div
                key={ip}
                className="rounded-lg bg-gray-50 px-4 py-3 font-mono text-sm text-gray-700"
              >
                {ip}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune adresse IP renseignée.
          </p>
        )}
      </section>

      {/* Informations complémentaires */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Informations complémentaires
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Date de création</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(alert.created_at)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Dernière modification</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(alert.updated_at)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Import associé</p>
            <p className="mt-1 font-medium text-gray-900">
              {alert.import_id || "Aucun import associé"}
            </p>
          </div>
        </div>

<div className="mt-6 border-t pt-4">
  <h3 className="mb-3 text-sm font-semibold text-gray-900">
    Notes de l'analyste
  </h3>

  <NotesForm
    alertId={alert.id}
    initialNotes={alert.notes}
  />
</div>
      </section>

      {/* Chronologie visuelle */}
     <section className="rounded-xl border bg-white p-6 shadow-sm">
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-900">
      Chronologie de l'alerte
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Consultez les détections et les modifications de cette alerte.
    </p>
  </div>

  {/* Événements de sécurité */}
  <div className="mb-8">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 className="font-semibold text-gray-900">
        Événements de sécurité
      </h3>
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Détection
      </span>
    </div>

    {securityEvents.length === 0 ? (
      <p className="text-sm text-gray-500">
        Aucune date de détection disponible.
      </p>
    ) : (
      <div className="space-y-5">
        {securityEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            <div className="relative flex flex-col items-center">
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                !
              </div>
              {index !== securityEvents.length - 1 && (
                <div className="absolute top-10 h-full w-px bg-blue-200" />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-2">
              <h4 className="font-semibold text-gray-900">
                {event.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                {event.description}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="mb-8 border-t" />

  {/* Modifications de l'alerte */}
  <div>
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 className="font-semibold text-gray-900">
        Modifications de l'alerte
      </h3>
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Gestion
      </span>
    </div>

    {alertEvents.length === 0 ? (
      <p className="text-sm text-gray-500">
        Aucune modification disponible.
      </p>
    ) : (
      <div className="space-y-5">
        {alertEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            <div className="relative flex flex-col items-center">
              <div
                className={`z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${event.color}`}
              >
                {event.icon}
              </div>
              {index !== alertEvents.length - 1 && (
                <div className="absolute top-10 h-full w-px bg-gray-200" />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-2">
              <h4 className="font-semibold text-gray-900">
                {event.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                {event.description}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>

      {/* Actions */}
      <div className="flex flex-wrap items-start gap-3">
        <Link
          href="/alerts"
          className="rounded-lg border px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Retour à la liste
        </Link>

        <DeleteAlertButton alertId={alert.id} />
      </div>
    </div>
  );
}


