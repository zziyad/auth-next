"use client"

import { Button } from "@/components/ui/button"
import { LogOut, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ClientActions() {
	const { logout, refreshUser } = useAuth()
	const router = useRouter()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const handleTestRefresh = async () => {
		setIsRefreshing(true)
		try {
			await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include',
				headers: { 'X-Requested-With': 'XMLHttpRequest' },
			})
			router.refresh()
		} finally {
			setIsRefreshing(false)
		}
	}

	return (
		<>
			<Button variant="outline" size="sm" onClick={refreshUser}>
				<RefreshCw className="h-4 w-4 mr-2" />
				Refresh
			</Button>
			<Button variant="outline" size="sm" onClick={handleTestRefresh} disabled={isRefreshing}>
				<RefreshCw className="h-4 w-4 mr-2" />
				Test Refresh
			</Button>
			<Button variant="outline" size="sm" onClick={logout}>
				<LogOut className="h-4 w-4 mr-2" />
				Logout
			</Button>
		</>
	)
}


