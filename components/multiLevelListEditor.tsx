"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListEditor } from "@/components/listEditor"
import { useSortableList } from "@/hooks/useSortableList"
import { cn } from "@/lib/utils"
import { HierarchyEditorChild, HierarchyEditorParent } from "@/types"

type MultiLevelListEditorProps<
    TChild extends HierarchyEditorChild,
    TParent extends HierarchyEditorParent<TChild>
> = {
    items: TParent[]
    onSaveParent?: (parent: TParent, newName: string) => Promise<void>
    onCreateParent?: (newName: string) => Promise<void>
    onSaveChild?: (parent: TParent, child: TChild, newName: string) => Promise<void>
    onCreateChild?: (parent: TParent, newName: string) => Promise<void>
    addParentLabel?: string
    addChildLabel?: string
    visibleChildParentId?: string | null
    onActiveStateChange?: (isActive: boolean) => void
    interactionLocked?: boolean
    emptyMessage?: string
    onReorderParents?: (items: TParent[]) => void
    onReorderChildren?: (parent: TParent, items: TChild[]) => void
    canExpandParent?: (parent: TParent) => boolean
}

function sortableDisplayOrder(value: number | null | undefined): number {
    return typeof value === "number" ? value : Number.POSITIVE_INFINITY
}

export function MultiLevelListEditor<
    TChild extends HierarchyEditorChild,
    TParent extends HierarchyEditorParent<TChild>
