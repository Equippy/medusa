import {
  AbstractAuthModuleProvider,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
  Logger,
} from "@medusajs/framework/types"
import * as client from "openid-client"


type InjectedDependencies = {
  logger: Logger
}

type Options = {
  domain: string
  clientId: string
  clientSecret: string
  redirectUri: string
  postLoginRedirectUrl?: string
  adminRedirectUri?: string
  adminPostLoginRedirectUrl?: string
}

type SessionState = {
  code_verifier: string
  nonce: string
  state: string
  actor_type: string
  timestamp: number
}

class OidcProviderService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "OIDC"
  static identifier = "oidc"

  protected logger_: Logger
  protected options_: Options
  protected customerService_: ICustomerModuleService
  private clientPromise?: Promise<client.Configuration>
  // private code_verifier: string
  // private nonce: string
  // private state: string

  constructor (
    { logger }: InjectedDependencies,
    options: Options
  ) {
    super(...arguments)

    this.logger_ = logger
    this.options_ = options
    // this.code_verifier = client.randomPKCECodeVerifier()
    // this.nonce = client.randomNonce()
    // this.state = client.randomState()
  }

  private getRedirectUrl(actorType?: string): string {
    if (actorType === 'user' && this.options_.adminRedirectUri) {
      return this.options_.adminRedirectUri
    }
    return this.options_.redirectUri
  }

  private getPostLoginRedirectUrl(actorType?: string): string {
    if (actorType === 'user' && this.options_.adminPostLoginRedirectUrl) {
      return this.options_.adminPostLoginRedirectUrl
    }
    return this.options_.postLoginRedirectUrl || '/'
  }

  private async getClient(): Promise<client.Configuration> {
    if (!this.clientPromise) {
      this.clientPromise = this.initialiseClient()
    }
    return this.clientPromise
  }

  private async initialiseClient(): Promise<client.Configuration> {
    try {
      return client.discovery(
        new URL(`https://${this.options_.domain}/`),
        this.options_.clientId,
        {
          grant_types: ["authorization_code"],
          client_secret: this.options_.clientSecret,
        }
      )
    } catch (error) {
      this.logger_.error("Failed to initialise OIDC client", error)
      throw new Error("Failed to initialise OIDC client")
    }
  }

  private async getSessionState(
    state: string,
    authIdentityProviderService: AuthIdentityProviderService): Promise<SessionState> {
    const [sessionId, originalState] = state.split(':')

    if (!sessionId || !originalState) {
      throw new Error("Invalid state parameter format")
    }

    const sessionData = await authIdentityProviderService.getState(`oidc_session_${sessionId}`) as SessionState
    if (!sessionData) {
      throw new Error("Session not found or expired")
    }

    // Validate state
    if (sessionData.state !== originalState) {
      throw new Error("Invalid state parameter")
    }

    // Check session age (optional: add expiration)
    const sessionAge = Date.now() - sessionData.timestamp
    if (sessionAge > 10 * 60 * 1000) { // 10 minutes
      throw new Error("Session expired")
    }

    return sessionData
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      const oidcClientConfig = await this.getClient()

      const code_verifier = client.randomPKCECodeVerifier()
      const nonce = client.randomNonce()
      const state = client.randomState()      
      const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

      const actorType = data.body?.actor_type || data.query?.actor_type || "customer"
      const redirectUrl = this.getRedirectUrl(actorType)

      const sessionId = crypto.randomUUID()
      const sessionState: SessionState = {
        code_verifier,
        nonce,
        state,
        actor_type: actorType,
        timestamp: Date.now()
      }
      await authIdentityProviderService.setState(`oidc_session_${sessionId}`, sessionState)

      const authUrl = await client.buildAuthorizationUrl(oidcClientConfig, {
        scope: "openid profile email",
        redirect_uri: redirectUrl,
        code_challenge,
        code_challenge_method: 'S256',
        nonce: nonce,
        state: `${sessionId}:${state}`
      })

      return {
        success: true,
        location: authUrl.toString()
      }
    } catch (error) {
      this.logger_.error("Failed to authenticate user", error)
      return {
        success: false,
        error: "Failed to authenticate user"
      }
    }
  }

  private extractCompany(userinfo: any): string | undefined {
    return (
      userinfo.company ||
      userinfo.org_name ||
      userinfo.org_id ||
      undefined
    )
  }

  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      const oidcClientConfig = await this.getClient()
      const params = data.query as Record<string, string>

      if (!params.code) {
        return {
          success: false,
          error: "Missing authorization code"
        }
      }

      if (!params.state) {
        return {
          success: false,
          error: "Missing state parameter"
        }
      }

      // Retrieve session data
      const sessionData = await this.getSessionState(params.state, authIdentityProviderService)
      const actorType = sessionData.actor_type || "customer"

      const redirectUrl = this.getRedirectUrl(actorType)
      const postLoginRedirectUrl = this.getPostLoginRedirectUrl(actorType)

      // Create callback parameters with only the expected OAuth parameters
      // and use the original state value, not the sessionId:state format
      const callbackParams = new URLSearchParams({
        code: params.code,
        ...(params.scope && { scope: params.scope }),
        ...(params.iss && { iss: params.iss }),
      })

      const currentUrl = new URL(`${redirectUrl}?${callbackParams.toString()}`)

      const tokens = await client.authorizationCodeGrant(
        oidcClientConfig,
        currentUrl, {
          pkceCodeVerifier: sessionData.code_verifier,
          expectedNonce: sessionData.nonce,
          idTokenExpected: true,
      })

      const claims = tokens.claims()!
      const userinfo = await client.fetchUserInfo(oidcClientConfig, tokens.access_token, claims.sub)

      const userId = userinfo.sub || userinfo.email
      if (!userId) {
        return {
          success: false,
          error: "Failed to retrieve user information"
        }
      }

      // console.log("User Info:", userinfo)
      // console.log("Claims:", claims)
      // console.log("Email:", userinfo.email)

      // const customerService = this.container_.resolve(
      //   Modules.CUSTOMER
      // ) as ICustomerModuleService
      // const customerModuleService = this.__container__.resolve(Modules.CUSTOMER)

      // // Check if customer already exists in Medusa
      // let customer
      // try {
      //   const existing = await this.customerService_.listCustomers({
      //     email
      //   })
      //   customer = existing.length > 0 ? existing[0] : null
      // } catch (error) {
      //   this.logger_.error("Error checking existing customer", error)
      //   customer = null
      // }

      // // Create customer if doesn't exist
      // if (!customer) {
      //   try {
      //     customer = await this.customerService_.createCustomers({
      //       email,
      //       first_name: userinfo.given_name || userinfo.name?.split(' ')[0] || '',
      //       last_name: userinfo.family_name || userinfo.name?.split(' ').slice(1).join(' ') || '',
      //       metadata: {
      //         auth_provider: 'oidc',
      //         oidc_sub: userinfo.sub,
      //         picture: userinfo.picture,
      //         email_verified: userinfo.email_verified,
      //         company: this.extractCompany(userinfo),
      //       }
      //     })
      //     this.logger_.info("Created new customer")
      //   } catch (error) {
      //     this.logger_.error("Failed to create customer", error)
      //     return {
      //       success: false,
      //       error: "Failed to create customer account"
      //     }
      //   }
      // } else {
      //   this.logger_.info("Using existing customer")
      // }

      const providerMetadata = {
        sub: userinfo.sub,
        id_token: tokens.id_token,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        actor_type: actorType,
        access_token_expires_at: new Date(
          Date.now() + (tokens.expires_in ?? 3600) * 1000
        ).toISOString(),
      }

      const userMetadata = {
        email: userinfo.email,
        name: userinfo.name,
        given_name: userinfo.given_name,
        family_name: userinfo.family_name,
        picture: userinfo.picture,
        email_verified: userinfo.email_verified,
        company: this.extractCompany(userinfo),
        actor_type: actorType,
      }

      // console.log("Provider Metadata:", providerMetadata)
      // console.log("User Metadata:", userMetadata)

      // Upsert the auth identity

      let authIdentity
      try {
        console.log("Retrieving existing auth identity for user:", userId)
        // Retrieve throws if auth identity not found
        authIdentity = await authIdentityProviderService.retrieve({
          entity_id: userId,
        })
        console.log("Existing Auth Identity:", authIdentity)
        // Update the auth identity
        // authIdentity = await authIdentityProviderService.update(
        //   userId, {
        //   provider_metadata: providerMetadata,
        //   user_metadata: userMetadata,
        // })
      } catch (error) {
        console.log("Error updating auth identity:", error)
        if (error.type === MedusaError.Types.NOT_FOUND) {
          authIdentity = await authIdentityProviderService.create({
            entity_id: userId,
            user_metadata: userMetadata,
            provider_metadata: providerMetadata,
          })
        } else {
          return {
            success: false,
            error: error.message
          }
        }
      }

      console.log("Auth Identity:", authIdentity)

      return {
        success: true,
        authIdentity,
        location: postLoginRedirectUrl,
      }
    } catch (error) {
      this.logger_.error("Failed to validate callback", error)
      return {
        success: false,
        error: "Failed to validate callback"
      }
    }
  }
}

export default OidcProviderService
