import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST() {
  const cookieHeader = cookies().toString()
  const h = new Headers()
  h.set("X-Requested-With", "XMLHttpRequest")
  if (cookieHeader) h.set("cookie", cookieHeader)

  const body = { type: "call", id: "next", method: "auth/me", args: {} }
  const res = await fetch(`${API_BASE_URL}/api`, {
    method: "POST",
    headers: { ...Object.fromEntries(h), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
  })

  const text = await res.text()
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } })
}


