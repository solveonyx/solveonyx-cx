"use client"

import { useEffect, useState } from "react"
import { PillList } from "@/components/pillList"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProducts } from "@/services/productService"
import { Product } from "@/types"

export default function PillTestPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
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

    const toggleProduct = (product: Product, isSelected: boolean) => {
        setSelectedProductIds((current) => {
            if (isSelected) {
                return current.filter((id) => id !== product.id)
            }

            return [...current, product.id]
        })
    }

    return (
        <div className="mx-auto max-w-4xl space-y-5 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Pill Test</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Toggle products using the reusable pill list component.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Product pills are labeled from the prod_name field.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ) : (
                        <PillList
                            items={products}
                            selectedIds={selectedProductIds}
                            getItemLabel={(product) => product.name}
                            onToggle={toggleProduct}
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
