import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import DespatchLabFulfillmentService from "src/modules/despatch-lab/service";
import companyFulfillmentProvider from "../../../links/company-fulfillment-provider";

export interface CreateProductInput {
  productId: string;
}

export const createDespatchLabProductStep = createStep(
  "create-despatch-lab-product",
  async (input: CreateProductInput, { container }) => {
    const despatchLabProvider = container.resolve(
      DespatchLabFulfillmentService.identifier
    ) as DespatchLabFulfillmentService;

    const productModule = container.resolve(Modules.PRODUCT);

    // Get product details
    const product = await productModule.retrieveProduct(input.productId, {
      relations: ["variants"],
    });

    if (!product || !product.variants || product.variants.length === 0) {
      throw new Error(`Product ${input.productId} not found or has no variants`);
    }

    // Get the first variant for SKU and barcode
    const variant = product.variants[0];
    
    if (!variant.sku) {
      throw new Error(`Product variant ${variant.id} has no SKU`);
    }

    // Get associated company via link
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: companyProductLinks } = await query.graph({
      entity: "company_product_link",
      filters: {
        product_id: input.productId,
      },
      fields: ["company_id", "product_id"],
    });

    if (!companyProductLinks || companyProductLinks.length === 0) {
      throw new Error(`Product ${input.productId} is not associated with any company`);
    }

    // Use the first company link
    const companyId = companyProductLinks[0].company_id;
    
    // Get DespatchLab configuration for company using query
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
      throw new Error(`Company ${companyId} DespatchLab configuration missing customerId`);
    }

    const customerId = despatchLabConfig.customerId;

    // Create product in DespatchLab
    const despatchLabProductId = await despatchLabProvider.createProduct({
      customerId: customerId,
      sku: variant.sku,
      description: product.title,
      barcode: variant.barcode || variant.ean || undefined,
      type: "Product",
    });

    return new StepResponse(
      { despatchLabProductId, productId: input.productId, companyId },
      { despatchLabProductId, productId: input.productId }
    );
  },
  async (compensationInput) => {
    // Compensation logic - in a real implementation, you might want to
    // delete the product from DespatchLab if the overall workflow fails
    console.log(`Compensating product creation for product ${compensationInput?.productId}`);
    // For now, we'll just log as DespatchLab might not have a delete product API
  }
);