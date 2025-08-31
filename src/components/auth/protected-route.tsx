"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
	children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login")
		}
	}, [isLoading, isAuthenticated, router])

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

	if (!isAuthenticated) {
		return null
	}

	return <>{children}</>
}
