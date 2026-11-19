/**
 * The message to show for a failed API call. The backend sends readable messages for business-rule failures
 * (e.g. "3 vendors use this category"), but axios's own `error.message` is only "Request failed with status code 409".
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const response = (error as { response?: { data?: { message?: unknown; error?: unknown } } } | undefined)?.response
  const message = response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (Array.isArray(message) && message.length) return message.filter((m) => typeof m === 'string').join(', ')
  const nested = response?.data?.error
  if (typeof nested === 'string' && nested.trim()) return nested
  if (error instanceof Error && error.message) return error.message
  return fallback
}
