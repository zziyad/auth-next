"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface PublicRouteProps {
	children: React.ReactNode
	redirectTo?: string
}

export default function PublicRoute({ children, redirectTo = "/dashboard" }: PublicRouteProps) {
	const { isAuthenticated, isLoading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.push(redirectTo)
		}
	}, [isLoading, isAuthenticated, router, redirectTo])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	if (isAuthenticated) {
		return null
	}

	return <>{children}</>
}
