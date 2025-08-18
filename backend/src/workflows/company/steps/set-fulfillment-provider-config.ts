import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import companyFulfillmentProvider from "../../../links/company-fulfillment-provider";
import { COMPANY_MODULE } from "../../../modules/company";

export interface SetFulfillmentProviderConfigInput {
  companyId: string;
  providerId: string;
  config?: {
    customerId?: string;
    depotId?: string;
    apiKey?: string;
    apiSecret?: string;
    [key: string]: any;
  };
  regions?: string[];
  is_default?: boolean;
}

export const setFulfillmentProviderConfigStep = createStep(
  "set-fulfillment-provider-config",
  async (input: SetFulfillmentProviderConfigInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Check if configuration already exists
    const { data: existingLinks } = await query.graph({
      entity: companyFulfillmentProvider.entryPoint,
      filters: {
        company_id: input.companyId,
        fulfillment_provider_id: input.providerId,
      },
      fields: ["company_id", "fulfillment_provider_id"],
    });

    if (existingLinks.length > 0) {
      // Update existing configuration by dismissing and recreating
      await link.dismiss({
        company: [input.companyId],
        fulfillment_provider: [input.providerId],
      });
    }

    // Create new or updated configuration
    await link.create({
      [COMPANY_MODULE]: {
        company_id: input.companyId,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: input.providerId,
      },
      data: {
        config: input.config,
        regions: input.regions,
        is_default: input.is_default || false,
      },
    });

    // If this is set as default, unset other defaults for this company
    if (input.is_default) {
      const { data: otherLinks } = await query.graph({
        entity: companyFulfillmentProvider.entryPoint,
        filters: {
          company_id: input.companyId,
          fulfillment_provider_id: { $ne: input.providerId },
          is_default: true,
        },
        fields: ["company_id", "fulfillment_provider_id", "config", "regions", "is_default"],
      });

      if (otherLinks.length > 0) {
        for (const otherLink of otherLinks) {
          await link.dismiss({
            company: [otherLink.company_id],
            fulfillment_provider: [otherLink.fulfillment_provider_id],
          });
          await link.create({
            [COMPANY_MODULE]: {
              company_id: otherLink.company_id,
            },
            [Modules.FULFILLMENT]: {
              fulfillment_provider_id: otherLink.fulfillment_provider_id,
            },
            data: {
              config: otherLink.config,
              regions: otherLink.regions,
              is_default: false,
            },
          });
        }
      }
    }

    return new StepResponse(
      {
        companyId: input.companyId,
        providerId: input.providerId,
        config: input.config,
        regions: input.regions,
        is_default: input.is_default,
      },
      {
        companyId: input.companyId,
        providerId: input.providerId,
      }
    );
  }
);