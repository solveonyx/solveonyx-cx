import { fetchProducts } from "@/services/productService"
import { fetchProductHierarchy } from "@/services/productHierarchyService"

export default async function Page() {
  const products = await fetchProducts()

  // just grab the first product for testing
  const firstProduct = products[0]

  let hierarchy = []
  if (firstProduct) {
    hierarchy = await fetchProductHierarchy(firstProduct.id)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">TEST: Product Hierarchy</h1>

      {!firstProduct && <div>No products found</div>}

      {firstProduct && (
        <div>
          <h2 className="text-lg font-semibold">{firstProduct.name}</h2>

          {hierarchy.map((line) => (
            <div key={line.id} className="ml-4 mt-2">
              <div className="font-medium">{line.name}</div>

              {line.models.map((model) => (
                <div key={model.id} className="ml-4 text-sm">
                  {model.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}