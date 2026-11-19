type StatCardProps = {
  title: string
  value: number
  icon: string
  color?: string
}

export function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 ${
        color ? `border-l-4 ${color}` : ""
      } bg-white p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <span className="text-2xl">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-gray-900">
        {value.toLocaleString("fr-FR")}
      </p>

      {color && (
        <p className="mt-1 text-xs text-gray-400">
          Données de votre compte
        </p>
      )}
    </div>
  )
}