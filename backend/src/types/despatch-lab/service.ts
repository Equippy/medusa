import { Context, IModuleService } from "@medusajs/types";
import { DespatchLabOrder } from "../../modules/despatch-lab/types";

/**
 * The main service interface for the DespatchLab Module.
 */
export interface IDespatchLabModuleService extends IModuleService {
  /**
   * Retrieve a specific order from DespatchLab by its unique identifier
   */
  getOrder(
    orderId: string,
    sharedContext?: Context
  ): Promise<DespatchLabOrder>;
}