>({
    items,
    onSaveParent,
    onCreateParent,
    onCreateChild,
    onSaveChild,
    addParentLabel = "Add Parent",
    addChildLabel = "Add Child",
    visibleChildParentId,
    onActiveStateChange,
    interactionLocked = false,
    emptyMessage = "No parent rows to display.",
    onReorderParents,
    onReorderChildren,
    canExpandParent
}: MultiLevelListEditorProps<TChild, TParent>) {
    const PARENT_LOCK_KEY = "parent"
    const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set())
    const [editingParentId, setEditingParentId] = useState<string | null>(null)
    const [parentDraftName, setParentDraftName] = useState("")
    const [isSavingParent, setIsSavingParent] = useState(false)
    const [isAddingParent, setIsAddingParent] = useState(false)
    const [newParentName, setNewParentName] = useState("")
    const [isCreatingParent, setIsCreatingParent] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [activeEditorKey, setActiveEditorKey] = useState<string | null>(null)
    const newParentInputRef = useRef<HTMLInputElement | null>(null)
    const editParentInputRef = useRef<HTMLInputElement | null>(null)

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

    const isParentExpandable = useCallback((parent: TParent) => {
        return canExpandParent?.(parent) ?? true
    }, [canExpandParent])

    useEffect(() => {
        if (!visibleChildParentId) {
            return
        }

        const visibleParent = sortedParents.find((parent) => parent.id === visibleChildParentId)
        if (!visibleParent || !isParentExpandable(visibleParent)) {
            return
        }

        setExpandedParentIds(new Set([visibleChildParentId]))
    }, [isParentExpandable, sortedParents, visibleChildParentId])

    useEffect(() => {
        setExpandedParentIds((current) => {
            const expandableIds = new Set(
                sortedParents
                    .filter((parent) => isParentExpandable(parent))
                    .map((parent) => parent.id)
            )
            const next = new Set([...current].filter((id) => expandableIds.has(id)))

            return next.size === current.size ? current : next
        })
    }, [isParentExpandable, sortedParents])

    const toggleExpanded = (parent: TParent) => {
        if (interactionLocked) {
            return
        }

        if (!isParentExpandable(parent)) {
            return
        }

        setExpandedParentIds((current) => {
            const next = new Set(current)

            if (next.has(parent.id)) {
                next.delete(parent.id)
            } else {
                next.add(parent.id)
            }

            return next
        })
    }

    const startEditingParent = (parent: TParent) => {
        if (!onSaveParent) {
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
        setIsAddingParent(false)
        setNewParentName("")
        setErrorMessage("")
    }

    const saveParent = async (parent: TParent) => {
        if (!onSaveParent) {
            return
        }

        setErrorMessage("")
        setIsSavingParent(true)

        try {
            await onSaveParent(parent, parentDraftName)
            setEditingParentId(null)
            setParentDraftName("")
            setActiveEditorKey(null)
        } catch (error) {
            console.error("MultiLevelListEditor parent save error:", error)
            setErrorMessage("Unable to save changes.")
        } finally {
            setIsSavingParent(false)
        }
    }

    const cancelEditingParent = () => {
        setEditingParentId(null)
        setParentDraftName("")
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
            console.error("MultiLevelListEditor parent create error:", error)
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

    const canEditParent = Boolean(onSaveParent)
    const canAddParent = Boolean(onCreateParent)
    const hasLocalParentActiveEditor = editingParentId !== null || isAddingParent
    const parentIsLocked = interactionLocked || Boolean(activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY)
    const canStartParentAction = !parentIsLocked && !hasLocalParentActiveEditor
    const canSaveNewParent = newParentName.trim().length > 0
    const canSaveEditedParent = parentDraftName.trim().length > 0
    const hasExpandedParent = expandedParentIds.size > 0
    const allParentsCollapsed = !hasExpandedParent
    const canReorderParents =
        Boolean(onReorderParents) &&
        sortedParents.length > 1 &&
        allParentsCollapsed &&
        !interactionLocked &&
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

    useEffect(() => {
        if (editingParentId === null) {
            return
        }

        editParentInputRef.current?.focus()
    }, [editingParentId])

    if (sortedParents.length === 0 && !canAddParent) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div
                className="space-y-3"
                ref={canReorderParents ? parentSortable.setContainerElement : undefined}
            >
                {sortedParents.map((parent) => {
                    const canExpand = isParentExpandable(parent)
                    const isExpanded = canExpand && expandedParentIds.has(parent.id)
                    const isEditing = editingParentId === parent.id
                    const showChildren = canExpand && (!visibleChildParentId || visibleChildParentId === parent.id)
                    const parentReorderIsAvailable = canReorderParents
                    const isDraggingRow = parentReorderIsAvailable && parentSortable.draggingId === parent.id

                    return (
                        <div key={parent.id} className="space-y-2">
                            <div
                                ref={
                                    parentReorderIsAvailable
                                        ? (node) => parentSortable.setItemElement(parent.id, node)
                                        : undefined
                                }
                                className={cn(
                                    "rounded-lg border bg-card p-3 shadow-sm transition-[transform,box-shadow,background-color,opacity]",
                                    !isDraggingRow && "hover:bg-muted/20",
                                    isDraggingRow && "pointer-events-none relative z-20 bg-accent opacity-80 shadow-lg will-change-transform !transition-none"
                                )}
                            >
                                <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_72px] items-center gap-3">
                                    {showParentReorderHandle && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={!parentReorderIsAvailable}
                                            onMouseDown={
                                                parentReorderIsAvailable
                                                    ? (event) =>
                                                        parentSortable.handleMouseDown(parent.id, event.nativeEvent)
                                                    : undefined
                                            }
                                            aria-label="Reorder row"
                                            className={cn(
                                                "self-center text-muted-foreground",
                                                parentReorderIsAvailable
                                                    ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                                                    : "cursor-not-allowed opacity-30"
                                            )}
                                        >
                                            <GripVertical />
                                        </Button>
                                    )}

                                    {canExpand ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleExpanded(parent)}
                                            disabled={interactionLocked}
                                            className="self-center w-8 px-0"
                                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                        >
                                            {isExpanded ? <ChevronDown /> : <ChevronRight />}
                                        </Button>
                                    ) : (
                                        <span className="self-center w-8 shrink-0" aria-hidden="true" />
                                    )}

                                    <div className="flex min-w-0 min-h-[44px] items-center">
                                        {isEditing ? (
                                            <Input
                                                ref={editParentInputRef}
                                                type="text"
                                                value={parentDraftName}
                                                onChange={(event) => setParentDraftName(event.target.value)}
                                                className="w-full"
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    "flex h-8 items-center rounded-lg border border-transparent px-2.5 py-1 text-sm font-medium",
                                                    interactionLocked && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">{parent.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="flex w-[72px] items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => saveParent(parent)}
                                                disabled={isSavingParent || !canSaveEditedParent}
                                                aria-label={isSavingParent ? "Saving" : "Save changes"}
                                                className="bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
                                            >
                                                <Save />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={cancelEditingParent}
                                                disabled={isSavingParent}
                                                aria-label="Cancel editing"
                                                className="bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
                                            >
                                                <X />
                                            </Button>
                                        </div>
                                    ) : canEditParent ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => startEditingParent(parent)}
                                            disabled={!canStartParentAction || isCreatingParent}
                                            aria-label={`Edit ${parent.name}`}
                                            className="justify-self-end self-center bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
                                        >
                                            <Pencil />
                                        </Button>
                                    ) : (
                                        <div className="w-[72px]" />
                                    )}
                                </div>

                                {isExpanded && showChildren && !isDraggingRow && (
                                    <div className="ml-8 mt-3 border-l pl-4">
                                        <ListEditor<TChild>
                                            items={parent.children}
                                            sortField="displayOrder"
                                            editableField="name"
                                            interactionLocked={
                                                interactionLocked ||
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
            </div>

            {canAddParent && isAddingParent && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                        <Input
                            ref={newParentInputRef}
                            type="text"
                            value={newParentName}
                            onChange={(event) => setNewParentName(event.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={saveNewParent} disabled={isCreatingParent || !canSaveNewParent}>
                            <Save />
                            {isCreatingParent ? "Saving..." : "Save"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={cancelAddingParent}
                            disabled={isCreatingParent}
                        >
                            <X />
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
                    <Plus />
                    {addParentLabel}
                </Button>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
