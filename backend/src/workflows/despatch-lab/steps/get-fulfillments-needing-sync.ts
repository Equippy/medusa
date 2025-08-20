import { FulfillmentDTO } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export interface FulfillmentNeedingSync {
  id: string;
  despatchlab_order_id: string;
  order_id?: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  metadata?: any;
}

export const getFulfillmentsNeedingSyncStep = createStep(
  "get-fulfillments-needing-sync",
  async (_, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    try {
      // Query fulfillments that have DespatchLab order ID but are not delivered
      const { data: fulfillments } = await query.graph({
        entity: "fulfillment",
        fields: [
          "id",
          "metadata",
          "shipped_at",
          "delivered_at",
          "order.*",
        ],
        filters: {
          delivered_at: null, // Not yet delivered
        },
      });

      // Filter fulfillments that have despatchlab_order_id in metadata
      const fulfillmentsNeedingSync: FulfillmentNeedingSync[] = fulfillments
        .filter(
          (fulfillment: any) =>
            fulfillment.metadata?.despatchlab_order_id &&
            typeof fulfillment.metadata.despatchlab_order_id === "string"
        )
        .map((fulfillment: any) => ({
          id: fulfillment.id,
          despatchlab_order_id: fulfillment.metadata.despatchlab_order_id as string,
          order_id: fulfillment.order?.id,
          shipped_at: fulfillment.shipped_at,
          delivered_at: fulfillment.delivered_at,
          metadata: fulfillment.metadata,
        }));

      logger.info(
        `[DespatchLab Sync] Found ${fulfillmentsNeedingSync.length} fulfillments needing sync`
      );

      return new StepResponse(fulfillmentsNeedingSync);
    } catch (error) {
      logger.error(
        `[DespatchLab Sync] Failed to get fulfillments needing sync:`,
        error
      );
      throw error;
    }
  }
);