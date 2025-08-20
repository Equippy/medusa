import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { getFulfillmentsNeedingSyncStep } from "../steps/get-fulfillments-needing-sync";
import {
  syncFulfillmentStatusesBatchStep,
  SyncFulfillmentStatusesBatchResult,
} from "../steps/sync-fulfillment-statuses-batch";

export const syncFulfillmentStatusesWorkflow = createWorkflow(
  "sync-despatchlab-fulfillment-statuses",
  (): WorkflowResponse<SyncFulfillmentStatusesBatchResult> => {
    const fulfillmentsNeedingSync = getFulfillmentsNeedingSyncStep();

    const syncResults = syncFulfillmentStatusesBatchStep({
      fulfillments: fulfillmentsNeedingSync,
    });

    return new WorkflowResponse(syncResults);
  }
);