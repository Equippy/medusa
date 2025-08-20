import { Logger } from "@medusajs/framework/types";
import { MedusaService } from "@medusajs/framework/utils";
import {
  AuthenticateRequest,
  AuthenticateResponse,
  DespatchLabAuthContext,
  DespatchLabModuleOptions,
  DespatchLabOrder,
  DespatchLabOrderCreateRequest,
  DespatchLabOrderCreateResponse,
  DespatchLabProductCreateRequest,
  DespatchLabProductCreateResponse,
  DespatchLabProductUpdateRequest,
  DespatchLabProductUpdateResponse,
  ImpersonateRequest,
  ImpersonateResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "./types";

type InjectedDependencies = {
  logger: Logger;
};
class DespatchLabService extends MedusaService({}) {
  static identifier = "despatch-lab";
  private readonly options: DespatchLabModuleOptions;
  private readonly apiUrl: string;
  private authContext: DespatchLabAuthContext;
  private logger_: Logger;

  constructor(
    { logger }: InjectedDependencies,
    options: DespatchLabModuleOptions = {
      key: "",
      secret: "",
    }
  ) {
    super(...arguments);
    this.logger_ = logger;
    this.options = options;
    this.apiUrl = options.apiUrl || "https://api.despatchlab.tech/v1";
    this.authContext = {
      isAuthenticated: false,
    };
    this.authenticate();
  }

  public async getOrder(orderId: string): Promise<DespatchLabOrder> {
    if (!orderId) {
      throw new Error("Order ID is required");
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

  public async createProduct(
    productData:
      | DespatchLabProductCreateRequest
      | DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductCreateResponse> {
    if (!productData.customerId || !productData.sku) {
      throw new Error("Customer ID and SKU are required");
    }

    try {
      // Phase 1: Create product with basic required fields only
      const basicProductData = {
        customerId: productData.customerId,
        sku: productData.sku,
        description: productData.description,
        barcode: productData.barcode,
        type: productData.type || "Product",
      };

      const productId =
        await this.makeAuthenticatedRequest<DespatchLabProductCreateResponse>(
          "/warehouse/products",
          {
            method: "POST",
            body: JSON.stringify(basicProductData),
          }
        );

      // Phase 2: Update with additional data if this is a full product update request
      if ("id" in productData || Object.keys(productData).length > 5) {
        const fullProductData = {
          id: productId,
          ...productData,
        } as DespatchLabProductUpdateRequest;

        // Use Promise.allSettled to handle partial failures gracefully
        const updatePromises: Promise<string | null>[] = [];

        // Always call main details endpoint (handles SKU, description, barcode, etc.)
        updatePromises.push(
          this.updateProductDetails(productId, fullProductData).catch(
            (error) => {
              this.logger_.error(
                `Failed to update details for product ${productId}:`,
                error
              );
              return null;
            }
          )
        );

        // Only update configuration if dimensions/weight are valid
        if (this.hasValidDimensions(fullProductData)) {
          updatePromises.push(
            this.updateProductConfiguration(productId, fullProductData).catch(
              (error) => {
                this.logger_.error(
                  `Failed to update configuration for product ${productId}:`,
                  error
                );
                return null;
              }
            )
          );
        }

        // Always call storage endpoint
        updatePromises.push(
          this.updateProductStorage(productId, fullProductData).catch(
            (error) => {
              this.logger_.error(
                `Failed to update storage for product ${productId}:`,
                error
              );
              return null;
            }
          )
        );

        // Always call special instructions endpoint
        updatePromises.push(
          this.updateProductSpecialInstructions(
            productId,
            fullProductData
          ).catch((error) => {
            this.logger_.error(
              `Failed to update special instructions for product ${productId}:`,
              error
            );
            return null;
          })
        );

        // Always call rules endpoint
        updatePromises.push(
          this.updateProductRules(productId, fullProductData).catch((error) => {
            this.logger_.error(
              `Failed to update rules for product ${productId}:`,
              error
            );
            return null;
          })
        );

        await Promise.allSettled(updatePromises);
      }

      return productId;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error(
            `Customer with ID ${productData.customerId} not found`
          );
        }
        if (error.message.includes("400")) {
          throw new Error(`Invalid product data: ${error.message}`);
        }
        if (error.message.includes("401")) {
          throw new Error("Authentication failed for DespatchLab API");
        }
        throw new Error(`Failed to create product: ${error.message}`);
      }
      throw error;
    }
  }

  public async updateProduct(
    productData: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    if (!productData.id || !productData.customerId) {
      throw new Error("Product ID and Customer ID are required");
    }

    try {
      // Make parallel calls to all endpoints
      const updatePromises: Promise<string | null>[] = [];

      // Always call main details endpoint first (handles SKU, description, barcode, etc.)
      updatePromises.push(
        this.updateProductDetails(productData.id, productData).catch(
          (error) => {
            this.logger_.error(
              `Failed to update details for product ${productData.id}:`,
              error
            );
            return null;
          }
        )
      );

      // Only update configuration if dimensions/weight are valid
      if (this.hasValidDimensions(productData)) {
        updatePromises.push(
          this.updateProductConfiguration(productData.id, productData).catch(
            (error) => {
              this.logger_.error(
                `Failed to update configuration for product ${productData.id}:`,
                error
              );
              return null;
            }
          )
        );
      }

      // Always call storage endpoint
      updatePromises.push(
        this.updateProductStorage(productData.id, productData).catch(
          (error) => {
            this.logger_.error(
              `Failed to update storage for product ${productData.id}:`,
              error
            );
            return null;
          }
        )
      );

      // Always call special instructions endpoint
      updatePromises.push(
        this.updateProductSpecialInstructions(
          productData.id,
          productData
        ).catch((error) => {
          this.logger_.error(
            `Failed to update special instructions for product ${productData.id}:`,
            error
          );
          return null;
        })
      );

      // Always call rules endpoint
      updatePromises.push(
        this.updateProductRules(productData.id, productData).catch((error) => {
          this.logger_.error(
            `Failed to update rules for product ${productData.id}:`,
            error
          );
          return null;
        })
      );

      const results = await Promise.allSettled(updatePromises);

      // Check if all promises were rejected
      const hasAnySuccess = results.some(
        (result) => result.status === "fulfilled"
      );
      if (!hasAnySuccess) {
        throw new Error("All product update operations failed");
      }

      return productData.id;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error(`Product with ID ${productData.id} not found`);
        }
        if (error.message.includes("400")) {
          throw new Error(`Invalid product data: ${error.message}`);
        }
        if (error.message.includes("401")) {
          throw new Error("Authentication failed for DespatchLab API");
        }
        throw new Error(`Failed to update product: ${error.message}`);
      }
      throw error;
    }
  }

  public async createOrder(
    orderData: DespatchLabOrderCreateRequest,
    customerId?: string
  ): Promise<DespatchLabOrderCreateResponse> {
    if (!orderData.customerId || !orderData.customerReference) {
      throw new Error("Customer ID and customer reference are required");
    }

    try {
      // If a customerId is provided for impersonation, use that
      // if (customerId) {
      //   await this.impersonate(customerId);
      // }

      const orderId =
        await this.makeAuthenticatedRequest<DespatchLabOrderCreateResponse>(
          "/warehouse/orders",
          {
            method: "POST",
            body: JSON.stringify(orderData),
          }
        );

      this.logger_.info(
        `[DespatchLab] Created order ${orderData.customerReference} with ID ${orderId}`
      );

      return orderId;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error(`Customer with ID ${orderData.customerId} not found`);
        }
        if (error.message.includes("400")) {
          throw new Error(`Invalid order data: ${error.message}`);
        }
        if (error.message.includes("401")) {
          throw new Error("Authentication failed for DespatchLab API");
        }
        throw new Error(`Failed to create order: ${error.message}`);
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

    const responseBody = await response.text();

    if (!response.ok) {
      throw new Error(
        `DespatchLab API error: ${response.status} - ${response.statusText}
        ${responseBody}`
      );
    }

    try {
      return JSON.parse(responseBody);
    } catch {
      return this.safeExtractJSON(responseBody);
    }
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureAuthenticated();

    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
    this.logger_.info(`[DespatchLab] Authenticated with ${this.options.key}`);
    return response;
  }

  private async refreshToken(): Promise<RefreshTokenResponse> {
    if (!this.authContext.tokens?.refresh) {
      throw new Error("No refresh token available for DespatchLab API");
    }

    const request: RefreshTokenRequest = {
      token: this.authContext.tokens.refresh,
    };

    const response = await this.makeAuthenticatedRequest<RefreshTokenResponse>(
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

    const response = await this.makeAuthenticatedRequest<ImpersonateResponse>(
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

  private async updateProductDetails(
    id: string,
    data: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    return this.makeAuthenticatedRequest<DespatchLabProductUpdateResponse>(
      `/warehouse/products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  private async updateProductConfiguration(
    id: string,
    data: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    return this.makeAuthenticatedRequest<DespatchLabProductUpdateResponse>(
      `/warehouse/products/${id}/configuration`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  private async updateProductStorage(
    id: string,
    data: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    return this.makeAuthenticatedRequest<DespatchLabProductUpdateResponse>(
      `/warehouse/products/${id}/storage`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  private async updateProductSpecialInstructions(
    id: string,
    data: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    return this.makeAuthenticatedRequest<DespatchLabProductUpdateResponse>(
      `/warehouse/products/${id}/special-instructions`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  private async updateProductRules(
    id: string,
    data: DespatchLabProductUpdateRequest
  ): Promise<DespatchLabProductUpdateResponse> {
    return this.makeAuthenticatedRequest<DespatchLabProductUpdateResponse>(
      `/warehouse/products/${id}/rules`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  private hasValidDimensions(data: DespatchLabProductUpdateRequest): boolean {
    return (
      (data.height !== undefined && data.height >= 0.1) ||
      (data.width !== undefined && data.width >= 0.1) ||
      (data.depth !== undefined && data.depth >= 0.1) ||
      (data.weight !== undefined && parseFloat(data.weight) >= 0.1)
    );
  }

  private safeExtractJSON(str) {
    if (!str || typeof str !== "string") {
      return null;
    }

    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let jsonEnd = -1;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") depth++;
        else if (char === "}") {
          depth--;
          if (depth === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }

    if (jsonEnd !== -1) {
      try {
        const jsonStr = str.substring(0, jsonEnd + 1);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        return undefined;
      }
    }

    return undefined;
  }
}

export default DespatchLabService;
