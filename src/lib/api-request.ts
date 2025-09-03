import { v4 as uuidv4 } from "uuid"
import toast from "react-hot-toast"

interface ApiResponse<T = any> {
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
export const apiRequest = async <T = any>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, any> = {},
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
        const error = new Error("Expire Token: Unauthorized")
        ;(error as any).code = 401
        throw error
      }

      if (response.status === 403) {
        throw new Error(`FORBIDDEN: 403, ${response.statusText}`)
      }

      throw new Error(response.statusText)
    }

    const result = await response.json()

    // Handle the new response structure: { type: "callback", id: "...", result: { status: "...", response: ... } }
    const { status, response: responseData } = result.result
    
    console.log('🔍 API Request Result:', { status, responseData, fullResult: result })
    
    if (status === "rejected") {
    const errorMessage = typeof responseData === 'string' ? responseData : "Request was rejected"
    throw new Error(errorMessage)
    }
    
    return responseData
    

  } catch (error: any) {
    if (error.code === 401) {
      // Token expired - authenticatedFetch will handle refresh automatically
      throw error
    }
        
    const errorMessage = error.message || "Server Error 500"
    
    throw new Error(errorMessage)
  }
}

/**
 * Convenience function for API requests that don't need toast notifications
 */
export const apiRequestSilent = <T = any>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, any> = {}
): Promise<T> => {
  return apiRequest<T>(authenticatedFetch, url, data)
}

/**
 * Convenience function for API requests with custom error handling
 */
export const apiRequestCustom = <T = any>(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string, 
  data: Record<string, any> = {},
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
  // Import useAuth hook dynamically to avoid circular dependencies
  const { useAuth } = require('@/contexts/auth-context')
  const { authenticatedFetch } = useAuth()
  
  return {
    request: <T = any>(url: string, data: Record<string, any> = {}) => 
      apiRequest<T>(authenticatedFetch, url, data ),
    requestSilent: <T = any>(url: string, data: Record<string, any> = {}) => 
      apiRequestSilent<T>(authenticatedFetch, url, data),
    requestCustom: <T = any>(
      url: string, 
      data: Record<string, any> = {},
    ) => apiRequestCustom<T>(authenticatedFetch, url, data)
  }
}
