import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/workflows-sdk";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
// import { ICompanyModuleService } from "../../../modules/company";

type RegisterCustomerCompanyInput = {
  authIdentityId: string
  customerData: {
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    // ...any other CreateCustomerDTO fields
  }
  additional_data?: Record<string, unknown> // pass-through if you need it for hooks elsewhere
}

export const registerCustomerCompanyWorkflow = createWorkflow(
  "register-customer-company",
  (input: RegisterCustomerCompanyInput) => {
    // const companyModuleService =
    //       container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const customer = createCustomerAccountWorkflow.runAsStep({
      input: {
        authIdentityId: input.authIdentityId,
        customerData: input.customerData,
      }
    })



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
      customer,
      additional_data: input.additional_data,
    })
  }
)
