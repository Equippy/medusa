import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { registerCustomerCompanyWorkflow } from "../../../workflows/oidc/workflows/register-customer-company"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const auth = req.scope.resolve(Modules.AUTH)
  const logger = req.scope.resolve("logger")

  const query = req.body as Record<string, string>

  const {
    success,
    authIdentity,
    error,
  } = await auth.validateCallback("oidc", {
    headers: req.headers,
    url: req.url,
    protocol: req.protocol,
    query,
  })

  if (!success || !authIdentity?.id) {
    logger.error("OIDC authentication failed", { error })
    return res.status(401).send({ error: error || "Authentication failed" })
  }

  // const search = new URLSearchParams(req.body as Record<string, string>).toString()

  // // Call validate-callback route to retrieve token
  // const url = `${req.protocol}://${req.get("host")}/auth/customer/oidc/callback?${search}`

  // const r = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     // Forward headers if needed
  //     "content-type": "application/json",
  //     cookie: req.headers.cookie ?? "",
  //   },
  //   body: req.readable ? await req.buffer() : undefined,
  // })

  // const body = await r.json().catch(() => ({}))

  // if (!r.ok) {
  //   return res.status(r.status).json({
  //     message: body?.message || "Authentication failed",
  //   })
  // }

  // const token = body?.token

  // console.log("Body:", JSON.stringify(body))

  // if (!token) {
  //   return res.status(500).json({ success: false, error: "Failed to issue session token" })
  // }

  // const isProd = process.env.NODE_ENV === "production"
  // res.cookie("_medusa_jwt", token, {
  //   httpOnly: true,
  //   secure: isProd,
  //   sameSite: "lax",
  //   path: "/",
  //   // maxAge optional: (e.g. 7d) 7 * 24 * 3600
  // })


  const { result } = await registerCustomerCompanyWorkflow(req.scope).run({
    input: {
      authIdentityId: authIdentity.id,
      customerData: {
        email: String(authIdentity.provider_identities?.[0].user_metadata?.email ?? ""),
        first_name: String(authIdentity.provider_identities?.[0].user_metadata?.first_name ?? ""),
        last_name: String(authIdentity.provider_identities?.[0].user_metadata?.last_name ?? ""),
        org_id: String(authIdentity.provider_identities?.[0].user_metadata?.org_id ?? ""),
      },
    },
  })

  // return { token }
  return res.status(200).json({ authIdentity: authIdentity.provider_identities?.[0].user_metadata })
}

export const AUTHENTICATE = false
