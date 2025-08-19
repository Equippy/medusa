import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import companyFulfillmentProvider from "../../../links/company-fulfillment-provider";
import companyProduct from "../../../links/company-product";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import DespatchLabService from "../../../modules/despatch-lab/service";

export interface UpsertProductVariantInput {
  productId: string;
  variantId: string;
}

export const upsertDespatchLabProductVariantStep = createStep(
  "upsert-despatch-lab-product-variant",
  async (input: UpsertProductVariantInput, { container }) => {
    const despatchLabProvider = container.resolve(
      DESPATCH_LAB_MODULE
    ) as DespatchLabService;

    const productModule = container.resolve(Modules.PRODUCT);

    // Get the specific variant
    const variant = await productModule.retrieveProductVariant(
      input.variantId,
      {
        // select: ['*']
      }
    );

    console.log({ variant });

    if (!variant) {
      throw new Error(`Product variant ${input.variantId} not found`);
    }

    // Get the product details
    const product = await productModule.retrieveProduct(input.productId);

    if (!variant.sku) {
      throw new Error(`Product variant ${variant.id} has no SKU`);
    }

    // Get associated company via link
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
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

    // Use the first company link
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

    // Check if product already exists in DespatchLab (from variant metadata)
    let despatchLabProductId = variant.metadata
      ?.despatchlab_product_id as string;
    let isUpdate = !!despatchLabProductId;

    // Calculate volume if dimensions are available
    const volume =
      variant.height && variant.width && variant.length
        ? variant.height * variant.width * variant.length
        : 0;

    // Prepare complete product data with all available fields
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
      // Update existing product with complete data
      await despatchLabProvider.updateProduct({
        id: despatchLabProductId,
        customerName: despatchLabConfig.customerName || "Unknown",
        typeName: "Product",
        ...productData,
      });
    } else {
      // Create new product with basic fields only (API limitation)
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

    // Store the DespatchLab product ID in variant metadata for future syncs
    await productModule.updateProductVariants(variant.id, {
      metadata: {
        ...variant.metadata,
        despatchlab_product_id: despatchLabProductId,
        despatchlab_last_sync: new Date().toISOString(),
      },
    });

    return new StepResponse(
      {
        despatchLabProductId,
        productId: input.productId,
        variantId: input.variantId,
        sku: variant.sku,
        companyId,
        isUpdate,
        syncedAt: new Date().toISOString(),
      },
      {
        despatchLabProductId,
        productId: input.productId,
        variantId: input.variantId,
        wasUpdate: isUpdate,
      }
    );
  },
  async (compensationInput) => {
    if (!compensationInput) return;

    // Log compensation action
    console.log(
      `Compensating product variant ${compensationInput.wasUpdate ? "update" : "creation"} for variant ${compensationInput.variantId} in product ${compensationInput.productId}`
    );

    // For new products, we could potentially delete them from DespatchLab
    // For updates, we could try to revert to previous state
    // For now, we'll just log as the operations are generally safe
  }
);
