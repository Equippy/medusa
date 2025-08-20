import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import companyFulfillmentProvider from "../../../../../../links/company-fulfillment-provider";
import {
  AdminGetFulfillmentProviderConfigParamsType,
  AdminUpdateFulfillmentProviderConfigType,
} from "../../../validators";
import { setCompanyFulfillmentProviderWorkflow } from "../../../../../../workflows/company/workflows/set-fulfillment-provider";
import { removeCompanyFulfillmentProviderWorkflow } from "../../../../../../workflows/company/workflows/remove-fulfillment-provider";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetFulfillmentProviderConfigParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id: companyId, providerId } = req.params;

  const { data: configurations } = await query.graph({
    entity: companyFulfillmentProvider.entryPoint,
    filters: {
      company_id: companyId,
      fulfillment_provider_id: providerId,
    },
    fields: [
      "fulfillment_provider_id",
      "config",
      "regions",
      "is_default",
      "created_at",
      "updated_at",
    ],
  });

  if (!configurations || configurations.length === 0) {
    return res.status(404).json({
      error: `No configuration found for provider ${providerId}`,
    });
  }

  res.json({ fulfillment_provider_configuration: configurations[0] });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateFulfillmentProviderConfigType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id: companyId, providerId } = req.params;
  const { config, regions, is_default } = req.body;

  // Find existing configuration to get current values for undefined fields
  const { data: existingLinks } = await query.graph({
    entity: companyFulfillmentProvider.entryPoint,
    filters: {
      company_id: companyId,
      fulfillment_provider_id: providerId,
    },
    fields: [
      "company_id",
      "fulfillment_provider_id",
      "config",
      "regions",
      "is_default",
    ],
  });

  if (existingLinks.length === 0) {
    return res.status(404).json({
      error: `No configuration found for provider ${providerId}`,
    });
  }

  const currentConfig = existingLinks[0];

  // Use workflow to update configuration
  await setCompanyFulfillmentProviderWorkflow(req.scope).run({
    input: {
      companyId,
      providerId,
      config: config !== undefined ? config : currentConfig.config,
      regions: regions !== undefined ? regions : currentConfig.regions,
      is_default: is_default !== undefined ? is_default : currentConfig.is_default,
    },
  });

  const updateData: any = {};
  if (config !== undefined) updateData.config = config;
  if (regions !== undefined) updateData.regions = regions;
  if (is_default !== undefined) updateData.is_default = is_default;

  res.json({
    fulfillment_provider_configuration: {
      provider_id: providerId,
      ...updateData,
    },
  });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: companyId, providerId } = req.params;

  try {
    await removeCompanyFulfillmentProviderWorkflow(req.scope).run({
      input: {
        companyId,
        providerId,
      },
    });

    res.json({
      provider_id: providerId,
      object: "fulfillment_provider_configuration",
      deleted: true,
    });
  } catch (error: any) {
    if (error.message?.includes("No configuration found")) {
      return res.status(404).json({
        error: `No configuration found for provider ${providerId}`,
      });
    }
    throw error;
  }
};
