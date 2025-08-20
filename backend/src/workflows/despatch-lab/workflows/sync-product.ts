import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { syncAllProductVariantsStep } from "../steps/sync-all-product-variants";

export const syncProductToDespatchLabWorkflow = createWorkflow(
  "sync-product-to-despatch-lab",
  (input: { productId: string }) => {
    // Sync all product variants in a single step
    const results = syncAllProductVariantsStep(input);

    return new WorkflowResponse(results);
  }
);
