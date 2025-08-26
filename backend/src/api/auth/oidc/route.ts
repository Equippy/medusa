import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { registerCustomerCompanyWorkflow } from "../../../workflows/oidc/workflows/register-customer-company"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const auth = req.scope.resolve(Modules.AUTH)
  const logger = req.scope.resolve("logger")

  const query = req.body

  const { success, authIdentity, error } = await auth.validateCallback("oidc", {
    url: req.url,
    headers: req.headers,
    query,
    protocol: req.protocol,
  })

  if (!success || !authIdentity?.id) {
    logger.error("OIDC authentication failed", { error })
    return res.status(401).send({ error: error || "Authentication failed" })
  }

  const { result } = await registerCustomerCompanyWorkflow(req.scope).run({
    input: {
      authIdentityId: authIdentity.id,
      customerData: {
        email: String(authIdentity.provider_identities?.[0].user_metadata?.email ?? ""),
        first_name: String(authIdentity.provider_identities?.[0].user_metadata?.first_name ?? ""),
        last_name: String(authIdentity.provider_identities?.[0].user_metadata?.last_name ?? ""),
      },
    },
  })

  res.send(authIdentity)
}

export const AUTHENTICATE = false
