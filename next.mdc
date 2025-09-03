## TRS Next.js Auth Architecture and SSR Recommendations

### Goals
- Secure, cookie-based authentication with your own backend
- Favor Server Components and SSR for fast, reliable initial loads
- Centralize fetch and error handling, minimize client state/effects

### Current State (observed)
- Client Auth Context in `src/contexts/auth-context.tsx` with:
  - Credentialed fetch with `X-Requested-With` header
  - Refresh flow with single-flight guard and BroadcastChannel logout
  - Global AbortController to cancel in-flight requests
- API request helpers in `src/lib/api-request.ts` wrapping `authenticatedFetch`
- Route wrappers `ProtectedRoute` and `PublicRoute` as client components
- Pages (e.g., `dashboard`) currently client-rendered

This is a solid client-side baseline with strong security primitives. To add SSR and reduce layout shifts/flash, move auth checks to the server where possible.

---

### Recommended Architecture (SSR-first)

1) Server-side Session Utilities
- Create `src/lib/server/session.ts` (RSC/Node runtime) to read cookies and call your backend.
- Forward incoming cookies to your backend, set `credentials: 'include'`, and include `X-Requested-With`.
- Export `getCurrentUser()` returning `User | null`.

2) SSR Route Protection Pattern
- Prefer server redirects instead of client wrappers.
- Example in a Server Component page:
  - Call `const user = await getCurrentUser()`
  - If falsy, `redirect('/login')` from `next/navigation`
  - Render page with `user` directly

3) Hydration-Friendly Client State
- Update `AuthProvider` to accept `initialUser?: User`.
- In `src/app/layout.tsx` (RSC), call `getCurrentUser()` and pass to `<AuthProvider initialUser={user}>`.
- In the provider, set initial state from `initialUser` to avoid extra client fetch on load.

4) Middleware (Optional)
- Add `middleware.ts` for coarse route gating using cookies or a lightweight `/me` ping.
- Use it if you need early redirects before page rendering. Be mindful of Edge runtime constraints.

---

### Fetch Strategy

Server (RSC / Route Handlers)
- Use a single helper for backend calls that:
  - Reads cookies via `next/headers`
  - Forwards cookies to your backend
  - Adds `X-Requested-With: XMLHttpRequest`
  - Uses `cache: 'no-store'` for auth-critical calls (e.g., `/me`)

Client
- Keep using `authenticatedFetch` from the Auth Context.
- Continue single-flight refresh and 401 retry.
- Use `apiRequest`/`useApiRequest` wrappers for consistent request shape.

---

### Security Hardening

Cookies
- HttpOnly, Secure, SameSite=Lax (or Strict where feasible)
- Scope refresh cookie path narrowly (e.g., `/api/auth/refresh`)
- Short-lived access cookie; longer-lived refresh cookie

Headers
- Always send `X-Requested-With: XMLHttpRequest`
- Add security headers in Next: CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options, X-Content-Type-Options

Backend
- Rate limit auth endpoints; exponential backoff for 429
- Strict CORS (allowlist Next origin in dev, same-origin in prod)
- Audit login/refresh/logout flows; invalidate refresh tokens on logout

CSRF
- For state-changing requests from the browser, pair SameSite cookies with `X-Requested-With`. If you support cross-site embeds or need stricter CSRF, add a double-submit token (cookie + header) on forms.

---

### Caching & Performance
- Use `export const dynamic = 'force-dynamic'` or `cache: 'no-store'` for authenticated pages/data
- Avoid caching personalized responses at the CDN/edge
- Static/public content can use `revalidate` or full static generation

---

### Error Handling & Validation
- Use Zod on the client and server helpers to validate backend responses
- Normalize error objects (401, 403, 429, 5xx) for consistent UI handling
- Consider logging to Sentry in `error.tsx` boundaries

---

### Example Stubs (recommended files)

`src/lib/server/session.ts`
```ts
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
  permissions?: string[]
}

async function serverFetch(input: string, init: RequestInit = {}) {
  const cookieHeader = cookies().toString()
  const h = new Headers(init.headers)
  h.set('X-Requested-With', 'XMLHttpRequest')
  if (cookieHeader) h.set('cookie', cookieHeader)

  return fetch(input, {
    ...init,
    headers: h,
    cache: 'no-store',
    credentials: 'include',
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const body = { type: 'call', id: 'ssr', method: 'auth/me', args: {} }
  const res = await serverFetch(`${API_BASE_URL}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data?.result?.status !== 'success') return null
  return data.result.response
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
```

`src/app/layout.tsx` (hydrate provider)
```tsx
import { AuthProvider } from '@/contexts/auth-context'
import { getCurrentUser } from '@/lib/server/session'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

`src/app/dashboard/page.tsx` (server component)
```tsx
import { requireUser } from '@/lib/server/session'

export default async function DashboardPage() {
  const user = await requireUser()
  return <div>Welcome, {user.email}</div>
}
```

`src/middleware.ts` (optional)
```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isProtected = req.nextUrl.pathname.startsWith('/dashboard')
  const hasSession = req.cookies.has('access_token')
  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
```

Note: If you want stricter gating than cookie presence, replace the cookie check with a very lightweight backend `/me` check from middleware (ensure your backend is reachable from the Edge runtime).

---

### Changes to Existing Code (high-level)
- `AuthProvider` props: add `initialUser?: User`, initialize state from it
- Convert protected pages to Server Components with server-side redirects
- Keep `ProtectedRoute/PublicRoute` as progressive enhancement for client-only areas
- Add security headers in `next.config.ts` via `headers()`

---

### Actionable Checklist
1. Add `src/lib/server/session.ts` with `serverFetch`, `getCurrentUser`, `requireUser`
2. Hydrate `AuthProvider` with `initialUser` from `layout.tsx`
3. Convert protected pages (e.g., `dashboard`) to server components using `requireUser`
4. (Optional) Add `middleware.ts` for early redirects
5. Add security headers in `next.config.ts`
6. Validate backend responses with Zod in both server/client utilities
7. Ensure cookies: HttpOnly, Secure, SameSite, path-scoped refresh
8. Keep client `authenticatedFetch` and `apiRequest` as-is for interactive flows

This setup leverages SSR for first paint, keeps client interactivity, and improves security by centralizing sensitive logic server-side while preserving your existing backend.

