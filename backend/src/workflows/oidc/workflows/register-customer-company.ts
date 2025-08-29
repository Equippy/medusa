import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/workflows-sdk";
import {
  createCustomerAccountWorkflow,
  findOrCreateCustomerStep,
} from "@medusajs/medusa/core-flows";
import { getCompanyByIdStep } from "../steps/get-company-by-id";

type RegisterCustomerCompanyInput = {
  authIdentityId: string
  customerData: {
    email: string
    first_name?: string
    last_name?: string
    org_id?: string
    // ...any other CreateCustomerDTO fields
  }
  additional_data?: Record<string, unknown> // pass-through if you need it for hooks elsewhere
}

export const registerCustomerCompanyWorkflow = createWorkflow(
  "register-customer-company",
  (input: RegisterCustomerCompanyInput) => {
    // const companyModuleService =
    //       container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    // const customer = createCustomerAccountWorkflow.runAsStep({
    //   input: {
    //     authIdentityId: input.authIdentityId,
    //     customerData: input.customerData,
    //   }
    // })

    if (!input.customerData.org_id) {
      throw new Error("Organization ID is required");
    }

    const { company } = getCompanyByIdStep({
      org_id: input.customerData.org_id,
    })

    if (!company) {
      throw new Error("Company not found");
    }

    // Try to find an existing customer by email (or create if you prefer)
    const { customer } = findOrCreateCustomerStep({
      email: input.customerData.email,
    })

    // If a registered customer already exists, just return it; otherwise create account
    const shouldCreate =
      !customer || (customer && !customer.has_account)

    const createdOrExisting = shouldCreate
      ? createCustomerAccountWorkflow.runAsStep({
          input: {
            authIdentityId: input.authIdentityId,
            customerData: input.customerData,
          },
        })
      : customer!



    // await createEmployeesWorkflow(container).run({
    //   input: {
    //     customerId: customerDE.id,
    //     employeeData: {
    //       customer_id: customerDE.id,
    //       company_id: companyDE.id,
    //       spending_limit: 0,
    //       is_admin: true,
    //     },
    //   },
    // });
    
    return new WorkflowResponse({
      createdOrExisting,
      additional_data: input.additional_data,
    })
  }
)
