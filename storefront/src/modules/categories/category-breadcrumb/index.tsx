import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import type { JSX } from "react"

const CategoryBreadcrumbItem = ({
  title,
  handle,
}: {
  title: string
  handle?: string
}) => {
  return (
    <li key={handle}>
      <LocalizedClientLink
        className="hover:text-ui-fg-interactive"
        href={handle ? `/categories/${handle}` : "/store"}
      >
        {title}
      </LocalizedClientLink>
    </li>
  )
}

const CategoryBreadcrumb = ({
  categories,
  category,
}: {
  categories: HttpTypes.StoreProductCategory[]
  category: HttpTypes.StoreProductCategory
}) => {
  const generateBreadcrumbs = (
    category: HttpTypes.StoreProductCategory
  ): JSX.Element[] => {
    let currentCategory: HttpTypes.StoreProductCategory | null = category
    const breadcrumbs: JSX.Element[] = []

    breadcrumbs.unshift(
      <CategoryBreadcrumbItem
        title={currentCategory.name}
        handle={currentCategory.handle}
        key={currentCategory.id}
      />
    )

    currentCategory =
      categories.find((c) => c.id === currentCategory?.parent_category_id) ||
      null

    while (currentCategory) {
      breadcrumbs.unshift(
        <li key={`separator-parent-${currentCategory.id}`}>{">"}</li>
      )

      breadcrumbs.unshift(
        <CategoryBreadcrumbItem
          title={currentCategory.name}
          handle={currentCategory.handle}
          key={currentCategory.id}
        />
      )

      currentCategory =
        categories.find((c) => c.id === currentCategory?.parent_category_id) ||
        null
    }

    breadcrumbs.unshift(<li key={`separator-parent-base`}>{">"}</li>)

    breadcrumbs.unshift(
      <CategoryBreadcrumbItem title="Products" key={`base`} />
    )

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs(category)

  return (
    <ul className="flex items-center gap-x-3 text-sm text-ui-fg-subtle">
      {breadcrumbs}
    </ul>
  )
}

export default CategoryBreadcrumb
