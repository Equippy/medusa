"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect, useMemo, useState } from "react"
import { decodeToken } from "react-jwt"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"

export default function OidcCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer>()
  const [error, setError] = useState<string | null>(null)

  // const queryParams = useMemo(() => {
  //   const sp = new URLSearchParams(window.location.search)
  //   return Object.fromEntries(sp.entries())
  // }, [])


  // const sendCallback = async () => {
  //   let token = ""

  //   try {
  //     token = await sdk.auth.callback(
  //       "customer", 
  //       "oidc", 
  //       Object.fromEntries(searchParams.entries())
  //     )
  //   } catch (error) {
  //     setError("Authentication Failed")
  //     setStatus('error')
  //     throw error
  //   }

  //   return token
  // }

  const sendCallback = async () => {
    const headers = {
      ...(await getAuthHeaders()),
    }
    const params = Object.fromEntries(searchParams.entries())
    // Call your custom API instead of sdk.auth.callback
    const res: Response = await sdk.client.fetch("/auth/oidc", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: params,
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Authentication failed")
    }

    // Your API should return a JWT token (string) after it validates the provider
    // and runs server-side creation logic, then refreshes if needed.
    const { token } = await res.json()
    return token as string
  }

  // const createCustomer = async () => {
  //   // create customer
  //   await sdk.store.customer.create({
  //     email: "example@medusajs.com",
  //   })
  // }

  // const refreshToken = async () => {
  //   // refresh the token
  //   await sdk.auth.refresh()
  // }

  const validateCallback = async () => {
    const token = await sendCallback()
    sdk.client.setToken(token)
    // const decoded = decodeToken(token)
    // const shouldCreateCustomer = (decoded as { actor_id: string }).actor_id === ""

    // if (shouldCreateCustomer) {
    //   await createCustomer()
    //   await refreshToken()
    // }

    // all subsequent requests are authenticated
    try {
      const { customer: customerData } =  await sdk.store.customer.retrieve()

      setCustomer(customerData)
      setStatus('success')
        
      // Redirect to account page after successful authentication
      const countryCode = params.countryCode as string
      setTimeout(() => {
        router.push(`/${countryCode}/account`)
      }, 2000)
    } catch (error) {
      if (typeof error === "object" && error !== null && "status" in error && (error as any).status === 401) {
        setError("Authentication session is invalid or expired")
        setStatus('unauthorized')
      } else {
        setError("Failed to retrieve customer data")
        setStatus('error')
      }
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      validateCallback()
    }
  }, [status])

  const getCountryCode = () => params.countryCode as string || 'uk'

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Processing authentication...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we complete your login</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Unauthorized</h1>
          <p className="text-gray-600 mb-6">
            Your authentication session is invalid or has expired. Please try logging in again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/${getCountryCode()}/account`)}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Login Again
            </button>
            <button
              onClick={() => router.push(`/${getCountryCode()}`)}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            {error || "An unexpected error occurred during authentication."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/${getCountryCode()}/account`)}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Login Again
            </button>
            <button
              onClick={() => router.push(`/${getCountryCode()}`)}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success' && customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome!</h1>
          <p className="text-gray-600 mb-2">
            Successfully authenticated as <span className="font-semibold">{customer.email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to your account...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return null
}