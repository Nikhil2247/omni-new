export const getSafeReturnUrl = (returnUrl?: string | null): string | null => {
  if (!returnUrl) return null

  let decoded = returnUrl
  try {
    decoded = decodeURIComponent(returnUrl)
  } catch {
    decoded = returnUrl
  }

  const trimmed = decoded.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null

  return trimmed
}
