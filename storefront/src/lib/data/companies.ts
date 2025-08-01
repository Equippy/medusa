"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
} from "@/lib/data/cookies"
import {
  CompanyAddress,
  StoreCompaniesResponse,
  StoreCompanyAddressesResponse,
  StoreCompanyAddressResponse,
  StoreCompanyResponse,
  StoreCreateCompany,
  StoreCreateCompanyAddress,
  StoreCreateEmployee,
  StoreEmployeeResponse,
  StoreUpdateCompany,
  StoreUpdateCompanyAddress,
  StoreUpdateEmployee,
} from "@/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"

export const retrieveCompany = async (companyId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("companies")),
  }

  const { company } = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${companyId}`,
    {
      query: {
        fields:
          "+spending_limit_reset_frequency,*employees.customer,*approval_settings",
      },
      method: "GET",
      headers,
      next,
    }
  )

  return company
}

export const createCompany = async (data: StoreCreateCompany) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const {
    companies: [company],
  } = await sdk.client.fetch<StoreCompaniesResponse>(`/store/companies`, {
    method: "POST",
    body: data,
    headers,
  })

  track("company_created", {
    company_id: company.id,
    company_name: company.name,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

export const updateCompany = async (data: StoreUpdateCompany) => {
  const { id, ...companyData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const company = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${id}`,
    {
      method: "POST",
      body: companyData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

export const createEmployee = async (data: StoreCreateEmployee) => {
  const { company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  track("employee_created", {
    employee_id: employee.employee.id,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const updateEmployee = async (data: StoreUpdateEmployee) => {
  const { id, company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees/${id}`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const deleteEmployee = async (companyId: string, employeeId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client.fetch(
    `/store/companies/${companyId}/employees/${employeeId}`,
    {
      method: "DELETE",
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}

export const updateApprovalSettings = async (
  companyId: string,
  requiresAdminApproval: boolean
) => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    Accept: "plain/text",
  }

  await sdk.client.fetch(`/store/companies/${companyId}/approval-settings`, {
    method: "POST",
    body: {
      requires_admin_approval: requiresAdminApproval,
    },
    headers,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}

export const listCompanyAddresses = async (): Promise<CompanyAddress[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("companies")),
  }

  const { addresses } = await sdk.client.fetch<StoreCompanyAddressesResponse>(
    `/store/companies/addresses`,
    {
      method: "GET",
      headers,
      next,
    }
  )

  return addresses
}

export const createCompanyAddress = async (
  data: StoreCreateCompanyAddress
): Promise<CompanyAddress> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const { address } = await sdk.client.fetch<StoreCompanyAddressResponse>(
    `/store/companies/addresses`,
    {
      method: "POST",
      body: data,
      headers,
    }
  )

  track("company_address_created", {
    address_id: address.id,
    label: address.label,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return address
}

export const updateCompanyAddress = async (
  data: StoreUpdateCompanyAddress
): Promise<CompanyAddress> => {
  const { id, ...addressData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const { address } = await sdk.client.fetch<StoreCompanyAddressResponse>(
    `/store/companies/addresses/${id}`,
    {
      method: "POST",
      body: addressData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return address
}

export const deleteCompanyAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client.fetch(`/store/companies/addresses/${addressId}`, {
    method: "DELETE",
    headers,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}
