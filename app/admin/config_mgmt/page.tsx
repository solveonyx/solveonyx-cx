"use client"

import { useCallback, useEffect, useState } from "react"
import { useAppShellLock } from "@/components/app-shell-lock-provider"
import { DualColumnMultiLevelListEditor } from "@/components/dualColumnMultiLevelListEditor"
import { PillList } from "@/components/pillList"
import { Popup } from "@/components/popup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { popupDefinitions } from "@/lib/popupDefinitions"
import { fetchConfigHierarchy } from "@/services/configurableHierarchyService"
import {
    createConfig,
    createConfigOption,
    fetchConfigTypes,
    updateConfig,
    updateConfigOption
} from "@/services/configurableService"
import {
    createMapModelConfig,
    createMapProdConfig,
    createMapProdLineConfig,
    deleteMapModelConfig,
    deleteMapProdConfig,
    deleteMapProdLineConfig,
    fetchMapModelConfigs,
    fetchMapProdConfigs,
    fetchMapProdLineConfigs
} from "@/services/mapProdConfig"
import { fetchModels, fetchProductLines, fetchProducts } from "@/services/productService"
import { ConfigType, HierarchyEditorChild, HierarchyEditorParent, Model, Product, ProductLine } from "@/types"

type ConfigMgmtChild = HierarchyEditorChild & {
    configId: string
}

type ConfigMgmtParent = HierarchyEditorParent<ConfigMgmtChild> & {
    configTypeId: string
    configTypeName: string
}

const assignedProductLinesPopup = popupDefinitions.assignedProductLines
const assignedModelsPopup = popupDefinitions.assignedModels
const optionModelPlaceholderItems = [
    { id: "placeholder-model-1", name: "Model A" },
    { id: "placeholder-model-2", name: "Model B" },
    { id: "placeholder-model-3", name: "Model C" },
    { id: "placeholder-model-4", name: "Model D" }
]

function isSingleSelectConfig(line: ConfigMgmtParent): boolean {
    return line.configTypeName.trim().toLowerCase() === "single select"
}

function toEditorItems(
    configHierarchy: Awaited<ReturnType<typeof fetchConfigHierarchy>>,
    configTypeNameById: Map<string, string>
): ConfigMgmtParent[] {
    return configHierarchy.map((config) => ({
        id: config.id,
        configTypeId: config.configTypeId,
        configTypeName: config.configTypeName ?? configTypeNameById.get(config.configTypeId) ?? "",
        name: config.name,
        displayOrder: config.displayOrder,
        children: config.options.map((option) => ({
            id: option.id,
            configId: option.configId,
            name: option.name,
            displayOrder: option.displayOrder
        }))
    }))
}

type AssignedProductsEditorProps = {
    configId: string
    products: Product[]
    selectedProductIds: string[]
    onToggleProduct: (configId: string, product: Product, isSelected: boolean) => Promise<void>
    selectedProductLineIds: string[]
    onToggleProductLine: (
        configId: string,
        productId: string,
        line: ProductLine,
        isSelected: boolean
    ) => Promise<void>
    selectedModelIds: string[]
    onToggleModel: (configId: string, model: Model, isSelected: boolean) => Promise<void>
    interactionLocked: boolean
    isPersisting: boolean
}

