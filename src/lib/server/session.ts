import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
  permissions?: string[]
  createdAt?: string
  [key: string]: string | string[] | undefined
}

function mergeCookieHeaders(baseHeader: string, setCookieHeader: string | null): string {
  if (!setCookieHeader) return baseHeader
  const map = new Map<string, string>()
  // seed from base
  baseHeader.split(';').map(s => s.trim()).filter(Boolean).forEach(pair => {
    const eq = pair.indexOf('=')
    if (eq > 0) map.set(pair.slice(0, eq), pair.slice(eq + 1))
  })
  // extract name=value from Set-Cookie (multiple entries collapsed)
  const re = /(^|,\s*)([^=;\s,]+)=([^;]+)/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while (m = re.exec(setCookieHeader)) {
    const name = m[2]
    const value = m[3]
    map.set(name, value)
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function serverFetch(input: string, init: RequestInit = {}, opts?: { includeRefreshCookie?: boolean, cookieHeaderOverride?: string }) {
  const cookieStore = await cookies()
  const forwarded = cookieStore
    .getAll()
    // do not forward refresh cookies on generic RPC calls unless explicitly enabled
    .filter(c => opts?.includeRefreshCookie ? true : !/refresh/i.test(c.name))
    .map(c => `${c.name}=${c.value}`)
    .join('; ')
  const headers = new Headers(init.headers)
  headers.set("X-Requested-With", "XMLHttpRequest")
  const cookieHeader = opts?.cookieHeaderOverride || forwarded
  if (cookieHeader) headers.set("cookie", cookieHeader)

  return fetch(input, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "include",
  })
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const body = { type: "call", id: "ssr", method: "auth/me", args: {} }
    const res = await serverFetch(`${API_BASE_URL}/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      // For SSR path, redirect the browser to refresh-and-return so cookies are updated client-side
      redirect(`/auth/refresh-and-return?to=${encodeURIComponent('/')}`)
    }
    const data = await res.json() as { result?: { status?: string, response?: User } }
    if (data?.result?.status !== "success") return null
    return data.result!.response as User
  } catch {
    return null
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function callRpc<T = unknown>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  const body = { type: 'call', id: 'ssr', method, args }
  const res = await serverFetch(`${API_BASE_URL}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Upstream error ${res.status}`)
  const data = await res.json() as { result?: { status?: string, response?: T } }
  const status = data?.result?.status
  if (status !== 'fulfilled' && status !== 'success') throw new Error('Request rejected')
  return (data.result?.response as T)
}


