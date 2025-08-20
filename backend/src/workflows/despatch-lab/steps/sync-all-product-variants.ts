import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import companyFulfillmentProvider from "../../../links/company-fulfillment-provider";
import companyProduct from "../../../links/company-product";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import DespatchLabService from "../../../modules/despatch-lab/service";

export interface SyncAllProductVariantsInput {
  productId: string;
}

export interface SyncedVariantResult {
  despatchLabProductId: string;
  productId: string;
  variantId: string;
  sku: string;
  companyId: string;
  isUpdate: boolean;
  syncedAt: string;
}

export interface SyncAllProductVariantsOutput {
  productId: string;
  syncedVariants: SyncedVariantResult[];
  totalVariants: number;
  successfulSyncs: number;
  errors: Array<{
    variantId: string;
    sku?: string;
    error: string;
  }>;
}

export const syncAllProductVariantsStep = createStep(
  "sync-all-product-variants",
  async (
    input: SyncAllProductVariantsInput,
    { container }
  ): Promise<StepResponse<SyncAllProductVariantsOutput, any>> => {
    const despatchLabProvider = container.resolve(
      DESPATCH_LAB_MODULE
    ) as DespatchLabService;

    const productModule = container.resolve(Modules.PRODUCT);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Get the product
    const product = await productModule.retrieveProduct(input.productId);

    // Get all variants with SKUs for this product
    const variants = await productModule.listProductVariants({
      product_id: input.productId,
      sku: {
        $ne: null,
      },
    });

    if (!variants.length) {
      return new StepResponse({
        productId: input.productId,
        syncedVariants: [],
        totalVariants: 0,
        successfulSyncs: 0,
        errors: [],
      });
    }

    // Get associated company via link
    const { data: companyProductLinks } = await query.graph({
      entity: companyProduct.entryPoint,
      filters: {
        product_id: input.productId,
      },
      fields: ["company_id", "product_id"],
    });

    if (!companyProductLinks || companyProductLinks.length === 0) {
      throw new Error(
        `Product ${input.productId} is not associated with any company`
      );
    }

    const companyId = companyProductLinks[0].company_id;

    // Get DespatchLab configuration for company
    const { data: companyProviderLinks } = await query.graph({
      entity: companyFulfillmentProvider.entryPoint,
      filters: {
        company_id: companyId,
        fulfillment_provider_id: "despatch-lab",
      },
      fields: ["config", "regions", "is_default"],
    });

    if (!companyProviderLinks || companyProviderLinks.length === 0) {
      throw new Error(`Company ${companyId} has no DespatchLab configuration`);
    }

    const despatchLabConfig = companyProviderLinks[0].config;

    if (!despatchLabConfig?.customerId) {
      throw new Error(
        `Company ${companyId} DespatchLab configuration missing customerId`
      );
    }

    const customerId = despatchLabConfig.customerId;

    const syncedVariants: SyncedVariantResult[] = [];
    const errors: Array<{ variantId: string; sku?: string; error: string }> =
      [];

    // Process each variant
    for (const variant of variants) {
      try {
        if (!variant.sku) {
          errors.push({
            variantId: variant.id,
            error: "Variant has no SKU",
          });
          continue;
        }

        // Check if product already exists in DespatchLab
        let despatchLabProductId = variant.metadata?.despatchlab_product_id as
          | string
          | null;
        let isUpdate = !!despatchLabProductId;

        // Calculate volume if dimensions are available
        const volume =
          variant.height && variant.width && variant.length
            ? variant.height * variant.width * variant.length
            : 0;

        // Prepare complete product data
        const productData = {
          customerId: customerId,
          sku: variant.sku,
          description: variant.title
            ? `${product.title} - ${variant.title}`
            : `${product.title} (${variant.sku})`,
          barcode: variant.barcode || variant.ean || variant.upc || undefined,
          type: "Product" as const,
          uom: "Item",

          // Dimensions from variant
          height: variant.height || 0,
          width: variant.width || 0,
          depth: variant.length || 0, // length maps to depth in DespatchLab
          volume: volume,
          weight: variant.weight?.toString() || "0",

          // Origin and compliance
          countryOfOrigin: variant.origin_country || undefined,

          // Default values for required fields
          costPrice: 0,
          salesPrice: 0,
          minStockholding: 0,
          minPickingLevel: 0,
          maxPickingLevel: 0,
          grade: "A",
          rotateBy: "FIFO" as const,
          rotateByName: "FIFO",
          putawayType: "Random",
          putawayTypeName: "Random",
          packagingType: "OwnPackaging",
          packagingTypeName: "Own Packaging",
          isMixWithOtherProducts: true,
          isSerialNumberIn: false,
          isSerialNumberOut: false,
          isBatchNumberRequired: false,
          isPickLinesFromSingleBatch: false,
          isRotationDateAtReceipt: false,
          isSameStorageRotation: false,
          isDifferentStorageRotation: false,
          toBeUsedForPrimaryPackaging: false,
          toBeUsedForSecondaryPackaging: false,
          primaryPackagingSkus: [],
          secondaryPackagingSkus: [],
          primaryPackagingIds: [],
          secondaryPackagingIds: [],
          bundleProducts: [],
          isFragile: undefined,
          isLiquid: undefined,
          isHazardous: undefined,
          requiresSecurity: undefined,
          requiresSignature: undefined,
          totalStock: 0,
          usedInOrders: false,
          unassembledHeight: 0,
          unassembledWidth: 0,
          unassembledDepth: 0,
          unassembledVolume: 0,
          commodityCode: undefined,
          code2: undefined,
          code3: undefined,
          channelApiIds: undefined,
          dateFormat: undefined,
        };

        if (isUpdate && despatchLabProductId) {
          // Update existing product
          await despatchLabProvider.updateProduct({
            id: despatchLabProductId,
            customerName: despatchLabConfig.customerName || "Unknown",
            typeName: "Product",
            ...productData,
          });
        } else {
          // Create new product
          despatchLabProductId = await despatchLabProvider.createProduct({
            customerId: customerId,
            sku: variant.sku,
            description: variant.title
              ? `${product.title} - ${variant.title}`
              : `${product.title} (${variant.sku})`,
            barcode: variant.barcode || variant.ean || variant.upc || undefined,
            type: "Product",
          });

          // Then update with complete configuration
          await despatchLabProvider.updateProduct({
            id: despatchLabProductId,
            customerName: despatchLabConfig.customerName || "Unknown",
            typeName: "Product",
            ...productData,
          });
        }

        // Store the DespatchLab product ID in variant metadata
        await productModule.updateProductVariants(variant.id, {
          metadata: {
            ...variant.metadata,
            despatchlab_product_id: despatchLabProductId,
            despatchlab_last_sync: new Date().toISOString(),
          },
        });

        syncedVariants.push({
          despatchLabProductId,
          productId: input.productId,
          variantId: variant.id,
          sku: variant.sku,
          companyId,
          isUpdate,
          syncedAt: new Date().toISOString(),
        });
      } catch (error) {
        errors.push({
          variantId: variant.id,
          sku: variant.sku || undefined,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const result: SyncAllProductVariantsOutput = {
      productId: input.productId,
      syncedVariants,
      totalVariants: variants.length,
      successfulSyncs: syncedVariants.length,
      errors,
    };

    return new StepResponse(result, {
      productId: input.productId,
      syncedVariants: syncedVariants,
      totalVariants: variants.length,
      successfulSyncs: syncedVariants.length,
      errors: errors,
    });
  },
  async (compensationInput) => {
    if (!compensationInput) return;

    console.log(
      `Compensating product sync for product ${compensationInput.productId}. ` +
        `Synced variants: ${compensationInput.syncedVariants?.length || 0}, ` +
        `Error variants: ${compensationInput.errors?.length || 0}`
    );

    // For now, we'll just log as the operations are generally safe
    // In the future, we could implement more sophisticated rollback logic
  }
);
