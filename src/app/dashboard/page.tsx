import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Mail, Calendar, Shield } from "lucide-react"
import { requireUser, callRpc } from "@/lib/server/session"
import ClientActions from "./client-actions"
import SessionGuard from "@/components/session-guard"

export default async function DashboardPage() {
	const user = await requireUser()
	// SSR test: fetch event list using only access cookie (refresh filtered)
	let events: unknown[] = []
	try {
		events = await callRpc<unknown[]>("event/list", {})
	} catch (e) {
		// keep empty on failure
	}

	return (
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<header className="bg-white shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center h-16">
							<h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
							<ClientActions />
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
					<SessionGuard />
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* User Info Card */}
						<Card className="lg:col-span-1">
							<CardHeader>
								<CardTitle className="flex items-center">
									<User className="h-5 w-5 mr-2" />
									User Information
								</CardTitle>
								<CardDescription>
									Your account details and profile information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center space-x-3">
									<Mail className="h-4 w-4 text-gray-500" />
									<div>
										<p className="text-sm font-medium text-gray-900">{user.email}</p>
										<p className="text-xs text-gray-500">Email Address</p>
									</div>
								</div>
								
								{user.firstName && (
									<div className="flex items-center space-x-3">
										<User className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm font-medium text-gray-900">
												{user.firstName} {user.lastName}
											</p>
											<p className="text-xs text-gray-500">Full Name</p>
										</div>
									</div>
								)}

								{user.role && (
									<div className="flex items-center space-x-3">
										<Shield className="h-4 w-4 text-gray-500" />
										<div>
											<Badge variant="secondary">{user.role}</Badge>
											<p className="text-xs text-gray-500 mt-1">User Role</p>
										</div>
									</div>
								)}

								{user.createdAt && typeof user.createdAt === "string" && (
									<div className="flex items-center space-x-3">
										<Calendar className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm font-medium text-gray-900">
												{new Date(user.createdAt).toLocaleDateString()}
											</p>
											<p className="text-xs text-gray-500">Member Since</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Raw Data Card */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Raw User Data</CardTitle>
								<CardDescription>
									Complete user data from the server response
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="bg-gray-50 rounded-lg p-4">
									<pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
										{JSON.stringify(user, null, 2)}
									</pre>
								</div>
							</CardContent>
						</Card>

						{/* Events (SSR fetched via RPC) */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Events (SSR)</CardTitle>
								<CardDescription>
									Fetched server-side from <code>event/list</code> with access cookie only
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="bg-gray-50 rounded-lg p-4">
									<pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
										{JSON.stringify(events, null, 2)}
									</pre>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Permissions Section */}
					{user.permissions && user.permissions.length > 0 && (
						<Card className="mt-6">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Shield className="h-5 w-5 mr-2" />
									User Permissions
								</CardTitle>
								<CardDescription>
									Your current permissions and access levels
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{user.permissions.map((permission, index) => (
										<Badge key={index} variant="outline">
											{permission}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</main>
			</div>
	)
}
