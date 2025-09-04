import { v4 as uuidv4 } from "uuid"
// toast intentionally not used here

interface ApiResponse<T = unknown> {
  type: string
  id: string
  result: {
    status: string
    response: T
  }
}

// Calls are routed via Next.js route handler to centralize cookies and security
const RPC_URL = "/api/rpc"

/**
 * Simple API request function that uses authenticatedFetch from auth context
 * @param authenticatedFetch - The authenticatedFetch function from useAuth hook
 * @param url - The API endpoint (e.g., 'auth/me', 'users/list')
 * @param data - Optional data to send in the request body
 * @param showToast - Whether to show toast notifications for errors (default: true)
 * @returns Promise with the API response data
 */
export const apiRequest = async <T = unknown>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, unknown> = {},
): Promise<T> => {

  try {
    const fullUrl = RPC_URL
    const requestBody = {
      id: uuidv4(),
      type: "call",
      method: url,
      args: data,
    }

    const response = await authenticatedFetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      if (response.status === 401) {
        const error = new Error("Expire Token: Unauthorized") as Error & { code?: number }
        error.code = 401
        throw error
      }

      if (response.status === 403) {
        throw new Error(`FORBIDDEN: 403, ${response.statusText}`)
      }

      throw new Error(response.statusText)
    }

    const result: ApiResponse<T> = await response.json()

    // Handle the new response structure: { type: "callback", id: "...", result: { status: "...", response: ... } }
    const { status, response: responseData } = result.result
    
    console.log('🔍 API Request Result:', { status, responseData, fullResult: result })
    
    if (status === "rejected") {
      const errorMessage = typeof responseData === 'string' ? responseData : "Request was rejected"
      const err = new Error(errorMessage) as Error & { code?: number }
      err.code = 400
      throw err
    }
    
    return responseData
    

  } catch (error) {
    const err = error as { code?: number; message?: string }
    if (Number(err.code) === 401) {
      // Token expired - authenticatedFetch will handle refresh automatically
      throw error
    }
        
    const errorMessage = err.message || "Server Error 500"
    
    throw new Error(errorMessage)
  }
}

/**
 * Convenience function for API requests that don't need toast notifications
 */
export const apiRequestSilent = <T = unknown>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, unknown> = {}
): Promise<T> => {
  return apiRequest<T>(authenticatedFetch, url, data)
}

/**
 * Convenience function for API requests with custom error handling
 */
export const apiRequestCustom = <T = unknown>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, unknown> = {},
): Promise<T> => {
  
  return apiRequest<T>(authenticatedFetch, url, data).catch((error) => {
    throw error
  })
}

/**
 * Custom hook that provides apiRequest with authenticatedFetch already bound
 * This makes it easier to use in components
 */
export const useApiRequest = () => {
  // Delay require to runtime and silence lint via inline comment, since this file
  // is not used in SSR-gated pages and avoids static import cycles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuth } = require('@/contexts/auth-context') as { useAuth: () => { authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response> } }
  const { authenticatedFetch } = useAuth()
  
  return {
    request: <T = unknown>(url: string, data: Record<string, unknown> = {}) => 
      apiRequest<T>(authenticatedFetch, url, data ),
    requestSilent: <T = unknown>(url: string, data: Record<string, unknown> = {}) => 
      apiRequestSilent<T>(authenticatedFetch, url, data),
    requestCustom: <T = unknown>(
      url: string, 
      data: Record<string, unknown> = {},
    ) => apiRequestCustom<T>(authenticatedFetch, url, data)
  }
}
