import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import DespatchLabService from "../../../modules/despatch-lab/service";
import { DespatchLabOrderCreateRequest } from "../../../modules/despatch-lab/types";

export interface CreateOrderInput {
  customerId: string;
  orderData: DespatchLabOrderCreateRequest;
}

export interface CreateOrderOutput {
  orderId: string;
}

export const createDespatchLabOrderStep = createStep(
  "create-despatch-lab-order",
  async (
    input: CreateOrderInput,
    { container }
  ): Promise<StepResponse<CreateOrderOutput, CreateOrderOutput>> => {
    const despatchLabService = container.resolve(
      DESPATCH_LAB_MODULE
    ) as DespatchLabService;

    try {
      const orderId = await despatchLabService.createOrder(
        input.orderData,
        input.customerId
      );

      const output: CreateOrderOutput = {
        orderId: orderId,
      };

      return new StepResponse(output, output);
    } catch (error) {
      throw new Error(
        `Failed to create DespatchLab order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  async (compensationData: CreateOrderOutput | undefined, { container }) => {
    if (!compensationData?.orderId) {
      return;
    }

    // TODO: Implement order cancellation/compensation when DespatchLab provides the API
    console.log(
      `[DespatchLab] Compensation: Should cancel order ${compensationData.orderId}`
    );

    // In the future, this would call a cancel order endpoint
    // const despatchLabService = container.resolve(DESPATCH_LAB_MODULE) as DespatchLabService;
    // await despatchLabService.cancelOrder(compensationData.orderId);
  }
);
