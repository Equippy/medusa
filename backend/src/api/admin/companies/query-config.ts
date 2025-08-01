/* Company Query Config */
export const adminCompanyFields = [
  "id",
  "name",
  "logo_url",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "currency_code",
  "*employees",
];

export const adminCompanyQueryConfig = {
  list: {
    defaults: adminCompanyFields,
    isList: true,
  },
  retrieve: {
    defaults: adminCompanyFields,
    isList: false,
  },
};

/* Employee Query Config */
export const adminEmployeeFields = [
  "id",
  "spending_limit",
  "is_admin",
  "customer_id",
  "*customer",
  "company_id",
  "*company",
];

export const adminEmployeeQueryConfig = {
  list: {
    defaults: adminEmployeeFields,
    isList: true,
  },
  retrieve: {
    defaults: adminEmployeeFields,
    isList: false,
  },
};

/* Approval Settings Query Config */
export const adminApprovalSettingsFields = [
  "id",
  "company_id",
  "requires_admin_approval",
  "requires_sales_manager_approval",
  "*company",
];

export const adminApprovalSettingsQueryConfig = {
  list: {
    defaults: adminApprovalSettingsFields,
    isList: true,
  },
  retrieve: {
    defaults: adminApprovalSettingsFields,
    isList: false,
  },
};

/* Company Address Query Config */
export const adminCompanyAddressFields = [
  "id",
  "label",
  "address_1",
  "address_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "phone",
  "is_default",
  "company_id",
  "*company",
];

export const adminCompanyAddressQueryConfig = {
  list: {
    defaults: adminCompanyAddressFields,
    isList: true,
  },
  retrieve: {
    defaults: adminCompanyAddressFields,
    isList: false,
  },
};
