import { AbstractAuthModuleProvider } from "@medusajs/framework/utils"
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
}

class Auth0ProviderService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "Auth0"
  static identifier = "auth0"

  protected logger_: Logger
  protected options_: Options
  private clientPromise?: Promise<Client>

  constructor (
    { logger }: InjectedDependencies,
    options: Options
  ) {
    super(...arguments)

    this.logger_ = logger
    this.options_ = options
  }

  private async getClient(): Promise<client.Configuration> {
    if (!this.clientPromise) {
      this.clientPromise = this.initializeClient()
    }
    return this.clientPromise
  }

  private async initializeClient(): Promise<client.Configuration> {
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
      this.logger_.error("Failed to initialize Auth0 client", error)
      throw new Error("Failed to initialize Auth0 client")
    }
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      const oidcClientConfig = await this.getClient()
      const state = client.randomState()
      const nonce = client.randomNonce()

      const authUrl = await client.buildAuthorizationUrl(oidcClientConfig, {
        scope: "openid profile email",
        redirect_uri: this.options_.redirectUri,
        state: state,
        nonce: nonce
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

  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    try {
      const client = await this.getClient()
      const params = data.query as Record<string, string>

      if (!params.code) {
        return {
          success: false,
          error: "Missing authorization code"
        }
      }

      const tokenSet = await client.callback(
        this.options_.redirectUri,
        params,
        { state: params.state }
      )

      const userinfo = await client.userinfo(tokenSet.access_token)

      const entityId = userinfo.sub || userinfo.email
      if (!entityId) {
        return {
          success: false,
          error: "Failed to retrieve user information"
        }
      }

      let authIdentity
      try {
        authIdentity = await authIdentityProviderService.retrieve({
          entity_id: entityId,
          provider: this.provider,
        })
      } catch {
        authIdentity = await authIdentityProviderService.create({
          entity_id: entityId,
          provider: this.provider,
          provider_metadata: {
            sub: userinfo.sub,
            id_token: tokenSet.id_token,
            access_token: tokenSet.access_token,
          },
          user_metadata: {
            email: userinfo.email,
            name: userinfo.name,
            given_name: userinfo.given_name,
            family_name: userinfo.family_name,
            picture: userinfo.picture,
            email_verified: userinfo.email_verified,
          },
        })
      }

      return {
        success: true,
        authIdentity,
        location: this.options_.postLoginRedirectUrl || "/",
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

export default Auth0ProviderService
