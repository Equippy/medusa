import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { syncFulfillmentStatusesWorkflow } from "../workflows/despatch-lab/workflows/sync-fulfillment-statuses";

export default async function syncDespatchLabFulfillmentStatuses(
  container: MedusaContainer
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  try {
    logger.info("[DespatchLab Sync Job] Starting fulfillment status sync...");

    const { result } = await syncFulfillmentStatusesWorkflow(container).run({
      input: {},
    });

    if (result.totalFulfillments === 0) {
      logger.info("[DespatchLab Sync Job] No fulfillments found needing sync");
      return;
    }

    // Log summary
    logger.info(
      `[DespatchLab Sync Job] Completed sync: ${result.successfulSyncs}/${result.totalFulfillments} fulfillments synced successfully`
    );

    // Log errors if any
    if (result.failedSyncs > 0) {
      logger.error(
        `[DespatchLab Sync Job] ${result.failedSyncs} fulfillments failed to sync:`
      );
      result.errors.forEach((error) => logger.error(`  - ${error}`));
    }
  } catch (error) {
    logger.error(
      "[DespatchLab Sync Job] Failed to execute sync workflow:",
      error
    );
    throw error;
  }
}

export const config = {
  name: "sync-despatchlab-fulfillment-statuses",
  schedule: "0 * * * *", // Run every hour
};
