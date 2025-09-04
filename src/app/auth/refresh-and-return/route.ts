import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('to') || '/'

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const headers = new Headers({ "X-Requested-With": "XMLHttpRequest" })
  if (cookieHeader) headers.set("cookie", cookieHeader)

  // Call backend refresh (POST)
  const upstream = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers,
    cache: 'no-store',
    credentials: 'include',
  })

  const setCookie = upstream.headers.get('set-cookie')
  if (upstream.ok) {
    let ok = false
    try {
      const json = await upstream.json() as { result?: { status?: string } }
      ok = json?.result?.status === 'refreshed'
    } catch {}
    if (ok) {
      const res = NextResponse.redirect(new URL(returnTo, request.url), 303)
      if (setCookie) res.headers.set('set-cookie', setCookie)
      return res
    }
  }

  // Refresh failed -> go to login
  const fail = NextResponse.redirect(new URL('/login', request.url), 303)
  if (setCookie) fail.headers.set('set-cookie', setCookie)
  return fail
}


