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
import { HierarchyEditorChild, HierarchyEditorParent, Product } from "@/types"
import { ProductLineWithModels } from "@/types/productHierarchy"

type ProductMgmtChild = HierarchyEditorChild & {
    productLineId: string
}

type ProductMgmtParent = HierarchyEditorParent<ProductMgmtChild> & {
    productId: string
}

function toEditorItems(items: ProductLineWithModels[]): ProductMgmtParent[] {
    return items.map((line) => ({
        id: line.id,
        productId: line.productId,
        name: line.name,
        displayOrder: line.displayOrder,
        children: line.models.map((model) => ({
            id: model.id,
            productLineId: model.productLineId,
            name: model.name,
            displayOrder: model.displayOrder
        }))
    }))
}

export default function ProductManagementPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [productLines, setProductLines] = useState<ProductMgmtParent[]>([])
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
                setProductLines(toEditorItems(lines))
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

    const saveProductLineName = async (line: ProductMgmtParent, newName: string) => {
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
        line: ProductMgmtParent,
        model: ProductMgmtChild,
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
                    children: item.children.map((m) =>
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

    const createModelForLine = async (line: ProductMgmtParent, newName: string) => {
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
                        children: [
                            ...item.children,
                            {
                                id: created.id,
                                productLineId: created.productLineId,
                                name: created.name,
                                displayOrder: created.displayOrder
                            }
                        ]
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
        setProductLines((prev) => [
            ...prev,
            {
                id: created.id,
                productId: created.productId,
                name: created.name,
                displayOrder: created.displayOrder,
                children: []
            }
        ])
    }

    const reorderProductLines = async (reorderedItems: ProductMgmtParent[]) => {
        const previous = productLines
        setProductLines(reorderedItems)

        try {
            await Promise.all(
                reorderedItems.map((line) =>
                    updateProductLine(line.id, { displayOrder: line.displayOrder })
                )
            )
        } catch (error) {
            console.error("Failed to reorder product lines:", error)
            setErrorMessage("Unable to save product line order.")
            setProductLines(previous)
        }
    }

    const reorderModelsForLine = async (
        line: ProductMgmtParent,
        reorderedModels: ProductMgmtChild[]
    ) => {
        const previous = productLines
        setProductLines((prev) =>
            prev.map((item) =>
                item.id === line.id
                    ? {
                        ...item,
                        children: reorderedModels
                    }
                    : item
            )
        )

        try {
            await Promise.all(
                reorderedModels.map((model) =>
                    updateModel(model.id, { displayOrder: model.displayOrder })
                )
            )
        } catch (error) {
            console.error("Failed to reorder models:", error)
            setErrorMessage("Unable to save model order.")
            setProductLines(previous)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-4 p-6">
            <h1 className="text-xl font-semibold">Product Management</h1>
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
                    onSaveParent={saveProductLineName}
                    onCreateParent={createProductLineForProduct}
                    onCreateChild={createModelForLine}
                    onSaveChild={saveModelName}
                    onReorderParents={reorderProductLines}
                    onReorderChildren={reorderModelsForLine}
                    onActiveStateChange={setIsEditorActive}
                    addParentLabel="Add Product Line"
                    addChildLabel="Add Model"
                    emptyMessage="No product lines found for this product."
                />
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
