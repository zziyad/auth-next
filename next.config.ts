import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "no-referrer" },
					{ key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
				],
			},
		]
	},
}

export default nextConfig
