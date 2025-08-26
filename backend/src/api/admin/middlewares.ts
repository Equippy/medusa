import cors from "cors"
import { MiddlewareRoute } from "@medusajs/medusa";
import { defineMiddlewares } from "@medusajs/framework/http"
import { parseCorsOrigins } from "@medusajs/framework/utils"
import { ConfigModule } from "@medusajs/framework/types";

import { adminCompaniesMiddlewares } from "./companies/middlewares";
import { adminQuotesMiddlewares } from "./quotes/middlewares";
import { adminApprovalsMiddlewares } from "./approvals/middlewares";

import type { 
  MedusaNextFunction, 
  MedusaRequest, 
  MedusaResponse,
} from "@medusajs/framework/http"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminCompaniesMiddlewares,
  ...adminQuotesMiddlewares,
  ...adminApprovalsMiddlewares,
];

export default defineMiddlewares({
  routes: [
    {
      matcher: "/auth/*",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const configModule: ConfigModule = req.scope.resolve("configModule")
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next)
        },
      ],
    },
  ],
})
