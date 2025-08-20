import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { upsertDespatchLabProductVariantStep } from "../steps/upsert-product-variant";

export const syncProductVariantToDespatchLabWorkflow = createWorkflow(
  "sync-product-variant-to-despatch-lab",
  (input: { productId: string; variantId: string }) => {
    // Sync a specific product variant
    const result = upsertDespatchLabProductVariantStep(input);

    return new WorkflowResponse(result);
  }
);