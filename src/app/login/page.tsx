"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import PublicRoute from "@/components/auth/public-route"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState("")
	const { login, isLoading, lastErrorMessage } = useAuth()
	const router = useRouter()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")

		const success = await login(email, password)
		
		if (success) {
			router.push("/dashboard")
		} else {
			const msg = lastErrorMessage || "Invalid email or password. Please try again."
			setError(msg)
			toast.error(msg)
		}
	}

	return (
		<PublicRoute>
			<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
					<div className="text-center">
						<h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
							Sign in to your account
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							Enter your credentials to access your account
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Login</CardTitle>
							<CardDescription>
								Enter your email and password to continue
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleLogin} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="Enter your email"
										required
										disabled={isLoading}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="Enter your password"
											required
											disabled={isLoading}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowPassword(!showPassword)}
											disabled={isLoading}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>

								{error && (
									<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
										{error}
									</div>
								)}

								<Button
									type="submit"
									className="w-full"
									disabled={isLoading}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Signing in...
										</>
									) : (
										"Sign in"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</PublicRoute>
	)
}
