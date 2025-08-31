"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { mapAuthErrorCode } from "@/lib/auth-errors"
import { useRouter } from "next/navigation"

interface User {
	id: string
	email: string
	firstName?: string
	lastName?: string
	role?: string
	permissions?: string[]
	[key: string]: string | string[] | undefined
}

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (email: string, password: string) => Promise<boolean>
	logout: () => void
	refreshUser: () => Promise<void>
	refreshTokens: () => Promise<boolean>
	lastErrorCode?: string
	lastErrorMessage?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Security-focused client constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"
let refreshInFlight: Promise<boolean> | null = null
let globalAbortController: AbortController | null = null
const getGlobalSignal = () => {
  if (!globalAbortController) globalAbortController = new AbortController()
  return globalAbortController.signal
}
const resetGlobalAbort = () => {
  try { globalAbortController?.abort() } catch {}
  globalAbortController = new AbortController()
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [lastErrorCode, setLastErrorCode] = useState<string | undefined>(undefined)
	const [lastErrorMessage, setLastErrorMessage] = useState<string | undefined>(undefined)
	const refreshOwner = useRef(false)
	const bcRef = useRef<BroadcastChannel | null>(null)
	const router = useRouter()

	useEffect(() => {
		// Inter-tab logout sync
		const bc = new BroadcastChannel('auth')
		bc.onmessage = (e) => {
			if (e?.data === 'logout') {
				setUser(null)
				resetGlobalAbort()
				router.push('/login')
			}
		}
		bcRef.current = bc
		checkAuthStatus()
		return () => {
			try { bc.close() } catch {}
			bcRef.current = null
		}
	}, [])

	// Create a fetch wrapper with automatic token refresh
	const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
		const baseHeaders: Record<string, string> = {
			'X-Requested-With': 'XMLHttpRequest',
		}
		const headers = {
			...baseHeaders,
			...(options.headers as Record<string, string> | undefined),
		}

		const response = await fetch(url, {
			...options,
			headers,
			credentials: "include",
			signal: options.signal || getGlobalSignal(),
		})

		// Handle 401 with single-flight refresh and retry
		if (response.status === 401 && user) {
			try {
				if (!refreshInFlight) {
					refreshOwner.current = true
					setIsRefreshing(true)
					refreshInFlight = performRefresh()
				}
				const ok = await refreshInFlight
				if (refreshOwner.current) {
					refreshInFlight = null
					refreshOwner.current = false
					setIsRefreshing(false)
				}
				if (ok) {
					return fetch(url, {
						...options,
						headers,
						credentials: 'include',
						signal: options.signal || getGlobalSignal(),
					})
				}
				// refresh failed -> force logout
				await logout()
			} catch (e) {
				await logout()
			}
		}

		// Handle 429 with optional backoff and single retry
		if (response.status === 429) {
			const ra = response.headers.get('Retry-After')
			const delaySec = ra ? parseInt(ra, 10) : 0
			setLastErrorCode('RATE_LIMITED')
			setLastErrorMessage(mapAuthErrorCode('RATE_LIMITED'))
			if (Number.isFinite(delaySec) && delaySec > 0 && delaySec <= 10) {
				await sleep(delaySec * 1000)
				return fetch(url, {
					...options,
					headers,
					credentials: 'include',
					signal: options.signal || getGlobalSignal(),
				})
			}
		}

		return response
	}

	const checkAuthStatus = async () => {
		try {
			// Try to get user data from /me endpoint
			const userData = await fetchUserData()
			if (userData) {
				setUser(userData)
			}
		} catch (error) {
			console.error("Failed to check auth status:", error)
			// Try to refresh tokens if available
			const refreshSuccess = await refreshTokens()
			if (!refreshSuccess) {
				// Clear any stale data
				setUser(null)
			}
		} finally {
			setIsLoading(false)
		}
	}

	const fetchUserData = async (): Promise<User | null> => {
		try {
			const requestBody = { type: 'call', id: '1', method: 'auth/me', args: {} }
			
			const res = await authenticatedFetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			})

			if (res.ok) {
				const data = await res.json()
				if (data.result && data.result.status === 'success') {
					return data.result.response
				}
			}
			return null
		} catch (error) {
			console.error("Failed to fetch user data:", error)
			return null
		}
	}

	const performRefresh = async (): Promise<boolean> => {
		try {
			const requestBody = { type: 'call', id: '1', method: 'auth/refresh', args: {} }
			
			// Use bare fetch here to avoid recursion on 401 handling
			const res = await fetch(API_URL, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
				body: JSON.stringify(requestBody),
				signal: getGlobalSignal(),
			})

			if (res.ok) {
				const data = await res.json()
				if (data.result && data.result.status === 'refreshed') {
					// Update user data after successful refresh
					const userData = await fetchUserData()
					if (userData) {
						setUser(userData)
						return true
					}
				}
			}
			return false
		} catch (error) {
			console.error("Failed to refresh tokens:", error)
			return false
		}
	}

	const refreshTokens = async (): Promise<boolean> => {
		if (!refreshInFlight) {
			refreshOwner.current = true
			setIsRefreshing(true)
			refreshInFlight = performRefresh()
		}
		const ok = await refreshInFlight
		if (refreshOwner.current) {
			refreshInFlight = null
			refreshOwner.current = false
			setIsRefreshing(false)
		}
		return ok
	}

	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			// do not log credentials
			const requestBody = { type: 'call', id: '1', method: 'auth/signin', args: { email, password } }
			const res = await authenticatedFetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			})
			const data = await res.json()
			
			if (res.ok && data.result && data.result.status === 'logged') {
				// Get user data from /me endpoint instead of storing response
				const userData = await fetchUserData()
				if (userData) {
					setUser(userData)
					return true
				}
			} else {
				const fallbackCode = res.status === 429 ? 'RATE_LIMITED' : undefined
				const code = data?.error?.code || fallbackCode
				console.error('Login failed:', code || data)
				if (code) {
					setLastErrorCode(code)
					setLastErrorMessage(mapAuthErrorCode(code))
				}
				return false
			}
		} catch (error) {
			console.error("Login failed with error:", error)
			return false
		}
		return false
	}

	const logout = async () => {
		try {
			// Call logout endpoint to invalidate session
			const requestBody = { type: 'call', id: '1', method: 'auth/logout', args: {} }
			
			await authenticatedFetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			})
		} catch (error) {
			console.error("Logout request failed:", error)
		} finally {
			// Clear user state regardless of server response
			setUser(null)
			try { bcRef.current?.postMessage('logout') } catch {}
			resetGlobalAbort()
			router.push("/login")
		}
	}

	const refreshUser = async () => {
		await checkAuthStatus()
	}

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user,
		isLoading,
		login,
		logout,
		refreshUser,
		refreshTokens,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
