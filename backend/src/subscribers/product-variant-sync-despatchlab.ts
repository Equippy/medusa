import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { syncProductVariantToDespatchLabWorkflow } from "../workflows/despatch-lab/workflows/sync-product-variant";

export default async function ({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    // Get the variant to find the associated product ID
    const productModule = container.resolve(Modules.PRODUCT);
    const variant = await productModule.retrieveProductVariant(data.id);

    if (!variant) {
      console.warn(`Variant ${data.id} not found for DespatchLab sync`);
      return;
    }

    if (!variant.product_id) {
      console.warn(`Variant ${data.id} has no associated product_id for DespatchLab sync`);
      return;
    }

    await syncProductVariantToDespatchLabWorkflow(container).run({
      input: {
        productId: variant.product_id,
        variantId: data.id,
      },
    });
  } catch (error) {
    // Log error but don't fail - DespatchLab sync is non-critical
    console.error(`Failed to sync variant ${data.id} to DespatchLab:`, error);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-variant.created",
    "product-variant.updated",
  ],
};