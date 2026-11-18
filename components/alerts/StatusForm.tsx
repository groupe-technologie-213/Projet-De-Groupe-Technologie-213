import { updateAlertStatus } from "@/app/(app)/alerts/actions"

type StatusFormProps = {
  alertId: string
  currentStatus: string
}

export default function StatusForm({
  alertId,
  currentStatus,
}: StatusFormProps) {
  return (
    <form
      action={updateAlertStatus}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        type="hidden"
        name="alert_id"
        value={alertId}
      />

      <select
        name="status"
        defaultValue={currentStatus}
        aria-label="Nouveau statut de l'alerte"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="open">Ouverte</option>
        <option value="investigating">En investigation</option>
        <option value="resolved">Résolue</option>
        <option value="false_positive">Faux positif</option>
      </select>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Modifier le statut
      </button>
    </form>
  )
}