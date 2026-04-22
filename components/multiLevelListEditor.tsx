"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ListEditor } from "@/components/listEditor"
import { ProductLineWithModels } from "@/types/productHierarchy"

type MultiLevelListEditorProps = {
    items: ProductLineWithModels[]
    onSaveProductLine?: (productLine: ProductLineWithModels, newName: string) => Promise<void>
    onCreateProductLine?: (newName: string) => Promise<void>
    onSaveModel?: (
        productLine: ProductLineWithModels,
        model: ProductLineWithModels["models"][number],
        newName: string
    ) => Promise<void>
    onCreateModel?: (productLine: ProductLineWithModels, newName: string) => Promise<void>
    addProductLineLabel?: string
    addModelLabel?: string
    visibleChildProductLineId?: string | null
    onActiveStateChange?: (isActive: boolean) => void
    emptyMessage?: string
}

function sortableDisplayOrder(value: number | null | undefined): number {
    return typeof value === "number" ? value : Number.POSITIVE_INFINITY
}

export function MultiLevelListEditor({
    items,
    onSaveProductLine,
    onCreateProductLine,
    onCreateModel,
    onSaveModel,
    addProductLineLabel = "Add Product Line",
    addModelLabel = "Add Model",
    visibleChildProductLineId,
    onActiveStateChange,
    emptyMessage = "No product lines to display."
}: MultiLevelListEditorProps) {
    const PARENT_LOCK_KEY = "parent"
    const [expandedLineIds, setExpandedLineIds] = useState<Set<string>>(new Set())
    const [editingProductLineId, setEditingProductLineId] = useState<string | null>(null)
    const [productLineDraftName, setProductLineDraftName] = useState("")
    const [isSavingProductLine, setIsSavingProductLine] = useState(false)
    const [isAddingProductLine, setIsAddingProductLine] = useState(false)
    const [newProductLineName, setNewProductLineName] = useState("")
    const [isCreatingProductLine, setIsCreatingProductLine] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [activeEditorKey, setActiveEditorKey] = useState<string | null>(null)
    const newProductLineInputRef = useRef<HTMLInputElement | null>(null)

    const sortedProductLines = useMemo(() => {
        const clone = [...items]
        clone.sort((a, b) => {
            const orderA = sortableDisplayOrder(a.displayOrder)
            const orderB = sortableDisplayOrder(b.displayOrder)

            if (orderA !== orderB) {
                return orderA - orderB
            }

            return a.id.localeCompare(b.id)
        })

        return clone.map((line) => ({
            ...line,
            models: [...line.models].sort((a, b) => {
                const orderA = sortableDisplayOrder(a.displayOrder)
                const orderB = sortableDisplayOrder(b.displayOrder)

                if (orderA !== orderB) {
                    return orderA - orderB
                }

                return a.id.localeCompare(b.id)
            })
        }))
    }, [items])

    useEffect(() => {
        if (!visibleChildProductLineId) {
            return
        }

        setExpandedLineIds(new Set([visibleChildProductLineId]))
    }, [visibleChildProductLineId])

    const toggleExpanded = (productLineId: string) => {
        setExpandedLineIds((current) => {
            const next = new Set(current)

            if (next.has(productLineId)) {
                next.delete(productLineId)
            } else {
                next.add(productLineId)
            }

            return next
        })
    }

    const startEditingProductLine = (line: ProductLineWithModels) => {
        if (!onSaveProductLine) {
            return
        }
        if (activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY) {
            return
        }
        if (editingProductLineId !== null || isAddingProductLine) {
            return
        }

        setActiveEditorKey(PARENT_LOCK_KEY)
        setEditingProductLineId(line.id)
        setProductLineDraftName(line.name)
        setIsAddingProductLine(false)
        setNewProductLineName("")
        setErrorMessage("")
    }

    const saveProductLine = async (line: ProductLineWithModels) => {
        if (!onSaveProductLine) {
            return
        }

        setErrorMessage("")
        setIsSavingProductLine(true)

        try {
            await onSaveProductLine(line, productLineDraftName)
            setEditingProductLineId(null)
            setProductLineDraftName("")
            setActiveEditorKey(null)
        } catch (error) {
            console.error("MultiLevelListEditor product line save error:", error)
            setErrorMessage("Unable to save product line changes.")
        } finally {
            setIsSavingProductLine(false)
        }
    }

    const cancelEditingProductLine = () => {
        setEditingProductLineId(null)
        setProductLineDraftName("")
        setActiveEditorKey(null)
        setErrorMessage("")
    }

    const startAddingProductLine = () => {
        if (!onCreateProductLine) {
            return
        }
        if (activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY) {
            return
        }
        if (editingProductLineId !== null || isAddingProductLine) {
            return
        }

        setActiveEditorKey(PARENT_LOCK_KEY)
        setEditingProductLineId(null)
        setProductLineDraftName("")
        setIsAddingProductLine(true)
        setNewProductLineName("")
        setErrorMessage("")
    }

    const saveNewProductLine = async () => {
        if (!onCreateProductLine) {
            return
        }

        setErrorMessage("")
        setIsCreatingProductLine(true)

        try {
            await onCreateProductLine(newProductLineName)
            setIsAddingProductLine(false)
            setNewProductLineName("")
            setActiveEditorKey(null)
        } catch (error) {
            console.error("MultiLevelListEditor product line create error:", error)
            setErrorMessage("Unable to add product line.")
        } finally {
            setIsCreatingProductLine(false)
        }
    }

    const cancelAddingProductLine = () => {
        setIsAddingProductLine(false)
        setNewProductLineName("")
        setActiveEditorKey(null)
        setErrorMessage("")
    }

    const canEditParent = Boolean(onSaveProductLine)
    const canAddParent = Boolean(onCreateProductLine)
    const hasLocalParentActiveEditor = editingProductLineId !== null || isAddingProductLine
    const parentIsLocked = Boolean(activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY)
    const canStartParentAction = !parentIsLocked && !hasLocalParentActiveEditor
    const canSaveNewProductLine = newProductLineName.trim().length > 0
    const canSaveEditedProductLine = productLineDraftName.trim().length > 0

    useEffect(() => {
        onActiveStateChange?.(activeEditorKey !== null)
    }, [activeEditorKey, onActiveStateChange])

    const handleChildActiveStateChange = (childKey: string, isActive: boolean) => {
        setActiveEditorKey((current) => {
            if (isActive) {
                if (current && current !== childKey) {
                    return current
                }
                return childKey
            }

            return current === childKey ? null : current
        })
    }

    useEffect(() => {
        if (!isAddingProductLine) {
            return
        }

        newProductLineInputRef.current?.focus()
    }, [isAddingProductLine])

    if (sortedProductLines.length === 0 && !canAddParent) {
        return <div className="rounded border p-4 text-sm text-muted-foreground">{emptyMessage}</div>
    }

    return (
        <div className="space-y-3">
            {sortedProductLines.map((line) => {
                const isExpanded = expandedLineIds.has(line.id)
                const isEditing = editingProductLineId === line.id
                const showChildren = !visibleChildProductLineId || visibleChildProductLineId === line.id

                return (
                    <div key={line.id} className="rounded border p-3">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(line.id)}
                                className="w-8 px-0"
                            >
                                {isExpanded ? "v" : ">"}
                            </Button>

                            <div className="min-w-0 flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={productLineDraftName}
                                        onChange={(event) =>
                                            setProductLineDraftName(event.target.value)
                                        }
                                        className="w-full rounded border p-2"
                                    />
                                ) : (
                                    <div className="truncate">{line.name}</div>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => saveProductLine(line)}
                                        disabled={isSavingProductLine || !canSaveEditedProductLine}
                                    >
                                        {isSavingProductLine ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelEditingProductLine}
                                        disabled={isSavingProductLine}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : canEditParent ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => startEditingProductLine(line)}
                                    disabled={!canStartParentAction || isCreatingProductLine}
                                >
                                    Edit
                                </Button>
                            ) : null}
                        </div>

                        {isExpanded && showChildren && (
                            <div className="ml-8 mt-3 border-l pl-4">
                                <ListEditor
                                    items={line.models}
                                    sortField="displayOrder"
                                    editableField="name"
                                    interactionLocked={
                                        Boolean(activeEditorKey && activeEditorKey !== `child:${line.id}`)
                                    }
                                    onActiveStateChange={(isActive) =>
                                        handleChildActiveStateChange(`child:${line.id}`, isActive)
                                    }
                                    onSave={
                                        onSaveModel
                                            ? (model, newValue) => onSaveModel(line, model, newValue)
                                            : undefined
                                    }
                                    onCreate={
                                        onCreateModel
                                            ? (newValue) => onCreateModel(line, newValue)
                                            : undefined
                                    }
                                    addButtonLabel={addModelLabel}
                                    emptyMessage="No models for this product line."
                                />
                            </div>
                        )}
                    </div>
                )
            })}

            {canAddParent && isAddingProductLine && (
                <div className="flex items-center justify-between gap-3 rounded border p-3">
                    <div className="min-w-0 flex-1">
                        <input
                            ref={newProductLineInputRef}
                            type="text"
                            value={newProductLineName}
                            onChange={(event) => setNewProductLineName(event.target.value)}
                            className="w-full rounded border p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={saveNewProductLine}
                            disabled={isCreatingProductLine || !canSaveNewProductLine}
                        >
                            {isCreatingProductLine ? "Saving..." : "Save"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={cancelAddingProductLine}
                            disabled={isCreatingProductLine}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {canAddParent && !isAddingProductLine && (
                <Button
                    variant={sortedProductLines.length === 0 ? "default" : "outline"}
                    onClick={startAddingProductLine}
                    disabled={isCreatingProductLine || !canStartParentAction}
                >
                    {addProductLineLabel}
                </Button>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
