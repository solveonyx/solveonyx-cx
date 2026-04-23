"use client"

import { useEffect, useState } from "react"
import { ListEditor } from "@/components/listEditor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
        <div className="mx-auto max-w-3xl space-y-5 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Product List Editor</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Edit product names inline and save each row.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Maintain the top-level products shown across the admin tools.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ) : (
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
                </CardContent>
            </Card>

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertTitle>Unable to load products</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
