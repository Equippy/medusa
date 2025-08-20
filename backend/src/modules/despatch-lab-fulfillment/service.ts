import {
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  Logger,
} from "@medusajs/framework/types";
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import {
  createDespatchLabOrderWorkflow,
  CreateDespatchLabOrderWorkflowInput,
} from "../../workflows/despatch-lab";

type InjectedDependencies = {
  logger: Logger;
};

class DespatchLabFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "despatch-lab";
  private logger_: Logger;

  constructor({ logger }: InjectedDependencies) {
    super();
    this.logger_ = logger;
  }

  async calculatePrice(
    optionData: any,
    context: any
  ): Promise<CalculatedShippingOptionPrice> {
    return {
      calculated_amount: 0,
      is_calculated_price_tax_inclusive: true,
    };
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return true;
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    if (!order || !order.id) {
      throw new Error("Order with ID is required for DespatchLab fulfillment");
    }

    try {
      // Create the order in DespatchLab via workflow
      const { result: despatchLabOrder } =
        await createDespatchLabOrderWorkflow.run({
          input: {
            orderId: order.id,
          } as CreateDespatchLabOrderWorkflowInput,
        });

      this.logger_.info(
        `[DespatchLab] Created fulfillment for order ${order.id} with DespatchLab order ID ${despatchLabOrder.orderId}`
      );

      return {
        data: {
          despatchlab_order_id: despatchLabOrder.orderId,
          // Note: DespatchLab API only returns order ID initially
          // Tracking info would be available through separate API calls
        },
        labels: [], // No labels returned immediately from order creation
      };
    } catch (error) {
      this.logger_.error("[DespatchLab] Failed to create fulfillment:", error);
      throw error;
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    throw new Error("Not implemented");
  }

  async createReturnFulfillment(
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    throw new Error("Not implemented");
  }

  async getFulfillmentDocuments(
    data: Record<string, unknown>
  ): Promise<never[]> {
    return [];
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "standard",
        name: "Standard shipping",
        is_return: false,
      },
    ];
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    return {
      data,
    };
  }

  async validateOption(data: any): Promise<boolean> {
    return true;
  }
}

export default DespatchLabFulfillmentService;
