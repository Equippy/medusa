import { MedusaService } from "@medusajs/framework/utils";
import {
  AuthenticateRequest,
  AuthenticateResponse,
  DespatchLabAuthContext,
  DespatchLabAuthError,
  DespatchLabModuleOptions,
  DespatchLabOrder,
  ImpersonateRequest,
  ImpersonateResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "./types";

class DespatchLabModuleService extends MedusaService({}) {
  private readonly options: DespatchLabModuleOptions;
  private readonly apiUrl: string;
  private authContext: DespatchLabAuthContext;

  constructor(
    container: any,
    options: DespatchLabModuleOptions = {
      key: "",
      secret: "",
    }
  ) {
    super(container);
    this.options = options;
    this.apiUrl = options.apiUrl || "https://api.despatchlab.tech/v1";
    this.authContext = {
      isAuthenticated: false,
    };
  }

  public async getOrder(orderId: string): Promise<DespatchLabOrder> {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      throw new Error("Invalid order ID format. Expected UUID.");
    }

    try {
      const response = await this.makeAuthenticatedRequest<DespatchLabOrder>(
        `/warehouse/orders/${orderId}`
      );

      return response;
    } catch (error) {
      // Enhance error messages for better debugging
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        if (error.message.includes("401")) {
          throw new Error("Authentication failed for DespatchLab API");
        }
        throw new Error(`Failed to retrieve order: ${error.message}`);
      }
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as DespatchLabAuthError;
      throw new Error(
        `DespatchLab API error: ${response.status} - ${
          errorData.error || response.statusText
        }`
      );
    }

    return response.json();
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureAuthenticated();

    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.authContext.tokens?.access}`,
        ...options.headers,
      },
    });
  }

  private async authenticate(): Promise<AuthenticateResponse> {
    if (!this.options.key || !this.options.secret) {
      throw new Error(
        "DespatchLab authentication credentials not configured. Please set DESPATCH_LAB_KEY and DESPATCH_LAB_SECRET environment variables."
      );
    }

    const request: AuthenticateRequest = {
      key: this.options.key,
      secret: this.options.secret,
    };

    const response = await this.makeRequest<AuthenticateResponse>(
      "/auth/token/credentials",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    this.updateAuthContext(response);
    return response;
  }

  private async refreshToken(): Promise<RefreshTokenResponse> {
    if (!this.authContext.tokens?.refresh) {
      throw new Error("No refresh token available for DespatchLab API");
    }

    const request: RefreshTokenRequest = {
      token: this.authContext.tokens.refresh,
    };

    const response = await this.makeRequest<RefreshTokenResponse>(
      "/auth/token/refresh",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    this.updateAuthContext(response);
    return response;
  }

  private async impersonate(
    customerId: string,
    depotId?: string | null
  ): Promise<ImpersonateResponse> {
    await this.ensureAuthenticated();

    if (!this.authContext.tokens?.refresh) {
      throw new Error("No refresh token available for impersonation");
    }

    const request: ImpersonateRequest = {
      customerId,
      refreshToken: this.authContext.tokens.refresh,
      ...(depotId !== undefined && { depotId }),
    };

    const response = await this.makeRequest<ImpersonateResponse>(
      "/core/impersonation/impersonate",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    return response;
  }

  private updateAuthContext(response: AuthenticateResponse): void {
    this.authContext = {
      tokens: response.tokens,
      isAuthenticated: true,
      expiresAt: new Date(Date.now() + 55 * 60 * 1000), // Assume 55 min expiry for safety
    };
  }

  private isTokenExpired(): boolean {
    if (!this.authContext.expiresAt) {
      return true;
    }
    return new Date() >= this.authContext.expiresAt;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authContext.isAuthenticated || this.isTokenExpired()) {
      if (this.authContext.tokens?.refresh && !this.isTokenExpired()) {
        try {
          await this.refreshToken();
          return;
        } catch (error) {
          // If refresh fails, fall back to full authentication
        }
      }
      await this.authenticate();
    }
  }
}

export default DespatchLabModuleService;
