import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const baseHeaders = {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  }
  const upstreamHeaders = new Headers(baseHeaders)
  if (cookieHeader) upstreamHeaders.set("cookie", cookieHeader)

  const originalBody = await request.text()

  const forward = async () => fetch(`${API_BASE_URL}/api`, {
    method: "POST",
    headers: upstreamHeaders,
    body: originalBody,
    cache: "no-store",
    credentials: "include",
  })

  let res = await forward()

  // If unauthorized, try refresh then retry
  if (res.status === 401) {
    const refreshHeaders = new Headers({ "X-Requested-With": "XMLHttpRequest" })
    if (cookieHeader) refreshHeaders.set("cookie", cookieHeader)
    const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: refreshHeaders,
      cache: "no-store",
      credentials: "include",
    })

    const refreshSetCookie = refreshRes.headers.get("set-cookie")
    if (refreshRes.ok) {
      const data = await refreshRes.json().catch(() => null) as unknown as { result?: { status?: string } } | null
      if (data?.result?.status === 'refreshed') {
        // retry original
        res = await forward()
        const text = await res.text()
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        const retrySetCookie = res.headers.get("set-cookie")
        const combined = [refreshSetCookie, retrySetCookie].filter(Boolean).join(", ")
        if (combined) headers["set-cookie"] = combined
        return new Response(text, { status: res.status, headers })
      }
    }
    // refresh failed, return original 401
    const text401 = await res.text()
    return new Response(text401, { status: res.status, headers: { "Content-Type": "application/json" } })
  }

  const text = await res.text()
  const setCookie = res.headers.get("set-cookie")
  const outHeaders: Record<string,string> = { "Content-Type": "application/json" }
  if (setCookie) outHeaders["set-cookie"] = setCookie
  return new Response(text, { status: res.status, headers: outHeaders })
}


