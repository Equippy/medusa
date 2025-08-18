import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  setFulfillmentProviderConfigStep,
  SetFulfillmentProviderConfigInput,
} from "../steps/set-fulfillment-provider-config";

export const setCompanyFulfillmentProviderWorkflow = createWorkflow(
  "set-company-fulfillment-provider",
  (input: SetFulfillmentProviderConfigInput) => {
    const result = setFulfillmentProviderConfigStep(input);

    return new WorkflowResponse(result);
  }
);