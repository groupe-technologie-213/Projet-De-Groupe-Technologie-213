export function safeRedirect(path: string | null | undefined, fallback: string = "/dashboard") {
  if (!path) return fallback

  if (!path.startsWith("/")) return fallback

  if (path.startsWith("//")) return fallback

  if (path.startsWith("/\\")) return fallback

  return path
}