"use client"

import { useEffect, useState } from "react"
import { ListEditor } from "@/components/listEditor"
import { createProduct, fetchProducts, updateProduct } from "@/services/productService"
import { Product } from "@/types"

export default function ProductListEditorPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts()
                setProducts(data)
            } catch (error) {
                console.error("Failed to load products:", error)
                setErrorMessage("Could not load products.")
            } finally {
                setIsLoading(false)
            }
        }

        loadProducts()
    }, [])

    const saveProductName = async (row: Product, newValue: string) => {
        const trimmedName = newValue.trim()
        if (!trimmedName) {
            throw new Error("Product name cannot be empty.")
        }

        const updated = await updateProduct(row.id, { name: trimmedName })
        setProducts((prev) =>
            prev.map((product) => (product.id === updated.id ? updated : product))
        )
    }

    const createNewProduct = async (newValue: string) => {
        const trimmedName = newValue.trim()
        if (!trimmedName) {
            throw new Error("Product name cannot be empty.")
        }

        const created = await createProduct(trimmedName)
        setProducts((prev) => [...prev, created])
    }

    return (
        <div className="mx-auto max-w-2xl space-y-4 p-6">
            <h1 className="text-xl font-semibold">Product List Editor</h1>
            <p className="text-sm text-muted-foreground">
                Edit product names inline and save each row.
            </p>

            {isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
            {!isLoading && (
                <ListEditor
                    items={products}
                    sortField="displayOrder"
                    editableField="name"
                    onSave={saveProductName}
                    onCreate={createNewProduct}
                    addButtonLabel="Add Product"
                    emptyMessage="No products found."
                />
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
