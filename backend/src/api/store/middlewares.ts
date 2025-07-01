import { MiddlewareRoute } from "@medusajs/framework";
import { storeApprovalsMiddlewares } from "./approvals/middlewares";
import { storeCartsMiddlewares } from "./carts/middlewares";
import { storeCompaniesMiddlewares } from "./companies/middlewares";
import { storeFreeShippingMiddlewares } from "./free-shipping/middlewares";
import { storeQuotesMiddlewares } from "./quotes/middlewares";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaRequest } from "@medusajs/framework"
import { COMPANY_MODULE } from "../../modules/company"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeFreeShippingMiddlewares,
  ...storeQuotesMiddlewares,
  ...storeApprovalsMiddlewares,
  ...storeCompaniesMiddlewares,
  {
    method: "ALL",
    matcher: "/store/products*",
    middlewares: [
      async (req: MedusaRequest, res, next) => {
        const companyService = req.scope.resolve(COMPANY_MODULE)
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        // Get the employee's company ID from the authenticated user
        const employee = await companyService.listEmployees({
          customer_id: req.user?.customer_id,
        })

        if (employee?.length > 0) {
          // Add company filter to the query
          req.filterableFields = {
            ...req.filterableFields,
            company_id: employee[0].company_id,
          }
        }

        next()
      },
    ],
  },
  {
    method: "ALL",
    matcher: "/store/variants*",
    middlewares: [
      async (req: MedusaRequest, res, next) => {
        const companyService = req.scope.resolve(COMPANY_MODULE)
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        // Get the employee's company ID from the authenticated user
        const employee = await companyService.listEmployees({
          customer_id: req.user?.customer_id,
        })

        if (employee?.length > 0) {
          // Add company filter to the query
          req.filterableFields = {
            ...req.filterableFields,
            company_id: employee[0].company_id,
          }
        }

        next()
      },
    ],
  },
  {
    method: "ALL",
    matcher: "/store/inventory*",
    middlewares: [
      async (req: MedusaRequest, res, next) => {
        const companyService = req.scope.resolve(COMPANY_MODULE)
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        // Get the employee's company ID from the authenticated user
        const employee = await companyService.listEmployees({
          customer_id: req.user?.customer_id,
        })

        if (employee?.length > 0) {
          // Add company filter to the query
          req.filterableFields = {
            ...req.filterableFields,
            company_id: employee[0].company_id,
          }
        }

        next()
      },
    ],
  },
];
