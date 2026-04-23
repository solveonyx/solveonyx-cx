"use client"

import { useEffect, useState } from "react"
import { fetchProductHierarchy } from "@/services/productHierarchyService"
import { fetchProducts } from "@/services/productService"
import { Product } from "@/types"
import { ProductLineWithModels } from "@/types/productHierarchy"

export default function ProductHierarchyPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [hierarchy, setHierarchy] = useState<ProductLineWithModels[]>([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts()
                setProducts(data)
                if (data.length > 0) {
                    setSelectedProductId(data[0].id)
                }
            } catch (error) {
                console.error("Failed to load products:", error)
                setErrorMessage("Could not load products.")
            } finally {
                setIsLoadingProducts(false)
            }
        }

        loadProducts()
    }, [])

    useEffect(() => {
        const loadHierarchy = async () => {
            if (!selectedProductId) {
                setHierarchy([])
                return
            }

            setIsLoadingHierarchy(true)
            setErrorMessage("")

            try {
                const rows = await fetchProductHierarchy(selectedProductId)
                setHierarchy(rows)
            } catch (error) {
                console.error("Failed to load product hierarchy:", error)
                setErrorMessage("Could not load product hierarchy.")
            } finally {
                setIsLoadingHierarchy(false)
            }
        }

        loadHierarchy()
    }, [selectedProductId])

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-bold">Product Hierarchy</h1>

            <div className="space-y-1">
                <label htmlFor="productId" className="block text-sm font-medium">
                    Product
                </label>
                <select
                    id="productId"
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    disabled={isLoadingProducts || products.length === 0}
                    className="w-full max-w-sm rounded border p-2"
                >
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedProductId && !isLoadingProducts && <div>No products found</div>}

            {isLoadingHierarchy && (
                <p className="text-sm text-muted-foreground">Loading product hierarchy...</p>
            )}

            {!isLoadingHierarchy && hierarchy.length > 0 && (
                <div className="space-y-2">
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

            {!isLoadingHierarchy && selectedProductId && hierarchy.length === 0 && (
                <p className="text-sm text-muted-foreground">No product lines found for this product.</p>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
