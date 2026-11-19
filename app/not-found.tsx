import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 text-7xl">🛡️</div>

      <h1 className="text-6xl font-bold text-gray-900">
        404
      </h1>

      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Page introuvable
      </h2>

      <p className="mt-3 max-w-md text-gray-500">
        Désolé, la page que vous recherchez n'existe pas
        ou a été déplacée.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
