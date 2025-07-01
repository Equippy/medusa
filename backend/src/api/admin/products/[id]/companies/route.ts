import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";
// @ts-ignore
import { COMPANY_MODULE } from "../../../../../modules/company";
import { Modules } from "@medusajs/framework/utils";

const AssignCompaniesSchema = z.object({
  company_ids: z.array(z.string()),
});

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const { id } = req.params;

  // Get all company_ids linked to this product
  const links = await link.list({
    [Modules.PRODUCT]: {
      product_id: id,
    },
    [COMPANY_MODULE]: {
      company_id: undefined,
    },
  });

  // Get the company IDs from the links
  // const companyIds = links.map((l: any) => l.company_id).filter(Boolean);

  // // Fetch the companies
  // let companies: any[] = [];
  // if (companyIds.length > 0) {
  //   const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  //   const { data } = await query.graph(
  //     {
  //       entity: "companies",
  //       fields: ["id", "name", "created_at", "updated_at"],
  //       filters: { id: companyIds },
  //     },
  //     { throwIfKeyNotFound: false }
  //   );
  //   companies = data;
  // }

  res.json({ links });
};

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;
  const { company_ids } = AssignCompaniesSchema.parse(req.body);

  // Create links between product and companies
  await Promise.all(
    company_ids.map((company_id: string) =>
      link.create({
        [Modules.PRODUCT]: {
          product_id: id,
        },
        [COMPANY_MODULE]: {
          company_id,
        },
      })
    )
  );

  // Fetch the linked companies
  let companies: any[] = [];
  if (company_ids.length > 0) {
    const { data } = await query.graph(
      {
        entity: "companies",
        fields: ["id", "name", "created_at", "updated_at"],
        filters: { id: company_ids },
      },
      { throwIfKeyNotFound: false }
    );
    companies = data;
  }

  res.json({ companies });
}; 