function AssignedProductsEditor({
    configId,
    products,
    selectedProductIds,
    onToggleProduct,
    selectedProductLineIds,
    onToggleProductLine,
    selectedModelIds,
    onToggleModel,
    interactionLocked
    ,
    isPersisting
}: AssignedProductsEditorProps) {
    const [productLinesByProductId, setProductLinesByProductId] = useState<Record<string, ProductLine[]>>({})
    const [modelsByProductLineId, setModelsByProductLineId] = useState<Record<string, Model[]>>({})
    const [loadingProductLineIds, setLoadingProductLineIds] = useState<string[]>([])
    const [loadingModelProductLineIds, setLoadingModelProductLineIds] = useState<string[]>([])
    const [popupMessage, setPopupMessage] = useState("")
    const [isPopupOpen, setIsPopupOpen] = useState(false)

    const loadProductLines = useCallback(async (productId: string) => {
        setLoadingProductLineIds((current) =>
            current.includes(productId) ? current : [...current, productId]
        )

        try {
            const lines = await fetchProductLines(productId)
            setProductLinesByProductId((current) => ({
                ...current,
                [productId]: lines
            }))
        } catch (error) {
            console.error(`Failed to load product lines for product ${productId}:`, error)
            setProductLinesByProductId((current) => ({
                ...current,
                [productId]: []
            }))
        } finally {
            setLoadingProductLineIds((current) => current.filter((id) => id !== productId))
        }
    }, [])

    const loadModels = useCallback(async (productLineId: string) => {
        setLoadingModelProductLineIds((current) =>
            current.includes(productLineId) ? current : [...current, productLineId]
        )

        try {
            const models = await fetchModels(productLineId)
            setModelsByProductLineId((current) => ({
                ...current,
                [productLineId]: models
            }))
        } catch (error) {
            console.error(`Failed to load models for product line ${productLineId}:`, error)
            setModelsByProductLineId((current) => ({
                ...current,
                [productLineId]: []
            }))
        } finally {
            setLoadingModelProductLineIds((current) => current.filter((id) => id !== productLineId))
        }
    }, [])

    useEffect(() => {
        selectedProductIds.forEach((productId) => {
            if (productLinesByProductId[productId] || loadingProductLineIds.includes(productId)) {
                return
            }

            void loadProductLines(productId)
        })
    }, [loadProductLines, loadingProductLineIds, productLinesByProductId, selectedProductIds])

    useEffect(() => {
        selectedProductLineIds.forEach((productLineId) => {
            if (
                modelsByProductLineId[productLineId] ||
                loadingModelProductLineIds.includes(productLineId)
            ) {
                return
            }

            void loadModels(productLineId)
        })
    }, [loadModels, loadingModelProductLineIds, modelsByProductLineId, selectedProductLineIds])

    const handleProductToggle = useCallback(
        async (product: Product, isSelected: boolean) => {
            if (interactionLocked || isPersisting) {
                return
            }

            if (
                !isSelected &&
                !productLinesByProductId[product.id] &&
                !loadingProductLineIds.includes(product.id)
            ) {
                void loadProductLines(product.id)
            }

            await onToggleProduct(configId, product, isSelected)
        },
        [
            configId,
            interactionLocked,
            isPersisting,
            loadProductLines,
            loadingProductLineIds,
            onToggleProduct,
            productLinesByProductId
        ]
    )

    const handleProductLineToggle = useCallback(
        async (productId: string, line: ProductLine, isSelected: boolean) => {
            if (interactionLocked || isPersisting) {
                return
            }

            if (isSelected) {
                try {
                    const models = modelsByProductLineId[line.id] ?? await fetchModels(line.id)
                    const modelIdSet = new Set(models.map((model) => model.id))
                    const hasAssignedModels = selectedModelIds.some((modelId) => modelIdSet.has(modelId))

                    if (hasAssignedModels) {
                        setPopupMessage(
                            assignedModelsPopup.messageText.replace(
                                "{productLineName}",
                                line.name
                            )
                        )
                        setIsPopupOpen(true)
                        return
                    }
                } catch (error) {
                    console.error("Failed to validate product line removal:", error)
                    return
                }
            }

            await onToggleProductLine(configId, productId, line, isSelected)
        },
        [
            configId,
            interactionLocked,
            isPersisting,
            modelsByProductLineId,
            onToggleProductLine,
            selectedModelIds
        ]
    )

    const handleModelToggle = useCallback(
        async (model: Model, isSelected: boolean) => {
            if (interactionLocked || isPersisting) {
                return
            }

            await onToggleModel(configId, model, isSelected)
        },
        [configId, interactionLocked, isPersisting, onToggleModel]
    )

    const selectedProductLines = selectedProductIds
        .flatMap((productId) => productLinesByProductId[productId] ?? [])
        .filter((line) => selectedProductLineIds.includes(line.id))
        .sort((a, b) => {
            if (a.displayOrder !== b.displayOrder) {
                return a.displayOrder - b.displayOrder
            }

            return a.id.localeCompare(b.id)
        })

    const productLinesWithModels = selectedProductLines
        .map((productLine) => ({
            productLine,
            models: [...(modelsByProductLineId[productLine.id] ?? [])].sort((a, b) => {
                if (a.displayOrder !== b.displayOrder) {
                    return a.displayOrder - b.displayOrder
                }

                return a.id.localeCompare(b.id)
            })
        }))
        .filter(({ models }) => models.length > 0)

    const isLoadingAnyModels = selectedProductLineIds.some((productLineId) =>
        loadingModelProductLineIds.includes(productLineId)
    )

    return (
        <div className="space-y-3">
            <div className="rounded-lg border bg-muted/20 px-3 py-2">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Products
                </p>
                <PillList
                    items={products}
                    selectedIds={selectedProductIds}
                    getItemLabel={(product) => product.name}
                    onToggle={(product, isSelected) => {
                        void handleProductToggle(product, isSelected)
                    }}
                    disabled={interactionLocked || isPersisting}
                    emptyMessage="No products found."
                />
            </div>

            {selectedProductIds.length > 0 ? (
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Product Lines
                    </p>
                    <div className="space-y-2">
                        {selectedProductIds.map((productId, index) => {
                            const product = products.find((item) => item.id === productId)
                            const productLines = productLinesByProductId[productId] ?? []
                            const isLoadingLines = loadingProductLineIds.includes(productId)

                            if (!product) {
                                return null
                            }

                            return (
                                <div
                                    key={productId}
                                    className={index === 0 ? undefined : "pt-2"}
                                >
                                    {isLoadingLines ? (
                                        <div className="flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-32 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    ) : (
                                        <PillList
                                            items={productLines}
                                            selectedIds={productLines
                                                .filter((line) => selectedProductLineIds.includes(line.id))
                                                .map((line) => line.id)}
                                            getItemLabel={(line) => line.name}
                                            onToggle={(line, isSelected) => {
                                                void handleProductLineToggle(productId, line, isSelected)
                                            }}
                                            disabled={interactionLocked || isPersisting}
                                            emptyMessage="No product lines found."
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            {selectedProductLineIds.length > 0 ? (
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Models
                    </p>
                    {isLoadingAnyModels ? (
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {productLinesWithModels.map(({ productLine, models }, index) => {
                                return (
                                    <div
                                        key={productLine.id}
                                        className={index === 0 ? undefined : "pt-2"}
                                    >
                                        <PillList
                                            items={models}
                                            selectedIds={selectedModelIds}
                                            getItemLabel={(model) => model.name}
                                            onToggle={(model, isSelected) => {
                                                void handleModelToggle(model, isSelected)
                                            }}
                                            disabled={interactionLocked || isPersisting}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : null}

            <Popup
                open={isPopupOpen}
                title="Assigned Models"
                message={popupMessage}
                okLabel={assignedModelsPopup.buttonLabels[0]}
                onOk={() => setIsPopupOpen(false)}
            />
        </div>
    )
}

export default function ConfigurationManagementPage() {
    const CONFIG_EDITOR_KEY = "config-hierarchy"
    const [configLines, setConfigLines] = useState<ConfigMgmtParent[]>([])
    const [configTypes, setConfigTypes] = useState<ConfigType[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [assignedProductIdsByConfigId, setAssignedProductIdsByConfigId] = useState<
        Record<string, string[]>
    >({})
    const [assignedProductLineIdsByConfigId, setAssignedProductLineIdsByConfigId] = useState<
        Record<string, string[]>
    >({})
    const [assignedModelIdsByConfigId, setAssignedModelIdsByConfigId] = useState<
        Record<string, string[]>
    >({})
    const [persistingConfigIds, setPersistingConfigIds] = useState<string[]>([])
    const [defaultConfigTypeId, setDefaultConfigTypeId] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [activeEditorKey, setActiveEditorKey] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const [popupMessage, setPopupMessage] = useState("")
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const { setNavigationLocked } = useAppShellLock()

    useEffect(() => {
        const loadData = async () => {
            setErrorMessage("")
            setIsLoading(true)

            try {
                const [
                    products,
                    configTypesResult,
                    hierarchyResult,
                    prodConfigMappings,
                    prodLineConfigMappings,
                    modelConfigMappings
                ] = await Promise.all([
                    fetchProducts(),
                    fetchConfigTypes(),
                    fetchConfigHierarchy(),
                    fetchMapProdConfigs(),
                    fetchMapProdLineConfigs(),
                    fetchMapModelConfigs()
                ])

                const configTypeNameById = new Map(
                    configTypesResult.map((configType) => [configType.id, configType.name])
                )
                const nextAssignedProductIdsByConfigId = prodConfigMappings.reduce<Record<string, string[]>>(
                    (accumulator, mapping) => {
                        const currentProductIds = accumulator[mapping.configId] ?? []
                        accumulator[mapping.configId] = [...currentProductIds, mapping.prodId]
                        return accumulator
                    },
                    {}
                )
                const nextAssignedProductLineIdsByConfigId = prodLineConfigMappings.reduce<Record<string, string[]>>(
                    (accumulator, mapping) => {
                        const currentProductLineIds = accumulator[mapping.configId] ?? []
                        accumulator[mapping.configId] = [...currentProductLineIds, mapping.prodLineId]
                        return accumulator
                    },
                    {}
                )
                const nextAssignedModelIdsByConfigId = modelConfigMappings.reduce<Record<string, string[]>>(
                    (accumulator, mapping) => {
                        const currentModelIds = accumulator[mapping.configId] ?? []
                        accumulator[mapping.configId] = [...currentModelIds, mapping.modelId]
                        return accumulator
                    },
                    {}
                )
                setProducts(products)
                setConfigLines(toEditorItems(hierarchyResult, configTypeNameById))
                setConfigTypes(configTypesResult)
                setAssignedProductIdsByConfigId(nextAssignedProductIdsByConfigId)
                setAssignedProductLineIdsByConfigId(nextAssignedProductLineIdsByConfigId)
                setAssignedModelIdsByConfigId(nextAssignedModelIdsByConfigId)
                setDefaultConfigTypeId(configTypesResult[0]?.id ?? "")
            } catch (error) {
                console.error("Failed to load configuration hierarchy:", error)
                setErrorMessage("Could not load configurations, options, products, and mappings.")
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const saveConfigName = async (line: ConfigMgmtParent, newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Config name cannot be empty.")
        }

        const updated = await updateConfig(line.id, { name: trimmedName })
        setConfigLines((prev) =>
            prev.map((item) =>
                item.id === updated.id
                    ? {
                        ...item,
                        name: updated.name,
                        configTypeId: updated.configTypeId,
                        configTypeName: item.configTypeName,
                        displayOrder: updated.displayOrder
                    }
                    : item
            )
        )
    }

    const saveConfigType = async (line: ConfigMgmtParent, configTypeId: string) => {
        if (!configTypeId) {
            throw new Error("Config type is required.")
        }

        const updated = await updateConfig(line.id, { configTypeId })
        const nextTypeName =
            configTypeOptions.find((option) => option.value === configTypeId)?.label ?? line.configTypeName

        setConfigLines((prev) =>
            prev.map((item) =>
                item.id === updated.id
                    ? {
                        ...item,
                        configTypeId: updated.configTypeId,
                        configTypeName: nextTypeName,
                        name: updated.name,
                        displayOrder: updated.displayOrder
                    }
                    : item
            )
        )
    }

    const saveConfigOptionName = async (
        line: ConfigMgmtParent,
        model: ConfigMgmtChild,
        newName: string
    ) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Option name cannot be empty.")
        }

        const updated = await updateConfigOption(model.id, { name: trimmedName })
        setConfigLines((prev) =>
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
                                configId: updated.configId,
                                displayOrder: updated.displayOrder
                            }
                            : m
                    )
                }
            })
        )
    }

    const createOptionForConfig = async (line: ConfigMgmtParent, newName: string) => {
        if (!isSingleSelectConfig(line)) {
            throw new Error("Options are only available for Single Select configs.")
        }

        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Option name cannot be empty.")
        }

        const created = await createConfigOption(line.id, trimmedName)
        setConfigLines((prev) =>
            prev.map((item) =>
                item.id === line.id
                    ? {
                        ...item,
                        children: [
                            ...item.children,
                            {
                                id: created.id,
                                configId: created.configId,
                                name: created.name,
                                displayOrder: created.displayOrder
                            }
                        ]
                    }
                    : item
            )
        )
    }

    const createConfigItem = async (newName: string) => {
        const trimmedName = newName.trim()
        if (!trimmedName) {
            throw new Error("Config name cannot be empty.")
        }

        if (!defaultConfigTypeId) {
            throw new Error("No config type found. Create at least one config type first.")
        }

        const created = await createConfig(defaultConfigTypeId, trimmedName)
        setConfigLines((prev) => [
            ...prev,
            {
                id: created.id,
                configTypeId: created.configTypeId,
                configTypeName:
                    configTypeOptions.find((option) => option.value === created.configTypeId)?.label ?? "",
                name: created.name,
                displayOrder: created.displayOrder,
                children: []
            }
        ])
    }

    const configTypeOptions = configTypes.map((configType) => ({
        value: configType.id,
        label: configType.name
    }))

    const handleAssignedProductToggle = useCallback(
        async (configId: string, product: Product, isSelected: boolean) => {
            setErrorMessage("")

            if (isSelected) {
                try {
                    const productLines = await fetchProductLines(product.id)
                    const productLineIdSet = new Set(productLines.map((line) => line.id))
                    const hasAssignedChildProductLines = (assignedProductLineIdsByConfigId[configId] ?? []).some(
                        (productLineId) => productLineIdSet.has(productLineId)
                    )

                    if (hasAssignedChildProductLines) {
                        setPopupMessage(
                            assignedProductLinesPopup.messageText.replace(
                                "{productName}",
                                product.name
                            )
                        )
                        setIsPopupOpen(true)
                        return
                    }
                } catch (error) {
                    console.error("Failed to validate product removal:", error)
                    setErrorMessage("Unable to validate assigned product lines.")
                    return
                }
            }

            setPersistingConfigIds((current) =>
                current.includes(configId) ? current : [...current, configId]
            )

            try {
                if (isSelected) {
                    await deleteMapProdConfig(product.id, configId)
                    setAssignedProductIdsByConfigId((current) => ({
                        ...current,
                        [configId]: (current[configId] ?? []).filter((id) => id !== product.id)
                    }))
                } else {
                    await createMapProdConfig(product.id, configId)
                    setAssignedProductIdsByConfigId((current) => ({
                        ...current,
                        [configId]: [...(current[configId] ?? []), product.id]
                    }))
                }
            } catch (error) {
                console.error("Failed to persist product-config mapping:", error)
                setErrorMessage("Unable to update assigned products.")
            } finally {
                setPersistingConfigIds((current) => current.filter((id) => id !== configId))
            }
        },
        [assignedProductLineIdsByConfigId]
    )

    const handleAssignedProductLineToggle = useCallback(
        async (configId: string, _productId: string, line: ProductLine, isSelected: boolean) => {
            setErrorMessage("")
            setPersistingConfigIds((current) =>
                current.includes(configId) ? current : [...current, configId]
            )

            try {
                if (isSelected) {
                    await deleteMapProdLineConfig(line.id, configId)
                    setAssignedProductLineIdsByConfigId((current) => ({
                        ...current,
                        [configId]: (current[configId] ?? []).filter((id) => id !== line.id)
                    }))
                } else {
                    await createMapProdLineConfig(line.id, configId)
                    setAssignedProductLineIdsByConfigId((current) => ({
                        ...current,
                        [configId]: [...(current[configId] ?? []), line.id]
                    }))
                }
            } catch (error) {
                console.error("Failed to persist product-line-config mapping:", error)
                setErrorMessage("Unable to update assigned product lines.")
            } finally {
                setPersistingConfigIds((current) => current.filter((id) => id !== configId))
            }
        },
        []
    )

    const handleAssignedModelToggle = useCallback(
        async (configId: string, model: Model, isSelected: boolean) => {
            setErrorMessage("")
            setPersistingConfigIds((current) =>
                current.includes(configId) ? current : [...current, configId]
            )

            try {
                if (isSelected) {
                    await deleteMapModelConfig(model.id, configId)
                    setAssignedModelIdsByConfigId((current) => ({
                        ...current,
                        [configId]: (current[configId] ?? []).filter((id) => id !== model.id)
                    }))
                } else {
                    await createMapModelConfig(model.id, configId)
                    setAssignedModelIdsByConfigId((current) => ({
                        ...current,
                        [configId]: [...(current[configId] ?? []), model.id]
                    }))
                }
            } catch (error) {
                console.error("Failed to persist model-config mapping:", error)
                setErrorMessage("Unable to update assigned models.")
            } finally {
                setPersistingConfigIds((current) => current.filter((id) => id !== configId))
            }
        },
        []
    )

    const reorderConfigs = async (reorderedItems: ConfigMgmtParent[]) => {
        const previous = configLines
        setConfigLines(reorderedItems)

        try {
            await Promise.all(
                reorderedItems.map((line) =>
                    updateConfig(line.id, { displayOrder: line.displayOrder })
                )
            )
        } catch (error) {
            console.error("Failed to reorder configs:", error)
            setErrorMessage("Unable to save config order.")
            setConfigLines(previous)
        }
    }

    const reorderOptionsForConfig = async (
        line: ConfigMgmtParent,
        reorderedModels: ConfigMgmtChild[]
    ) => {
        const previous = configLines
        setConfigLines((prev) =>
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
                    updateConfigOption(model.id, { displayOrder: model.displayOrder })
                )
            )
        } catch (error) {
            console.error("Failed to reorder config options:", error)
            setErrorMessage("Unable to save option order.")
            setConfigLines(previous)
        }
    }

    const handleConfigEditorActiveStateChange = useCallback((isActive: boolean) => {
        setActiveEditorKey((current) => {
            if (isActive) {
                return current ?? CONFIG_EDITOR_KEY
            }

            return current === CONFIG_EDITOR_KEY ? null : current
        })
    }, [])

    const configEditorInteractionLocked =
        activeEditorKey !== null && activeEditorKey !== CONFIG_EDITOR_KEY

    useEffect(() => {
        setNavigationLocked(activeEditorKey !== null)

        return () => {
            setNavigationLocked(false)
        }
    }, [activeEditorKey, setNavigationLocked])

    return (
        <div className="mx-auto flex h-screen w-full max-w-5xl flex-col gap-5 overflow-hidden p-6">
            <div className="shrink-0">
                <h1 className="text-2xl font-semibold tracking-tight">Configuration Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Edit configs and nested config options inline.
                </p>
            </div>

            <Card className="flex min-h-0 flex-1 flex-col">
                <CardHeader>
                    <CardTitle>Configs and Options</CardTitle>
                    <CardDescription>Assign each config to a type and maintain its available options.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ) : (
                        <DualColumnMultiLevelListEditor
                            items={configLines}
                            secondaryColumn={{
                                label: "Config Type",
                                inputType: "select",
                                getValue: (parent) => parent.configTypeId,
                                getDisplayValue: (parent) => parent.configTypeName,
                                options: configTypeOptions,
                                onSave: saveConfigType
                            }}
                            onSaveParent={saveConfigName}
                            onCreateParent={createConfigItem}
                            onCreateChild={createOptionForConfig}
                            onSaveChild={saveConfigOptionName}
                            onReorderParents={reorderConfigs}
                            onReorderChildren={reorderOptionsForConfig}
                            canExpandParent={isSingleSelectConfig}
                            showParentSupplement
                            parentSupplementLabel="Assigned Products"
                            childSectionLabel="Options"
                            childRowSupplementLabel="Attached Models"
                            renderChildRowSupplement={() => (
                                <PillList
                                    items={optionModelPlaceholderItems}
                                    getItemLabel={(item) => item.name}
                                    emptyMessage="No models available."
                                />
                            )}
                            renderParentSupplement={(parent) => (
                                <AssignedProductsEditor
                                    configId={parent.id}
                                    products={products}
                                    selectedProductIds={assignedProductIdsByConfigId[parent.id] ?? []}
                                    onToggleProduct={handleAssignedProductToggle}
                                    selectedProductLineIds={assignedProductLineIdsByConfigId[parent.id] ?? []}
                                    onToggleProductLine={handleAssignedProductLineToggle}
                                    selectedModelIds={assignedModelIdsByConfigId[parent.id] ?? []}
                                    onToggleModel={handleAssignedModelToggle}
                                    interactionLocked={configEditorInteractionLocked}
                                    isPersisting={persistingConfigIds.includes(parent.id)}
                                />
                            )}
                            onActiveStateChange={handleConfigEditorActiveStateChange}
                            interactionLocked={configEditorInteractionLocked}
                            addParentLabel="Add Config"
                            addChildLabel="Add Option"
                            emptyMessage="No configs found."
                        />
                    )}
                </CardContent>
            </Card>

            {activeEditorKey !== null && (
                <Badge variant="outline" className="shrink-0">
                    Editing active. Finish or cancel to unlock other actions.
                </Badge>
            )}

            {errorMessage && (
                <Alert variant="destructive" className="shrink-0">
                    <AlertTitle>Configuration issue</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            <Popup
                open={isPopupOpen}
                title="Assigned Product Lines"
                message={popupMessage}
                okLabel={assignedProductLinesPopup.buttonLabels[0]}
                onOk={() => setIsPopupOpen(false)}
            />
        </div>
    )
}
