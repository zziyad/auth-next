import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
	// Enforce POST-only under /api and /auth/refresh-and-return (our handlers are GET/POST as designed)
	const path = req.nextUrl.pathname
	if (path.startsWith('/api') && req.method !== 'POST') {
		return new NextResponse('Method Not Allowed', { status: 405 })
	}
	return NextResponse.next()
}

export const config = {
	matcher: ['/api/:path*'],
}


