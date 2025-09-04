"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function SessionGuard() {
	const ran = useRef(false)
	const router = useRouter()

	useEffect(() => {
		if (ran.current) return
		ran.current = true

		const check = async () => {
			try {
				const meBody = { type: 'call', id: 'guard', method: 'auth/me', args: {} }
				const me = await fetch('/api/rpc', {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
					body: JSON.stringify(meBody),
				})
				if (me.status === 401) {
					const refresh = await fetch('/api/auth/refresh', {
						method: 'POST',
						credentials: 'include',
						headers: { 'X-Requested-With': 'XMLHttpRequest' },
					})
					if (refresh.ok) router.refresh()
				}
			} catch {}
		}

		check()
	}, [router])

	return null
}


