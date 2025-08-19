export interface DespatchLabAuthCredentials {
  key: string;
  secret: string;
}

export interface DespatchLabTokens {
  access: string;
  refresh: string;
}

export interface DespatchLabAuthResponse {
  tokens: DespatchLabTokens;
}

export interface DespatchLabImpersonationTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DespatchLabImpersonationResponse {
  tokens: DespatchLabImpersonationTokens;
}

export interface DespatchLabAuthError {
  error: string;
}

export interface DespatchLabModuleOptions {
  apiUrl?: string;
  key: string;
  secret: string;
}

export interface DespatchLabAuthContext {
  tokens?: DespatchLabTokens;
  expiresAt?: Date;
  isAuthenticated: boolean;
}

export interface DespatchLabOrder {
  id: string;
  [key: string]: any;
}

export interface DespatchLabData {
  id?: string;
  orderId?: string;
  tracking_number?: string;
  label_url?: string;
  tracking_url?: string;
  [key: string]: any;
}

export interface DespatchLabShippingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimated_delivery_days?: number;
}

export interface DespatchLabCalculatePriceData {
  shipping_address?: any;
  items?: any[];
  currency_code?: string;
  [key: string]: any;
}

export interface DespatchLabDocument {
  tracking_number: string;
  label_url?: string;
  tracking_url?: string;
  type: "label" | "invoice" | "customs" | "other";
  [key: string]: any;
}

export interface DespatchLabProduct {
  id: string;
  customerId: string;
  sku: string;
  description: string;
  barcode?: string;
  type: "Product" | "Bundle";
  [key: string]: any;
}

export interface DespatchLabProductCreateRequest {
  customerId: string;
  sku: string;
  description: string;
  barcode?: string;
  type: "Product" | "Bundle";
}

export type DespatchLabProductCreateResponse = string;

export interface DespatchLabProductUpdateRequest {
  id: string;
  customerId: string;
  customerName?: string;
  sku: string;
  description: string;
  barcode?: string;
  type: "Product" | "Bundle";
  typeName?: string;
  uom?: string;
  
  // Dimensions and physical properties
  height?: number;
  width?: number;
  depth?: number;
  volume?: number;
  unassembledHeight?: number;
  unassembledWidth?: number;
  unassembledDepth?: number;
  unassembledVolume?: number;
  weight?: string;
  
  // Origin and compliance
  countryOfOrigin?: string;
  commodityCode?: string;
  code2?: string;
  code3?: string;
  
  // Pricing
  costPrice?: number;
  salesPrice?: number;
  channelApiIds?: string[] | null;
  
  // Stock and picking levels
  minStockholding?: number;
  minPickingLevel?: number;
  maxPickingLevel?: number;
  totalStock?: number;
  
  // Product rules and grading
  grade?: string;
  rotateBy?: "FIFO" | "LIFO" | "FEFO";
  rotateByName?: string;
  
  // Storage and putaway settings
  putawayType?: string;
  putawayTypeName?: string;
  isSameStorageRotation?: boolean;
  isDifferentStorageRotation?: boolean;
  isMixWithOtherProducts?: boolean;
  
  // Packaging settings
  packagingType?: string;
  packagingTypeName?: string;
  toBeUsedForPrimaryPackaging?: boolean;
  toBeUsedForSecondaryPackaging?: boolean;
  primaryPackagingSkus?: string[];
  secondaryPackagingSkus?: string[];
  primaryPackagingIds?: string[];
  secondaryPackagingIds?: string[];
  bundleProducts?: any[];
  
  // Serial number and batch tracking
  isSerialNumberIn?: boolean;
  isSerialNumberOut?: boolean;
  isRotationDateAtReceipt?: boolean;
  dateFormat?: string | null;
  isBatchNumberRequired?: boolean;
  isPickLinesFromSingleBatch?: boolean;
  
  // Special instructions and handling
  isFragile?: boolean | null;
  isLiquid?: boolean | null;
  isHazardous?: boolean | null;
  requiresSecurity?: boolean | null;
  requiresSignature?: boolean | null;
  
  // Status flags
  usedInOrders?: boolean;
  
  [key: string]: any;
}

export type DespatchLabProductUpdateResponse = string;
