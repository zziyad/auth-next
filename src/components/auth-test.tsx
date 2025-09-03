"use client"

import { useAuth } from "@/contexts/auth-context"
import { apiRequest, apiRequestSilent, useApiRequest } from "@/lib/api-request"
import { useState } from "react"

export function AuthTest() {
  const { user, isAuthenticated, login, logout, refreshTokens, authenticatedFetch } = useAuth()
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Example using the useApiRequest hook
  const api = useApiRequest()

  const testProtectedEndpoint = async () => {
    setIsLoading(true)
    setTestResult("Testing...")
    
    try {
      // Method 1: Using apiRequest function directly
      const userData = await apiRequest(authenticatedFetch, 'auth/me', {})
      setTestResult(`✅ Success (apiRequest): ${JSON.stringify(userData, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Error (apiRequest): ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testProtectedEndpointWithHook = async () => {
    setIsLoading(true)
    setTestResult("Testing with hook...")
    
    try {
      // Method 2: Using the useApiRequest hook
      const userData = await api.request('auth/me', {})
      setTestResult(`✅ Success (useApiRequest hook): ${JSON.stringify(userData, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Error (useApiRequest hook): ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testSilentRequest = async () => {
    setIsLoading(true)
    setTestResult("Testing silent request...")
    
    try {
      // Method 3: Using apiRequestSilent (no toast notifications)
      const userData = await apiRequestSilent(authenticatedFetch, 'auth/me', {})
      setTestResult(`✅ Success (apiRequestSilent): ${JSON.stringify(userData, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Error (apiRequestSilent): ${error}`)
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

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">API Request Examples:</h3>
        <div className="text-sm space-y-1">
          <p><strong>Method 1:</strong> <code>apiRequest(authenticatedFetch, 'auth/me', {})</code></p>
          <p><strong>Method 2:</strong> <code>api.request('auth/me', {})</code> (using hook)</p>
          <p><strong>Method 3:</strong> <code>apiRequestSilent(authenticatedFetch, 'auth/me', {})</code></p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={testProtectedEndpoint}
            disabled={!isAuthenticated || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Test API Request (Direct)
          </button>

          <button
            onClick={testProtectedEndpointWithHook}
            disabled={!isAuthenticated || isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            Test API Request (Hook)
          </button>

          <button
            onClick={testSilentRequest}
            disabled={!isAuthenticated || isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:bg-gray-300"
          >
            Test Silent Request
          </button>

          <button
            onClick={testRefreshTokens}
            disabled={!isAuthenticated || isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Test Token Refresh
          </button>
        </div>

        <div className="pt-4">
          <button
            onClick={logout}
            disabled={!isAuthenticated || isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            Logout
          </button>
        </div>
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
