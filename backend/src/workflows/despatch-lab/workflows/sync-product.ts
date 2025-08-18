import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { 
  createDespatchLabProductStep, 
  CreateProductInput 
} from "../steps/create-product";

export const syncProductToDespatchLabWorkflow = createWorkflow(
  "sync-product-to-despatch-lab",
  (input: CreateProductInput) => {
    const result = createDespatchLabProductStep(input);

    return new WorkflowResponse(result);
  }
);