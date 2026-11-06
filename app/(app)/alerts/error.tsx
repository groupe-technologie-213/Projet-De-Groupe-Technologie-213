"use client"

// TODO (Membre 4) : message d'erreur clair
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>Une erreur est survenue.</p>
      <button onClick={() => reset()}>Réessayer</button>
    </div>
  )
}
