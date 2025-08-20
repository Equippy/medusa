export interface FulfillmentProviderConfig {
  provider_id: string;
  config?: {
    customerId?: string;
    depotId?: string;
    apiKey?: string;
    apiSecret?: string;
    [key: string]: any;
  };
  regions?: string[];
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminFulfillmentProviderConfigsResponse {
  fulfillment_provider_configurations: FulfillmentProviderConfig[];
}

export interface AdminFulfillmentProviderConfigResponse {
  fulfillment_provider_configuration: FulfillmentProviderConfig;
}

export interface AdminSetFulfillmentProviderConfig {
  provider_id: string;
  config?: {
    customerId?: string;
    depotId?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  regions?: string[];
  is_default?: boolean;
}

export interface AdminUpdateFulfillmentProviderConfig {
  config?: {
    customerId?: string;
    depotId?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  regions?: string[];
  is_default?: boolean;
}

export interface AvailableFulfillmentProvider {
  id: string;
  name: string;
  description?: string;
}

export interface AdminAvailableFulfillmentProvidersResponse {
  fulfillment_providers: AvailableFulfillmentProvider[];
}