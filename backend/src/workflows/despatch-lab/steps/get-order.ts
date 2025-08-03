import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { DespatchLabOrder } from "../../../modules/despatch-lab/types";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import { IDespatchLabModuleService } from "../../../types";

export interface GetOrderInput {
  orderId: string;
}

export const getDespatchLabOrderStep = createStep(
  "get-despatch-lab-order",
  async (input: GetOrderInput, { container }) => {
    const despatchLabModuleService = container.resolve<IDespatchLabModuleService>(DESPATCH_LAB_MODULE);

    const order = await despatchLabModuleService.getOrder(input.orderId);

    return new StepResponse(order);
  }
);