"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createProductLine, fetchProducts } from "@/services/productService"
import { Product } from "@/types"

export default function CreateProductLinePage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [productLineName, setProductLineName] = useState("")
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts()
                setProducts(data)
            } catch (error) {
                console.error("Failed to fetch products:", error)
                setErrorMessage("Could not load products.")
            } finally {
                setIsLoadingProducts(false)
            }
        }

        loadProducts()
    }, [])

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage("")
        setSuccessMessage("")

        const trimmedName = productLineName.trim()
        if (!selectedProductId || !trimmedName) {
            setErrorMessage("Select a product and enter a product line name.")
            return
        }

        setIsSubmitting(true)
        try {
            const created = await createProductLine(selectedProductId, trimmedName)
            setSuccessMessage(`Created product line "${created.name}".`)
            setProductLineName("")
        } catch (error) {
            console.error("Failed to create product line:", error)
            setErrorMessage("Could not create product line.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-xl font-semibold">Create Product Line</h1>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label htmlFor="productId" className="block text-sm font-medium">
                        Product
                    </label>
                    <select
                        id="productId"
                        value={selectedProductId}
                        onChange={(event) => setSelectedProductId(event.target.value)}
                        disabled={isLoadingProducts}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="productLineName" className="block text-sm font-medium">
                        Product Line Name
                    </label>
                    <input
                        id="productLineName"
                        type="text"
                        value={productLineName}
                        onChange={(event) => setProductLineName(event.target.value)}
                        placeholder="Enter product line name"
                        className="w-full rounded border p-2"
                    />
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Product Line"}
                </Button>
            </form>

            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
            {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}
        </div>
    )
}
