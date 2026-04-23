"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ListEditor } from "@/components/listEditor"
import { useSortableList } from "@/hooks/useSortableList"
import { cn } from "@/lib/utils"
import { HierarchyEditorChild, HierarchyEditorParent } from "@/types"

type SecondaryOption = {
    label: string
    value: string
}

type ParentSecondaryColumn<TParent> = {
    label: string
    getValue: (parent: TParent) => string
    getDisplayValue?: (parent: TParent) => string
    onSave?: (parent: TParent, value: string) => Promise<void>
    inputType?: "text" | "select"
    options?: SecondaryOption[]
    placeholder?: string
}

type DualColumnMultiLevelListEditorProps<
    TChild extends HierarchyEditorChild,
    TParent extends HierarchyEditorParent<TChild>
> = {
    items: TParent[]
    secondaryColumn: ParentSecondaryColumn<TParent>
    onSaveParent?: (parent: TParent, newName: string) => Promise<void>
    onCreateParent?: (newName: string) => Promise<void>
    onSaveChild?: (parent: TParent, child: TChild, newName: string) => Promise<void>
    onCreateChild?: (parent: TParent, newName: string) => Promise<void>
    addParentLabel?: string
    addChildLabel?: string
    visibleChildParentId?: string | null
    onActiveStateChange?: (isActive: boolean) => void
    emptyMessage?: string
    onReorderParents?: (items: TParent[]) => void
    onReorderChildren?: (parent: TParent, items: TChild[]) => void
}

function sortableDisplayOrder(value: number | null | undefined): number {
    return typeof value === "number" ? value : Number.POSITIVE_INFINITY
}

export function DualColumnMultiLevelListEditor<
    TChild extends HierarchyEditorChild,
    TParent extends HierarchyEditorParent<TChild>
