"use client"

// import { listRegions } from "@/lib/data/regions"
// import LoginTemplate from "@/modules/account/templates/login-template"
// import { Metadata } from "next"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { sdk } from "@/lib/config"

// export const metadata: Metadata = {
//   title: "Log in",
//   description: "Log in to your Medusa Store account.",
// }

export default function Login() {
  // const regions = await listRegions()

  // return <LoginTemplate regions={regions} />
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loginWithAuth0 = async () => {
    try {
      const result = await sdk.auth.login("customer", "auth0", {})

      if (typeof result === "object" && result.location) {
        // redirect to Auth0 for authentication
        window.location.href = result.location
        return
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6 bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={loginWithAuth0}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              "Continue with Auth0"
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
