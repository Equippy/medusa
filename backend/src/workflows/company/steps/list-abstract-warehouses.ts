import { IStockLocationService } from "@medusajs/framework/types";
import { ModuleRegistrationName } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export const listAbstractWarehousesStep = createStep(
  "list-abstract-warehouses",
  async (_, { container }) => {
    const stockLocationService = container.resolve<IStockLocationService>(
      ModuleRegistrationName.STOCK_LOCATION
    );

    // Find all stock locations with is_abstract = true in metadata
    const stockLocations = await stockLocationService.listStockLocations(
      {},
      {
        select: ["id", "name", "metadata"],
        relations: ["address"],
      }
    );

    const abstractWarehouses = stockLocations.filter(
      (location) => location.metadata?.is_abstract === true
    );

    return new StepResponse(abstractWarehouses);
  }
);
