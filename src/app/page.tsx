"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
	const { isAuthenticated, isLoading } = useAuth()

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h1 className="text-xl font-semibold text-gray-900">TRS Auth System</h1>
						<nav className="flex items-center space-x-4">
							{!isLoading && (
								<>
									{!isAuthenticated ? (
										<>
											<Link href="/login">
												<Button variant="outline" size="sm">
													Sign In
												</Button>
											</Link>
											<Link href="/test-api">
												<Button variant="outline" size="sm">
													Test API
												</Button>
											</Link>
										</>
									) : (
										<>
											<Link href="/dashboard">
												<Button size="sm">
													Dashboard
												</Button>
											</Link>
										</>
									)}
								</>
							)}
						</nav>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<Image
						className="dark:invert mx-auto mb-8"
						src="/next.svg"
						alt="Next.js logo"
						width={180}
						height={38}
						priority
					/>
					<h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
						Welcome to TRS Authentication System
					</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						A secure, modern authentication system built with Next.js, Shadcn UI, and Tailwind CSS.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
					<Card>
						<CardHeader>
							<CardTitle>Secure Authentication</CardTitle>
							<CardDescription>
								Built with industry-standard security practices and JWT tokens
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600">
								Login with your credentials and get secure access to your dashboard.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Modern UI</CardTitle>
							<CardDescription>
								Beautiful, responsive interface using Shadcn UI components
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600">
								Clean, accessible design that works perfectly on all devices.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>User Dashboard</CardTitle>
							<CardDescription>
								View your profile information and account details
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600">
								Access your raw user data and manage your account settings.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="text-center">
					<div className="flex gap-4 justify-center flex-col sm:flex-row">
						{!isLoading && (
							<>
								{!isAuthenticated ? (
									<Link href="/login">
										<Button size="lg" className="w-full sm:w-auto">
											Get Started
										</Button>
									</Link>
								) : (
									<Link href="/dashboard">
										<Button size="lg" className="w-full sm:w-auto">
											Go to Dashboard
										</Button>
									</Link>
								)}
							</>
						)}
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-white border-t mt-16">
				<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
					<div className="text-center text-gray-500">
						<p>&copy; 2024 TRS Authentication System. Built with Next.js and Shadcn UI.</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
