import Link from "next/link"
import { GithubButton } from "@/components/auth/GithubButton"


const ERROR_MESSAGES: Record<string, string> = {
  github: "La connexion avec GitHub a échoué. Réessaie.",
  callback: "Le lien de connexion est invalide ou a expiré. Reconnecte-toi.",
}

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo, error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Connexion</h1>
          <p className="text-sm text-gray-500">Accède à ton espace LogSentinel</p>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <GithubButton redirectTo={redirectTo} />

        <p className="text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-gray-900 underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  )
}