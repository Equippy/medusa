import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  removeFulfillmentProviderConfigStep,
  RemoveFulfillmentProviderConfigInput,
} from "../steps/remove-fulfillment-provider-config";

export const removeCompanyFulfillmentProviderWorkflow = createWorkflow(
  "remove-company-fulfillment-provider",
  (input: RemoveFulfillmentProviderConfigInput) => {
    const result = removeFulfillmentProviderConfigStep(input);

    return new WorkflowResponse(result);
  }
);