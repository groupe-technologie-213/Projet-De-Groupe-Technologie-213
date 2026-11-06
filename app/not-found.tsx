import Link from "next/link"

// TODO (Membre 4) : page 404
export default function NotFound() {
  return (
    <div>
      <h1>Page introuvable</h1>
      <Link href="/">Retour à l&apos;accueil</Link>
    </div>
  )
}
