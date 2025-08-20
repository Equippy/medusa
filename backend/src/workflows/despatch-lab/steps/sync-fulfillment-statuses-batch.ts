import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  createOrderShipmentWorkflow,
  markFulfillmentAsDeliveredWorkflow,
} from "@medusajs/medusa/core-flows";
import { DESPATCH_LAB_MODULE } from "../../../modules/despatch-lab";
import DespatchLabService from "../../../modules/despatch-lab/service";
import { FulfillmentNeedingSync } from "./get-fulfillments-needing-sync";

export interface SyncFulfillmentStatusesBatchInput {
  fulfillments: FulfillmentNeedingSync[];
}

export interface SyncFulfillmentStatusesBatchResult {
  totalFulfillments: number;
  successfulSyncs: number;
  failedSyncs: number;
  errors: string[];
}

export const syncFulfillmentStatusesBatchStep = createStep(
  {
    name: "sync-fulfillment-statuses-batch",
    async: true, // Long-running step
  },
  async (input: SyncFulfillmentStatusesBatchInput, { container }) => {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT);
    const orderService = container.resolve(Modules.ORDER);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const despatchLabProvider = container.resolve(
      DESPATCH_LAB_MODULE
    ) as DespatchLabService;

    const { fulfillments } = input;
    const errors: string[] = [];
    let successfulSyncs = 0;
    let failedSyncs = 0;

    logger.info(`[DespatchLab Sync] Processing ${fulfillments.length} fulfillments...`);

    // Process fulfillments in series (one by one)
    for (const fulfillment of fulfillments) {
      try {
        // Get DespatchLab order details
        const despatchLabOrder = await despatchLabProvider.getOrder(
          fulfillment.despatchlab_order_id
        );

        // Prepare fulfillment metadata with DespatchLab information
        const fulfillmentMetadata = {
          ...fulfillment.metadata,
          despatchlab_status: despatchLabOrder.status,
          despatchlab_shipment_id: despatchLabOrder.shipmentId,
          despatchlab_tracking: despatchLabOrder.lastestTracking,
          despatchlab_last_sync: new Date().toISOString(),
        };

        // Update fulfillment metadata
        await fulfillmentService.updateFulfillment(fulfillment.id, {
          metadata: fulfillmentMetadata,
        });

        // Handle shipping status
        if (despatchLabOrder.shipmentId && !fulfillment.shipped_at) {
          // Get order details for shipment creation
          if (fulfillment.order_id) {
            const order = await orderService.retrieveOrder(fulfillment.order_id, {
              select: ["*"],
              relations: ["items"],
            });

            // Create shipment to mark fulfillment as shipped
            await createOrderShipmentWorkflow(container).run({
              input: {
                order_id: fulfillment.order_id,
                fulfillment_id: fulfillment.id,
                items: order.items || [],
                labels: [
                  {
                    label_url: "",
                    tracking_number: despatchLabOrder.lastestTracking || "",
                    tracking_url: "",
                  },
                ],
                metadata: {
                  despatchlab_shipment_id: despatchLabOrder.shipmentId,
                  despatchlab_tracking: despatchLabOrder.lastestTracking,
                },
              },
            });

            logger.debug(
              `[DespatchLab Sync] Created shipment for fulfillment ${fulfillment.id}`
            );
          }
        }

        // Handle delivery status
        if (despatchLabOrder.status === "Delivered" && !fulfillment.delivered_at) {
          await markFulfillmentAsDeliveredWorkflow(container).run({
            input: {
              id: fulfillment.id,
            },
          });

          logger.debug(
            `[DespatchLab Sync] Marked fulfillment ${fulfillment.id} as delivered`
          );
        }

        successfulSyncs++;
        
        logger.debug(
          `[DespatchLab Sync] Processed fulfillment ${fulfillment.id} with status: ${despatchLabOrder.status}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDescription = `Fulfillment ${fulfillment.id}: ${errorMessage}`;
        
        errors.push(errorDescription);
        failedSyncs++;
        
        logger.error(`[DespatchLab Sync] Failed to sync fulfillment ${fulfillment.id}: ${errorMessage}`);
      }
    }

    const result: SyncFulfillmentStatusesBatchResult = {
      totalFulfillments: fulfillments.length,
      successfulSyncs,
      failedSyncs,
      errors,
    };

    logger.info(
      `[DespatchLab Sync] Batch completed: ${successfulSyncs}/${fulfillments.length} fulfillments synced successfully`
    );

    if (failedSyncs > 0) {
      logger.warn(`[DespatchLab Sync] ${failedSyncs} fulfillments failed to sync`);
    }

    return new StepResponse(result);
  }
);