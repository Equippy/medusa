import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncProductToDespatchLabWorkflow } from "../workflows/despatch-lab/workflows/sync-product";

export default async function ({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    await syncProductToDespatchLabWorkflow(container).run({
      input: {
        productId: data.id,
      },
    });
  } catch (error) {
    // Log error but don't fail - DespatchLab sync is non-critical
    console.error(`Failed to sync product ${data.id} to DespatchLab:`, error);
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
};
