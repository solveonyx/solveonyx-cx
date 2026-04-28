"use client"

import { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { fetchModels, fetchProductLines } from "@/services/productService"
import type {
    ConfigWithOptions,
    MapModelConfig,
    MapModelConfigOption,
    MapProdConfig,
    MapProdLineConfig,
    Model,
    Product,
    ProductLine
} from "@/types"

type ConfigHierarchyContextFilterProps = {
    hierarchy: ConfigWithOptions[]
    products: Product[]
    prodConfigs: MapProdConfig[]
    prodLineConfigs: MapProdLineConfig[]
    modelConfigs: MapModelConfig[]
    modelConfigOptions: MapModelConfigOption[]
}

export function ConfigHierarchyContextFilter({
    hierarchy,
    products,
    prodConfigs,
    prodLineConfigs,
    modelConfigs,
    modelConfigOptions
}: ConfigHierarchyContextFilterProps) {
    const [selectedProductId, setSelectedProductId] = useState<string>("all")
    const [selectedProductLineId, setSelectedProductLineId] = useState<string>("all")
    const [selectedModelId, setSelectedModelId] = useState<string>("all")
    const [productLinesByProductId, setProductLinesByProductId] = useState<Record<string, ProductLine[]>>({})
    const [modelsByProductLineId, setModelsByProductLineId] = useState<Record<string, Model[]>>({})
    const mappedProductIdSet = useMemo(
        () => new Set(prodConfigs.map((mapping) => mapping.prodId)),
        [prodConfigs]
    )
    const mappedProductLineIdSet = useMemo(
        () => new Set(prodLineConfigs.map((mapping) => mapping.prodLineId)),
        [prodLineConfigs]
    )
    const mappedModelIdSet = useMemo(
        () => new Set(modelConfigOptions.map((mapping) => mapping.modelId)),
        [modelConfigOptions]
    )

    function handleProductChange(nextProductId: string) {
        setSelectedProductId(nextProductId)
        setSelectedProductLineId("all")
        setSelectedModelId("all")
    }

    function handleProductLineChange(nextProductLineId: string) {
        setSelectedProductLineId(nextProductLineId)
        setSelectedModelId("all")
    }

    useEffect(() => {
        let cancelled = false

        async function ensureProductLinesLoaded() {
            if (selectedProductId === "all" || productLinesByProductId[selectedProductId]) {
                return
            }

            try {
                const nextProductLines = (await fetchProductLines(selectedProductId))
                    .filter((productLine) => mappedProductLineIdSet.has(productLine.id))
                if (!cancelled) {
                    setProductLinesByProductId((current) => ({
                        ...current,
                        [selectedProductId]: nextProductLines
                    }))
                }
            } catch (error) {
                console.error("ensureProductLinesLoaded error:", error)
            }
        }

        void ensureProductLinesLoaded()

        return () => {
            cancelled = true
        }
    }, [mappedProductLineIdSet, productLinesByProductId, selectedProductId])

    useEffect(() => {
        let cancelled = false

        async function ensureModelsLoadedForSelectedLine() {
            if (selectedProductLineId === "all" || modelsByProductLineId[selectedProductLineId]) {
                return
            }

            try {
                const nextModels = (await fetchModels(selectedProductLineId))
                    .filter((model) => mappedModelIdSet.has(model.id))
                if (!cancelled) {
                    setModelsByProductLineId((current) => ({
                        ...current,
                        [selectedProductLineId]: nextModels
                    }))
                }
            } catch (error) {
                console.error("ensureModelsLoadedForSelectedLine error:", error)
            }
        }

        void ensureModelsLoadedForSelectedLine()

        return () => {
            cancelled = true
        }
    }, [mappedModelIdSet, modelsByProductLineId, selectedProductLineId])

    useEffect(() => {
        let cancelled = false

        async function ensureModelsLoadedForSelectedProduct() {
            if (selectedProductId === "all" || selectedProductLineId !== "all") {
                return
            }

            const productLines = productLinesByProductId[selectedProductId] ?? []
            const missingProductLines = productLines.filter((productLine) => !modelsByProductLineId[productLine.id])
            if (missingProductLines.length === 0) {
                return
            }

            try {
                const loadedModels = await Promise.all(
                    missingProductLines.map(async (productLine) => ({
                        productLineId: productLine.id,
                        models: (await fetchModels(productLine.id))
                            .filter((model) => mappedModelIdSet.has(model.id))
                    }))
                )

                if (!cancelled) {
                    setModelsByProductLineId((current) => {
                        const next = { ...current }
                        for (const entry of loadedModels) {
                            next[entry.productLineId] = entry.models
                        }
                        return next
                    })
                }
            } catch (error) {
                console.error("ensureModelsLoadedForSelectedProduct error:", error)
            }
        }

        void ensureModelsLoadedForSelectedProduct()

        return () => {
            cancelled = true
        }
    }, [mappedModelIdSet, modelsByProductLineId, productLinesByProductId, selectedProductId, selectedProductLineId])

    const sortedProducts = useMemo(
        () =>
            products
                .filter((product) => mappedProductIdSet.has(product.id))
                .sort((a, b) => a.displayOrder - b.displayOrder),
        [mappedProductIdSet, products]
    )

    const visibleProductLines = useMemo(
        () => productLinesByProductId[selectedProductId] ?? [],
        [productLinesByProductId, selectedProductId]
    )

    const visibleModels = useMemo(
        () => modelsByProductLineId[selectedProductLineId] ?? [],
        [modelsByProductLineId, selectedProductLineId]
    )

    const selectedProduct = useMemo(
        () => sortedProducts.find((product) => product.id === selectedProductId) ?? null,
        [selectedProductId, sortedProducts]
    )

    const selectedProductLine = useMemo(
        () => visibleProductLines.find((productLine) => productLine.id === selectedProductLineId) ?? null,
        [selectedProductLineId, visibleProductLines]
    )

    const selectedModel = useMemo(
        () => visibleModels.find((model) => model.id === selectedModelId) ?? null,
        [selectedModelId, visibleModels]
    )

    const overviewTitle = useMemo(() => {
        if (selectedModel) {
            return `${selectedModel.name} Configuration Hierarchy`
        }

        if (selectedProductLine) {
            return `${selectedProductLine.name} Configuration Hierarchy`
        }

        if (selectedProduct) {
            return `${selectedProduct.name} Configuration Hierarchy`
        }

        return "Configuration Hierarchy"
    }, [selectedModel, selectedProduct, selectedProductLine])

    const relevantModelIds = useMemo(() => {
        if (selectedModelId !== "all") {
            return new Set([selectedModelId])
        }

        if (selectedProductLineId !== "all") {
            return new Set((modelsByProductLineId[selectedProductLineId] ?? []).map((model) => model.id))
        }

        if (selectedProductId !== "all") {
            const productLines = productLinesByProductId[selectedProductId] ?? []
            return new Set(
                productLines.flatMap((productLine) =>
                    (modelsByProductLineId[productLine.id] ?? []).map((model) => model.id)
                )
            )
        }

        return null
    }, [
        modelsByProductLineId,
        productLinesByProductId,
        selectedModelId,
        selectedProductId,
        selectedProductLineId
    ])

    const filteredHierarchy = useMemo(() => {
        const prodConfigIds = selectedProductId === "all"
            ? null
            : new Set(
                prodConfigs
                    .filter((mapping) => mapping.prodId === selectedProductId)
                    .map((mapping) => mapping.configId)
            )

        const prodLineConfigIds = selectedProductLineId === "all"
            ? null
            : new Set(
                prodLineConfigs
                    .filter((mapping) => mapping.prodLineId === selectedProductLineId)
                    .map((mapping) => mapping.configId)
            )

        const modelConfigIds = relevantModelIds === null
            ? null
            : new Set(
                modelConfigs
                    .filter((mapping) => relevantModelIds.has(mapping.modelId))
                    .map((mapping) => mapping.configId)
            )

        const optionIdsByRelevantModels = relevantModelIds === null
            ? null
            : new Set(
                modelConfigOptions
                    .filter((mapping) => relevantModelIds.has(mapping.modelId))
                    .map((mapping) => mapping.configOptionId)
            )

        return hierarchy
            .filter((config) => {
                if (prodConfigIds && !prodConfigIds.has(config.id)) {
                    return false
                }

                if (prodLineConfigIds && !prodLineConfigIds.has(config.id)) {
                    return false
                }

                if (modelConfigIds && !modelConfigIds.has(config.id)) {
                    return false
                }

                return true
            })
            .map((config) => ({
                ...config,
                options: optionIdsByRelevantModels === null
                    ? config.options
                    : config.options.filter((option) => optionIdsByRelevantModels.has(option.id))
            }))
    }, [
        hierarchy,
        modelConfigOptions,
        modelConfigs,
        prodConfigs,
        prodLineConfigs,
        relevantModelIds,
        selectedProductId,
        selectedProductLineId
    ])

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">{overviewTitle}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Review configurables and options assigned to different products, product lines, and models.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <Select value={selectedProductId} onValueChange={handleProductChange}>
                        <SelectTrigger className="w-full min-w-[220px] disabled:cursor-default sm:w-1/3">
                            <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent position="popper" align="start">
                            <SelectItem value="all">All Products</SelectItem>
                            {sortedProducts.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select
                        value={selectedProductLineId}
                        onValueChange={handleProductLineChange}
                        disabled={selectedProductId === "all"}
                    >
                        <SelectTrigger className="w-full min-w-[220px] disabled:cursor-default sm:w-1/3">
                            <SelectValue placeholder="Product Line" />
                        </SelectTrigger>
                        <SelectContent position="popper" align="start">
                            <SelectItem value="all">All Product Lines</SelectItem>
                            {visibleProductLines.map((productLine) => (
                                <SelectItem key={productLine.id} value={productLine.id}>
                                    {productLine.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select
                        value={selectedModelId}
                        onValueChange={setSelectedModelId}
                        disabled={selectedProductLineId === "all"}
                    >
                        <SelectTrigger className="w-full min-w-[220px] disabled:cursor-default sm:w-1/3">
                            <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent position="popper" align="start">
                            <SelectItem value="all">All Models</SelectItem>
                            {visibleModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredHierarchy.length === 0 ? (
                <Alert>
                    <AlertTitle>No configs match the current filters</AlertTitle>
                    <AlertDescription>Adjust or clear the context filters to see more of the hierarchy.</AlertDescription>
                </Alert>
            ) : (
                <Card>
                    <CardContent className="space-y-4">
                        {filteredHierarchy.map((config, index) => (
                            <div key={config.id} className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-medium">{config.name}</div>
                                    {config.configTypeName && (
                                        <Badge variant="secondary">{config.configTypeName}</Badge>
                                    )}
                                </div>

                                {config.options.length > 0 && (
                                    <div className="ml-4 space-y-2 pl-4">
                                        {config.options.map((option) => (
                                            <div key={option.id} className="text-sm text-muted-foreground">
                                                {option.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {index < filteredHierarchy.length - 1 && <Separator />}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
