import { retrieveCustomer } from "@/lib/data/customer"
import AccountLayout from "@/modules/account/templates/account-layout"

export default async function AccountPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return <AccountLayout customer={customer}>{children}</AccountLayout>
}
