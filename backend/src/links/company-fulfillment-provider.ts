import CompanyModule from "../modules/company";
import FulfillmentModule from "@medusajs/medusa/fulfillment";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  CompanyModule.linkable.company,
  FulfillmentModule.linkable.fulfillmentProvider,
  {
    database: {
      extraColumns: {
        config: {
          type: "json",
          nullable: true,
        },
        regions: {
          type: "json", 
          nullable: true,
        },
        is_default: {
          type: "boolean",
          defaultValue: "false",
        },
      },
    },
  }
);