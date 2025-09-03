import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST(request: Request) {
  const cookieHeader = cookies().toString()
  const headers = new Headers({
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  })
  if (cookieHeader) headers.set("cookie", cookieHeader)

  const body = JSON.stringify({ type: "call", id: "logout", method: "auth/logout", args: {} })

  const upstream = await fetch(`${API_BASE_URL}/api`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
    credentials: "include",
  })

  const setCookie = upstream.headers.get("set-cookie")

  const res = NextResponse.redirect(new URL("/login", request.url), 303)
  if (setCookie) res.headers.set("set-cookie", setCookie)
  return res
}


