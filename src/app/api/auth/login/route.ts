import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export async function POST(request: Request) {
	const formData = await request.formData()
	const email = String(formData.get("email") || "")
	const password = String(formData.get("password") || "")

	const cookieStore = await cookies()
	const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
	const headers = new Headers({
		"X-Requested-With": "XMLHttpRequest",
		"Content-Type": "application/json",
	})
	if (cookieHeader) headers.set("cookie", cookieHeader)

	const body = JSON.stringify({
		type: "call",
		id: "login",
		method: "auth/signin",
		args: { email, password },
	})

	const upstream = await fetch(`${API_BASE_URL}/api`, {
		method: "POST",
		headers,
		body,
		cache: "no-store",
		credentials: "include",
	})

	const text = await upstream.text()
	let json: any = null
	try { json = JSON.parse(text) } catch {}

	const setCookie = upstream.headers.get("set-cookie")

	if (json?.result?.status === "logged") {
		const res = NextResponse.redirect(new URL("/dashboard", request.url), 303)
		if (setCookie) res.headers.set("set-cookie", setCookie)
		return res
	}

	const res = new NextResponse(text || JSON.stringify({ error: "Login failed" }), {
		status: upstream.status,
		headers: { "Content-Type": "application/json" },
	})
	if (setCookie) res.headers.set("set-cookie", setCookie)
	return res
}