>({
    items,
    secondaryColumn,
    onSaveParent,
    onCreateParent,
    onCreateChild,
    onSaveChild,
    addParentLabel = "Add Parent",
    addChildLabel = "Add Child",
    visibleChildParentId,
    onActiveStateChange,
    emptyMessage = "No parent rows to display.",
    onReorderParents,
    onReorderChildren
}: DualColumnMultiLevelListEditorProps<TChild, TParent>) {
    const PARENT_LOCK_KEY = "parent"
    const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set())
    const [editingParentId, setEditingParentId] = useState<string | null>(null)
    const [parentDraftName, setParentDraftName] = useState("")
    const [secondaryDraftValue, setSecondaryDraftValue] = useState("")
    const [isSavingParent, setIsSavingParent] = useState(false)
    const [isAddingParent, setIsAddingParent] = useState(false)
    const [newParentName, setNewParentName] = useState("")
    const [isCreatingParent, setIsCreatingParent] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [activeEditorKey, setActiveEditorKey] = useState<string | null>(null)
    const newParentInputRef = useRef<HTMLInputElement | null>(null)

    const sortedParents = useMemo(() => {
        const clone = [...items]
        clone.sort((a, b) => {
            const orderA = sortableDisplayOrder(a.displayOrder)
            const orderB = sortableDisplayOrder(b.displayOrder)

            if (orderA !== orderB) {
                return orderA - orderB
            }

            return a.id.localeCompare(b.id)
        })

        return clone.map((parent) => ({
            ...parent,
            children: [...parent.children].sort((a, b) => {
                const orderA = sortableDisplayOrder(a.displayOrder)
                const orderB = sortableDisplayOrder(b.displayOrder)

                if (orderA !== orderB) {
                    return orderA - orderB
                }

                return a.id.localeCompare(b.id)
            })
        })) as TParent[]
    }, [items])

    useEffect(() => {
        if (!visibleChildParentId) {
            return
        }

        setExpandedParentIds(new Set([visibleChildParentId]))
    }, [visibleChildParentId])

    const toggleExpanded = (parentId: string) => {
        setExpandedParentIds((current) => {
            const next = new Set(current)

            if (next.has(parentId)) {
                next.delete(parentId)
            } else {
                next.add(parentId)
            }

            return next
        })
    }

    const startEditingParent = (parent: TParent) => {
        if (!onSaveParent && !secondaryColumn.onSave) {
            return
        }
        if (activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY) {
            return
        }
        if (editingParentId !== null || isAddingParent) {
            return
        }

        setActiveEditorKey(PARENT_LOCK_KEY)
        setEditingParentId(parent.id)
        setParentDraftName(parent.name)
        setSecondaryDraftValue(secondaryColumn.getValue(parent))
        setIsAddingParent(false)
        setNewParentName("")
        setErrorMessage("")
    }

    const saveParent = async (parent: TParent) => {
        if (!onSaveParent && !secondaryColumn.onSave) {
            return
        }

        setErrorMessage("")
        setIsSavingParent(true)

        try {
            if (onSaveParent && parentDraftName !== parent.name) {
                await onSaveParent(parent, parentDraftName)
            }
            if (secondaryColumn.onSave && secondaryDraftValue !== secondaryColumn.getValue(parent)) {
                await secondaryColumn.onSave(parent, secondaryDraftValue)
            }

            setEditingParentId(null)
            setParentDraftName("")
            setSecondaryDraftValue("")
            setActiveEditorKey(null)
        } catch (error) {
            console.error("DualColumnMultiLevelListEditor parent save error:", error)
            setErrorMessage("Unable to save changes.")
        } finally {
            setIsSavingParent(false)
        }
    }

    const cancelEditingParent = () => {
        setEditingParentId(null)
        setParentDraftName("")
        setSecondaryDraftValue("")
        setActiveEditorKey(null)
        setErrorMessage("")
    }

    const startAddingParent = () => {
        if (!onCreateParent) {
            return
        }
        if (activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY) {
            return
        }
        if (editingParentId !== null || isAddingParent) {
            return
        }

        setActiveEditorKey(PARENT_LOCK_KEY)
        setEditingParentId(null)
        setParentDraftName("")
        setSecondaryDraftValue("")
        setIsAddingParent(true)
        setNewParentName("")
        setErrorMessage("")
    }

    const saveNewParent = async () => {
        if (!onCreateParent) {
            return
        }

        setErrorMessage("")
        setIsCreatingParent(true)

        try {
            await onCreateParent(newParentName)
            setIsAddingParent(false)
            setNewParentName("")
            setActiveEditorKey(null)
        } catch (error) {
            console.error("DualColumnMultiLevelListEditor parent create error:", error)
            setErrorMessage("Unable to add item.")
        } finally {
            setIsCreatingParent(false)
        }
    }

    const cancelAddingParent = () => {
        setIsAddingParent(false)
        setNewParentName("")
        setActiveEditorKey(null)
        setErrorMessage("")
    }

    const canEditParent = Boolean(onSaveParent || secondaryColumn.onSave)
    const canAddParent = Boolean(onCreateParent)
    const hasLocalParentActiveEditor = editingParentId !== null || isAddingParent
    const parentIsLocked = Boolean(activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY)
    const canStartParentAction = !parentIsLocked && !hasLocalParentActiveEditor
    const canSaveNewParent = newParentName.trim().length > 0
    const canSaveEditedParent = parentDraftName.trim().length > 0
    const hasExpandedParent = expandedParentIds.size > 0 || Boolean(visibleChildParentId)
    const allParentsCollapsed = !hasExpandedParent
    const canReorderParents =
        Boolean(onReorderParents) &&
        sortedParents.length > 1 &&
        allParentsCollapsed &&
        activeEditorKey === null &&
        !isSavingParent &&
        !isCreatingParent
    const showParentReorderHandle = Boolean(onReorderParents) && sortedParents.length > 1

    const parentSortable = useSortableList(
        sortedParents,
        canReorderParents ? onReorderParents : undefined,
        canReorderParents
    )

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
        if (!isAddingParent) {
            return
        }

        newParentInputRef.current?.focus()
    }, [isAddingParent])

    if (sortedParents.length === 0 && !canAddParent) {
        return <div className="rounded border p-4 text-sm text-muted-foreground">{emptyMessage}</div>
    }

    return (
        <div className="space-y-3">
            <div
                className="space-y-3"
                ref={canReorderParents ? parentSortable.setContainerElement : undefined}
            >
                {sortedParents.map((parent, rowIndex) => {
                    const isExpanded = expandedParentIds.has(parent.id)
                    const isEditing = editingParentId === parent.id
                    const showChildren = !visibleChildParentId || visibleChildParentId === parent.id
                    const parentReorderIsAvailable = canReorderParents
                    const isDraggingRow = parentReorderIsAvailable && parentSortable.draggingId === parent.id
                    const showGapBefore =
                        parentReorderIsAvailable &&
                        parentSortable.isDragging &&
                        parentSortable.dropIndex === rowIndex &&
                        parentSortable.draggingId !== parent.id
                    const secondaryDisplayValue =
                        secondaryColumn.getDisplayValue?.(parent) ?? secondaryColumn.getValue(parent)

                    return (
                        <div key={parent.id} className="space-y-2">
                            {showGapBefore && (
                                <div className="h-2 rounded border-2 border-dashed border-accent/70 bg-accent/20" />
                            )}

                            <div
                                ref={
                                    parentReorderIsAvailable
                                        ? (node) => parentSortable.setItemElement(parent.id, node)
                                        : undefined
                                }
                                className={cn(
                                    "rounded border p-3 transition-[transform,box-shadow,background-color,opacity]",
                                    isDraggingRow && "pointer-events-none relative z-20 bg-accent opacity-70 shadow-lg will-change-transform !transition-none"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {showParentReorderHandle && (
                                        <button
                                            type="button"
                                            disabled={!parentReorderIsAvailable}
                                            onMouseDown={
                                                parentReorderIsAvailable
                                                    ? (event) =>
                                                        parentSortable.handleMouseDown(parent.id, event.nativeEvent)
                                                    : undefined
                                            }
                                            aria-label="Reorder row"
                                            className={cn(
                                                "mt-1 rounded px-2 py-1 text-muted-foreground transition-colors",
                                                parentReorderIsAvailable
                                                    ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                                                    : "cursor-not-allowed opacity-30"
                                            )}
                                        >
                                            &#8801;
                                        </button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpanded(parent.id)}
                                        className="mt-0.5 w-8 px-0"
                                    >
                                        {isExpanded ? "v" : ">"}
                                    </Button>

                                    <div className="min-w-0 flex-1">
                                        {isEditing ? (
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parentDraftName}
                                                        onChange={(event) =>
                                                            setParentDraftName(event.target.value)
                                                        }
                                                        className="w-full rounded border p-2"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        {secondaryColumn.label}
                                                    </label>
                                                    {secondaryColumn.inputType === "select" ? (
                                                        <select
                                                            value={secondaryDraftValue}
                                                            onChange={(event) =>
                                                                setSecondaryDraftValue(event.target.value)
                                                            }
                                                            className="w-full rounded border p-2"
                                                        >
                                                            {(secondaryColumn.options ?? []).map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={secondaryDraftValue}
                                                            placeholder={secondaryColumn.placeholder}
                                                            onChange={(event) =>
                                                                setSecondaryDraftValue(event.target.value)
                                                            }
                                                            className="w-full rounded border p-2"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="truncate font-medium">{parent.name}</div>
                                                <div className="truncate text-sm text-muted-foreground">
                                                    {secondaryDisplayValue || "N/A"}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <Button
                                                type="button"
                                                onClick={() => saveParent(parent)}
                                                disabled={isSavingParent || !canSaveEditedParent}
                                            >
                                                {isSavingParent ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={cancelEditingParent}
                                                disabled={isSavingParent}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : canEditParent ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => startEditingParent(parent)}
                                            disabled={!canStartParentAction || isCreatingParent}
                                        >
                                            Edit
                                        </Button>
                                    ) : null}
                                </div>

                                {isExpanded && showChildren && !isDraggingRow && (
                                    <div className="ml-8 mt-3 border-l pl-4">
                                        <ListEditor
                                            items={parent.children}
                                            sortField="displayOrder"
                                            editableField="name"
                                            interactionLocked={
                                                Boolean(activeEditorKey && activeEditorKey !== `child:${parent.id}`)
                                            }
                                            onActiveStateChange={(isActive) =>
                                                handleChildActiveStateChange(`child:${parent.id}`, isActive)
                                            }
                                            onSave={
                                                onSaveChild
                                                    ? (child, newValue) => onSaveChild(parent, child, newValue)
                                                    : undefined
                                            }
                                            onCreate={
                                                onCreateChild
                                                    ? (newValue) => onCreateChild(parent, newValue)
                                                    : undefined
                                            }
                                            reorder={
                                                onReorderChildren
                                                    ? {
                                                        onReorder: (children) =>
                                                            onReorderChildren(parent, children)
                                                    }
                                                    : undefined
                                            }
                                            addButtonLabel={addChildLabel}
                                            emptyMessage="No child rows for this parent."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {canReorderParents &&
                    parentSortable.isDragging &&
                    parentSortable.dropIndex === sortedParents.length && (
                        <div className="h-2 rounded border-2 border-dashed border-accent/70 bg-accent/20" />
                    )}
            </div>

            {canAddParent && isAddingParent && (
                <div className="flex items-center justify-between gap-3 rounded border p-3">
                    <div className="min-w-0 flex-1">
                        <input
                            ref={newParentInputRef}
                            type="text"
                            value={newParentName}
                            onChange={(event) => setNewParentName(event.target.value)}
                            className="w-full rounded border p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={saveNewParent} disabled={isCreatingParent || !canSaveNewParent}>
                            {isCreatingParent ? "Saving..." : "Save"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={cancelAddingParent}
                            disabled={isCreatingParent}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {canAddParent && !isAddingParent && (
                <Button
                    variant={sortedParents.length === 0 ? "default" : "outline"}
                    onClick={startAddingParent}
                    disabled={isCreatingParent || !canStartParentAction}
                >
                    {addParentLabel}
                </Button>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
