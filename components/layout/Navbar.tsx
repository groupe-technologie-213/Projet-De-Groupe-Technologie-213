"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/app/(auth)/actions"

// Pages principales de l'application
const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/imports", label: "Imports" },
  { href: "/alerts", label: "Alertes" },
]

type NavbarProps = {
  email: string
}

export function Navbar({ email }: NavbarProps) {
  const pathname = usePathname()
 
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          LogSentinel
        </Link>

        <ul className="flex gap-1">
          {LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </nav>
    </header>
  )
}