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
  [key: string]: any
}

async function serverFetch(input: string, init: RequestInit = {}) {
  const cookieHeader = cookies().toString()
  const headers = new Headers(init.headers)
  headers.set("X-Requested-With", "XMLHttpRequest")
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
    if (!res.ok) return null
    const data = await res.json()
    if (data?.result?.status !== "success") return null
    return data.result.response
  } catch {
    return null
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}


