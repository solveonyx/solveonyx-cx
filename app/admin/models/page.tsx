"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    createModel,
    fetchProductLines,
    fetchProducts
} from "@/services/productService"
import { Product, ProductLine } from "@/types"

export default function CreateModelPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [productLines, setProductLines] = useState<ProductLine[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [selectedProductLineId, setSelectedProductLineId] = useState("")
    const [modelName, setModelName] = useState("")
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingLines, setIsLoadingLines] = useState(false)
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

    useEffect(() => {
        const loadProductLines = async () => {
            if (!selectedProductId) {
                setProductLines([])
                setSelectedProductLineId("")
                return
            }

            setIsLoadingLines(true)
            setErrorMessage("")
            setSuccessMessage("")
            setSelectedProductLineId("")

            try {
                const data = await fetchProductLines(selectedProductId)
                setProductLines(data)
            } catch (error) {
                console.error("Failed to fetch product lines:", error)
                setErrorMessage("Could not load product lines.")
            } finally {
                setIsLoadingLines(false)
            }
        }

        loadProductLines()
    }, [selectedProductId])

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage("")
        setSuccessMessage("")

        const trimmedModelName = modelName.trim()

        if (!selectedProductId || !selectedProductLineId || !trimmedModelName) {
            setErrorMessage("Select a product, select a product line, and enter a model name.")
            return
        }

        setIsSubmitting(true)
        try {
            const created = await createModel(selectedProductLineId, trimmedModelName)
            setSuccessMessage(`Created model "${created.name}".`)
            setModelName("")
        } catch (error) {
            console.error("Failed to create model:", error)
            setErrorMessage("Could not create model.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-xl font-semibold">Create Model</h1>

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
                    <label htmlFor="productLineId" className="block text-sm font-medium">
                        Product Line
                    </label>
                    <select
                        id="productLineId"
                        value={selectedProductLineId}
                        onChange={(event) => setSelectedProductLineId(event.target.value)}
                        disabled={!selectedProductId || isLoadingLines}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select a product line</option>
                        {productLines.map((line) => (
                            <option key={line.id} value={line.id}>
                                {line.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="modelName" className="block text-sm font-medium">
                        Model Name
                    </label>
                    <input
                        id="modelName"
                        type="text"
                        value={modelName}
                        onChange={(event) => setModelName(event.target.value)}
                        placeholder="Enter model name"
                        className="w-full rounded border p-2"
                    />
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Model"}
                </Button>
            </form>

            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
            {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}
        </div>
    )
}
