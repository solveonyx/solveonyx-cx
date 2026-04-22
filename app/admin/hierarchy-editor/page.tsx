"use client"

import { useEffect, useMemo, useState } from "react"
import { MultiLevelListEditor } from "@/components/multiLevelListEditor"
import { fetchProductHierarchy } from "@/services/productHierarchyService"
import {
    createModel,
    createProductLine,
    fetchProducts,
    updateModel,
    updateProductLine
} from "@/services/productService"
import { Product } from "@/types"
import { ProductLineWithModels } from "@/types/productHierarchy"

export default function HierarchyEditorPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [productLines, setProductLines] = useState<ProductLineWithModels[]>([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false)
    const [isEditorActive, setIsEditorActive] = useState(false)
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
                setProductLines([])
                return
            }

            setErrorMessage("")
            setIsLoadingHierarchy(true)

            try {
                const lines = await fetchProductHierarchy(selectedProductId)
                setProductLines(lines)
            } catch (error) {
                console.error("Failed to load hierarchy:", error)
                setErrorMessage("Could not load product lines and models.")
            } finally {
                setIsLoadingHierarchy(false)
            }
        }

        loadHierarchy()
    }, [selectedProductId])

    const selectedProductName = useMemo(() => {
        return products.find((p) => p.id === selectedProductId)?.name ?? ""
    }, [products, selectedProductId])

    const saveProductLineName = async (line: ProductLineWithModels, newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Product line name cannot be empty.")
        }

        const updated = await updateProductLine(line.id, { name: trimmedName })
        setProductLines((prev) =>
            prev.map((item) =>
                item.id === updated.id
                    ? {
                        ...item,
                        name: updated.name,
                        productId: updated.productId,
                        displayOrder: updated.displayOrder
                    }
                    : item
            )
        )
    }

    const saveModelName = async (
        line: ProductLineWithModels,
        model: ProductLineWithModels["models"][number],
        newName: string
    ) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Model name cannot be empty.")
        }

        const updated = await updateModel(model.id, { name: trimmedName })
        setProductLines((prev) =>
            prev.map((item) => {
                if (item.id !== line.id) {
                    return item
                }

                return {
                    ...item,
                    models: item.models.map((m) =>
                        m.id === updated.id
                            ? {
                                ...m,
                                name: updated.name,
                                productLineId: updated.productLineId,
                                displayOrder: updated.displayOrder
                            }
                            : m
                    )
                }
            })
        )
    }

    const createModelForLine = async (line: ProductLineWithModels, newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Model name cannot be empty.")
        }

        const created = await createModel(line.id, trimmedName)
        setProductLines((prev) =>
            prev.map((item) =>
                item.id === line.id
                    ? {
                        ...item,
                        models: [...item.models, created]
                    }
                    : item
            )
        )
    }

    const createProductLineForProduct = async (newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Product line name cannot be empty.")
        }

        if (!selectedProductId) {
            throw new Error("Select a product first.")
        }

        const created = await createProductLine(selectedProductId, trimmedName)
        setProductLines((prev) => [...prev, { ...created, models: [] }])
    }

    return (
        <div className="mx-auto max-w-4xl space-y-4 p-6">
            <h1 className="text-xl font-semibold">Hierarchy List Editor</h1>
            <p className="text-sm text-muted-foreground">
                Select a product, then edit product lines and nested models inline.
            </p>

            <div className="space-y-1">
                <label htmlFor="productId" className="block text-sm font-medium">
                    Product
                </label>
                <select
                    id="productId"
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    disabled={isLoadingProducts || isEditorActive}
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

            {selectedProductName && (
                <p className="text-sm text-muted-foreground">
                    Showing product lines for: {selectedProductName}
                </p>
            )}

            {isLoadingHierarchy && (
                <p className="text-sm text-muted-foreground">Loading product hierarchy...</p>
            )}

            {!isLoadingHierarchy && (
                <MultiLevelListEditor
                    items={productLines}
                    onSaveProductLine={saveProductLineName}
                    onCreateProductLine={createProductLineForProduct}
                    onCreateModel={createModelForLine}
                    onSaveModel={saveModelName}
                    onActiveStateChange={setIsEditorActive}
                    emptyMessage="No product lines found for this product."
                />
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
