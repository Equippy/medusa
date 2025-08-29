import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export const getCompanyByIdStep = createStep(
  "get-company-by-id",
  async (input: { org_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: [company] } = await query.graph({
      entity: "company",
      fields: ["*"],
      filters: {
        "auth_id": input.org_id,
      },
    })

    return new StepResponse({company});
  }
);