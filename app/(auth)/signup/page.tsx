import Link from "next/link"
import { GithubButton } from "@/components/auth/GithubButton"
import { SignupForm } from "@/components/auth/SignupForm"

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Créer un compte</h1>
          <p className="text-sm text-gray-500">Analyse tes journaux de connexion avec LogSentinel</p>
        </div>

        <SignupForm />

        <div className="flex items-center gap-3 text-xs uppercase text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          ou
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <GithubButton />

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}