import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAlert } from "../actions"

export default async function NewAlertPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Veuillez vous connecter pour créer une alerte.
      </div>
    )
  }

  // Récupérer les imports de l'utilisateur
  const { data: imports, error } = await supabase
    .from("log_imports")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  return (
    <main className="mx-auto max-w-4xl space-y-8">

      {/* En-tête */}
      <div>
        <Link
          href="/alerts"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Retour aux alertes
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Nouvelle alerte
        </h1>

        <p className="mt-2 text-gray-500">
          Déclarez manuellement un incident de sécurité.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Impossible de récupérer la liste des imports.
          {error.message}
        </div>
      )}

      {/* Formulaire */}
      <form action={createAlert} className="space-y-6">

        {/* Informations générales */}
        <section className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Informations générales
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Renseignez les informations principales de l'incident.
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Titre de l'alerte *
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="Ex : Tentative de connexion suspecte"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="explanation"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Description de l'incident *
            </label>

            <textarea
              id="explanation"
              name="explanation"
              required
              rows={5}
              maxLength={5000}
              placeholder="Décrivez le comportement suspect détecté..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="rule"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Type de menace *
              </label>

              <select
                id="rule"
                name="rule"
                required
                defaultValue="manual"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                <option value="manual">Alerte manuelle</option>
                <option value="brute_force">Attaque par force brute</option>
                <option value="password_spraying">Password spraying</option>
                <option value="impossible_travel">Déplacement impossible</option>
                <option value="off_hours">Connexion hors horaires</option>
                <option value="new_ip">Nouvelle adresse IP</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="severity"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Niveau de gravité *
              </label>

              <select
                id="severity"
                name="severity"
                required
                defaultValue="medium"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>

          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Statut de l'alerte
            </label>

            <select
              id="status"
              name="status"
              defaultValue="open"
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="open">Ouverte</option>
              <option value="investigating">En investigation</option>
              <option value="resolved">Résolue</option>
              <option value="false_positive">Faux positif</option>
            </select>
          </div>

        </section>

        {/* Informations techniques */}
        <section className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Informations techniques
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Précisez les comptes et les adresses IP concernés.
            </p>
          </div>

          <div>
            <label
              htmlFor="source_ips"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Adresses IP concernées
            </label>

            <textarea
              id="source_ips"
              name="source_ips"
              rows={3}
              placeholder={"192.168.1.10\n10.0.0.5"}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Une adresse IPv4 ou IPv6 par ligne, ou séparées par des virgules.
            </p>
          </div>

          <div>
            <label
              htmlFor="usernames"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Comptes utilisateurs concernés
            </label>

            <textarea
              id="usernames"
              name="usernames"
              rows={3}
              placeholder={"admin\njohn.doe"}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Un nom d'utilisateur par ligne.
            </p>
          </div>

          <div>
            <label
              htmlFor="import_id"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Fichier de logs associé
            </label>

            <select
              id="import_id"
              name="import_id"
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="">Aucun fichier associé</option>

              {imports?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

        </section>

        {/* Notes */}
        <section className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Notes complémentaires
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ajoutez des observations utiles à l'investigation.
            </p>
          </div>

          <textarea
            name="notes"
            rows={4}
            maxLength={5000}
            placeholder="Notes, observations, mesures prises..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />

        </section>

        {/* Boutons */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">

          <Link
            href="/alerts"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Enregistrer l'alerte
          </button>

        </div>

      </form>
    </main>
  )
}

