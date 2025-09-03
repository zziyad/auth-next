import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST(request: Request) {
  const cookieHeader = cookies().toString()
  const upstreamHeaders = new Headers({
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  })
  if (cookieHeader) upstreamHeaders.set("cookie", cookieHeader)

  const body = await request.text()

  const res = await fetch(`${API_BASE_URL}/api`, {
    method: "POST",
    headers: upstreamHeaders,
    body,
    cache: "no-store",
    credentials: "include",
  })

  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}


