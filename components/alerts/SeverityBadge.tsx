type SeverityBadgeProps = {
  severity: string
}

const severityStyles: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

const severityLabels: Record<string, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
}

export default function SeverityBadge({
  severity,
}: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        severityStyles[severity] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {severityLabels[severity] ?? severity}
    </span>
  )
}