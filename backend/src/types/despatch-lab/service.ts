import { DespatchLabOrder } from "../../modules/despatch-lab/types";

/**
 * The main service interface for the DespatchLab Fulfillment Provider.
 */
export interface IDespatchLabService {
  /**
   * Retrieve a specific order from DespatchLab by its unique identifier
   */
  getOrder(orderId: string): Promise<DespatchLabOrder>;
}
