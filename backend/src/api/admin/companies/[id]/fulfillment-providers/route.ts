import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import companyFulfillmentProvider from "../../../../../links/company-fulfillment-provider";
import {
  AdminGetFulfillmentProviderConfigParamsType,
  AdminSetFulfillmentProviderConfigType,
} from "../../validators";
import { setCompanyFulfillmentProviderWorkflow } from "../../../../../workflows/company/workflows/set-fulfillment-provider";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetFulfillmentProviderConfigParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id: companyId } = req.params;

  const { data: configurations } = await query.graph({
    entity: companyFulfillmentProvider.entryPoint,
    filters: { company_id: companyId },
    fields: [
      "fulfillment_provider_id",
      "config",
      "regions", 
      "is_default",
      "created_at",
      "updated_at",
    ],
  });

  res.json({ fulfillment_provider_configurations: configurations });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetFulfillmentProviderConfigType>,
  res: MedusaResponse
) => {
  const { id: companyId } = req.params;
  const { provider_id, config, regions, is_default } = req.body;

  const result = await setCompanyFulfillmentProviderWorkflow(req.scope).run({
    input: {
      companyId,
      providerId: provider_id,
      config,
      regions,
      is_default,
    },
  });

  res.json({ 
    fulfillment_provider_configuration: {
      provider_id,
      config,
      regions,
      is_default,
    }
  });
};