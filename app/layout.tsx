import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LogSentinel",
  description: "Analyse de journaux de connexion et détection de comportements suspects",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
