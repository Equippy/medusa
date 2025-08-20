import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import companyFulfillmentProvider from "../../../links/company-fulfillment-provider";
import { COMPANY_MODULE } from "../../../modules/company";
import { Modules } from "@medusajs/framework/utils";

export interface RemoveFulfillmentProviderConfigInput {
  companyId: string;
  providerId: string;
}

export const removeFulfillmentProviderConfigStep = createStep(
  "remove-fulfillment-provider-config",
  async (input: RemoveFulfillmentProviderConfigInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Find existing configuration
    const { data: existingLinks } = await query.graph({
      entity: companyFulfillmentProvider.entryPoint,
      filters: {
        company_id: input.companyId,
        fulfillment_provider_id: input.providerId,
      },
      fields: ["company_id", "fulfillment_provider_id", "config", "regions", "is_default"],
    });

    if (existingLinks.length === 0) {
      throw new Error(
        `No configuration found for company ${input.companyId} and provider ${input.providerId}`
      );
    }

    const linkToDelete = existingLinks[0];

    // Delete configuration
    await link.dismiss({
      company: [input.companyId],
      fulfillment_provider: [input.providerId],
    });

    return new StepResponse(
      { 
        companyId: input.companyId, 
        providerId: input.providerId,
        deleted: true,
      },
      { 
        deletedLink: linkToDelete,
      }
    );
  },
  async (compensationInput, { container }) => {
    if (!compensationInput?.deletedLink) return;

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    
    // Restore the deleted link
    await link.create({
      [COMPANY_MODULE]: {
        company_id: compensationInput.deletedLink.company_id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: compensationInput.deletedLink.fulfillment_provider_id,
      },
      data: {
        config: compensationInput.deletedLink.config,
        regions: compensationInput.deletedLink.regions,
        is_default: compensationInput.deletedLink.is_default,
      },
    });
  }
);