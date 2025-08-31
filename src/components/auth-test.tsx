"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

export function AuthTest() {
  const { user, isAuthenticated, login, logout, refreshTokens } = useAuth()
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testProtectedEndpoint = async () => {
    setIsLoading(true)
    setTestResult("Testing...")
    
    try {
      const requestBody = { type: 'call', id: '1', method: 'auth/me', args: {} }
      
      const res = await fetch("http://localhost:8001/api", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        const data = await res.json()
        setTestResult(`✅ Success: ${JSON.stringify(data.result, null, 2)}`)
      } else {
        const errorData = await res.json()
        setTestResult(`❌ Error ${res.status}: ${JSON.stringify(errorData, null, 2)}`)
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testRefreshTokens = async () => {
    setIsLoading(true)
    setTestResult("Refreshing tokens...")
    
    try {
      const success = await refreshTokens()
      if (success) {
        setTestResult("✅ Tokens refreshed successfully!")
      } else {
        setTestResult("❌ Token refresh failed")
      }
    } catch (error) {
      setTestResult(`❌ Refresh Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Status:</h3>
        <p>Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}</p>
        {user && (
          <div className="mt-2">
            <p>User: {user.email}</p>
            <p>ID: {user.id}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={testProtectedEndpoint}
          disabled={!isAuthenticated || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Test Protected Endpoint (/me)
        </button>

        <button
          onClick={testRefreshTokens}
          disabled={!isAuthenticated || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300 ml-2"
        >
          Test Token Refresh
        </button>

        <button
          onClick={logout}
          disabled={!isAuthenticated || isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300 ml-2"
        >
          Logout
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  )
}
