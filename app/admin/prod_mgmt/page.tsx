"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAppShellLock } from "@/components/app-shell-lock-provider"
import { MultiLevelListEditor } from "@/components/multiLevelListEditor"
import { SelectionGallery } from "@/components/selectionGallery"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProductHierarchy } from "@/services/productHierarchyService"
import {
    createProduct,
    createModel,
    createProductLine,
    fetchProducts,
    updateProduct,
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
    const GALLERY_EDITOR_KEY = "products-gallery"
    const HIERARCHY_EDITOR_KEY = "product-hierarchy"
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [productLines, setProductLines] = useState<ProductMgmtParent[]>([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false)
    const [activeEditorKey, setActiveEditorKey] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const { setNavigationLocked } = useAppShellLock()

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

    const handleGalleryActiveStateChange = useCallback((isActive: boolean) => {
        setActiveEditorKey((current) => {
            if (isActive) {
                return current ?? GALLERY_EDITOR_KEY
            }

            return current === GALLERY_EDITOR_KEY ? null : current
        })
    }, [])

    const handleHierarchyActiveStateChange = useCallback((isActive: boolean) => {
        setActiveEditorKey((current) => {
            if (isActive) {
                return current ?? HIERARCHY_EDITOR_KEY
            }

            return current === HIERARCHY_EDITOR_KEY ? null : current
        })
    }, [])

    const galleryInteractionLocked = activeEditorKey !== null && activeEditorKey !== GALLERY_EDITOR_KEY
    const hierarchyInteractionLocked =
        activeEditorKey !== null && activeEditorKey !== HIERARCHY_EDITOR_KEY

    useEffect(() => {
        setNavigationLocked(activeEditorKey !== null)

        return () => {
            setNavigationLocked(false)
        }
    }, [activeEditorKey, setNavigationLocked])

    const saveProductName = async (product: Product, newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Product name cannot be empty.")
        }

        const updated = await updateProduct(product.id, { name: trimmedName })
        setProducts((prev) =>
            prev.map((item) =>
                item.id === updated.id
                    ? {
                        ...item,
                        name: updated.name,
                        displayOrder: updated.displayOrder
                    }
                    : item
            )
        )
    }

    const createNewProduct = async (newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Product name cannot be empty.")
        }

        const created = await createProduct(trimmedName)
        setProducts((prev) => [...prev, created])
        setSelectedProductId(created.id)
    }

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

    const reorderProducts = async (reorderedItems: Product[]) => {
        const previous = products
        setProducts(reorderedItems)

        try {
            await Promise.all(
                reorderedItems.map((product) =>
                    updateProduct(product.id, { displayOrder: product.displayOrder })
                )
            )
        } catch (error) {
            console.error("Failed to reorder products:", error)
            setErrorMessage("Unable to save product order.")
            setProducts(previous)
        }
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
        <div className="mx-auto flex h-screen w-full max-w-7xl flex-col gap-5 overflow-hidden p-6">
            <div className="shrink-0">
                <h1 className="text-2xl font-semibold tracking-tight">Product Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Select a product, then edit product lines and nested models inline.
                </p>
            </div>

            <div className="grid min-h-0 flex-1 gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
                <Card className="min-h-0 overflow-visible md:flex md:h-full md:flex-col">
                    <CardHeader>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Select the product scope.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 overflow-visible">
                        {isLoadingProducts ? (
                            <div className="h-full w-full max-w-60 space-y-2">
                                <Skeleton className="h-11 w-full" />
                                <Skeleton className="h-11 w-full" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                        ) : (
                            <SelectionGallery
                                items={products}
                                selectedId={selectedProductId}
                                getItemLabel={(product) => product.name}
                                onSelect={(product) => setSelectedProductId(product.id)}
                                onSave={saveProductName}
                                onCreate={createNewProduct}
                                onActiveStateChange={handleGalleryActiveStateChange}
                                addButtonLabel="Add Product"
                                reorder={{ onReorder: reorderProducts }}
                                disabled={galleryInteractionLocked}
                                className="h-full"
                                emptyMessage="No products found."
                            />
                        )}
                    </CardContent>
                </Card>

                <Card className="flex min-h-0 min-w-0 flex-col">
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle>Product Lines and Models</CardTitle>
                                <CardDescription>
                                    Expand a line to edit its models. Collapse all rows to reorder product lines.
                                </CardDescription>
                            </div>
                            {selectedProductName && (
                                <Badge variant="secondary">Showing: {selectedProductName}</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 overflow-y-auto">
                        {isLoadingHierarchy ? (
                            <div className="space-y-3">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-8 w-40" />
                            </div>
                        ) : (
                            <MultiLevelListEditor
                                items={productLines}
                                onSaveParent={saveProductLineName}
                                onCreateParent={createProductLineForProduct}
                                onCreateChild={createModelForLine}
                                onSaveChild={saveModelName}
                                onReorderParents={reorderProductLines}
                                onReorderChildren={reorderModelsForLine}
                                onActiveStateChange={handleHierarchyActiveStateChange}
                                interactionLocked={hierarchyInteractionLocked}
                                addParentLabel="Add Product Line"
                                addChildLabel="Add Model"
                                emptyMessage="No product lines found for this product."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {errorMessage && (
                <Alert variant="destructive" className="shrink-0">
                    <AlertTitle>Product management issue</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
