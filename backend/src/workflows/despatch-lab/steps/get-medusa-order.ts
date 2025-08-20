import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export const getMedusaOrder = createStep(
  "get-medusa-order",
  async (id: string, { container }) => {
    const orderService = container.resolve(Modules.ORDER);

    const order = await orderService.retrieveOrder(id, {
      select: ["id", "display_id", "email", "metadata"],
      relations: ["items", "shipping_address"],
    });

    return new StepResponse(order);
  }
);
