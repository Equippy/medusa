"use client"

import { HttpTypes } from "@medusajs/types"
import ProductVariantsTable from "../product-variants-table"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ProductActions({
  product,
  region,
}: ProductActionsProps) {
  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductVariantsTable product={product} region={region} />
      </div>
    </>
  )
}
