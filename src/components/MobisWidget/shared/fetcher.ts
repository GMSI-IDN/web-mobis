export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postJSON<T>(
  url: string,
  body: any,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(extraHeaders ?? {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const message = data?.error || data?.message || `HTTP ${res.status}`
    const error = new Error(message)
    ;(error as any).data = data
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

