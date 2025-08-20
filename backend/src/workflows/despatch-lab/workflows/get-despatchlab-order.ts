import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getDespatchLabOrderStep,
  GetOrderInput,
} from "../steps/get-despatchlab-order";

export const getDespatchLabOrderWorkflow = createWorkflow(
  "get-despatch-lab-order",
  (input: GetOrderInput) => {
    const order = getDespatchLabOrderStep(input);

    return new WorkflowResponse(order);
  }
);
