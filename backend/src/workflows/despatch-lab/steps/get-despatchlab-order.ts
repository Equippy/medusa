import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import { IDespatchLabService } from "../../../types";

export interface GetOrderInput {
  orderId: string;
}

export const getDespatchLabOrderStep = createStep(
  "get-despatch-lab-order",
  async (input: GetOrderInput, { container }) => {
    const despatchLabProvider = container.resolve(
      DESPATCH_LAB_MODULE
    ) as IDespatchLabService;

    const order = await despatchLabProvider.getOrder(input.orderId);

    return new StepResponse(order);
  }
);
