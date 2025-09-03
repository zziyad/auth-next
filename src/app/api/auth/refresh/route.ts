import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST() {
  const cookieHeader = cookies().toString()
  const h = new Headers({ "X-Requested-With": "XMLHttpRequest" })
  if (cookieHeader) h.set("cookie", cookieHeader)

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: h,
    cache: "no-store",
    credentials: "include",
  })

  const text = await res.text()
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } })
}


