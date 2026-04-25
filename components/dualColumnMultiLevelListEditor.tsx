"use client"

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
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
    interactionLocked?: boolean
    emptyMessage?: string
    onReorderParents?: (items: TParent[]) => void
    onReorderChildren?: (parent: TParent, items: TChild[]) => void
    canExpandParent?: (parent: TParent) => boolean
    showParentSupplement?: boolean
    parentSupplementLabel?: string
    renderParentSupplement?: (parent: TParent) => ReactNode
    childSectionLabel?: string
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
    interactionLocked = false,
    emptyMessage = "No parent rows to display.",
    onReorderParents,
    onReorderChildren,
    canExpandParent,
    showParentSupplement = false,
    parentSupplementLabel = "Details",
    renderParentSupplement,
    childSectionLabel = "Items"
}: DualColumnMultiLevelListEditorProps<TChild, TParent>) {
    const PARENT_LOCK_KEY = "parent"
    const [expandedSection, setExpandedSection] = useState<{
        parentId: string
        type: "child" | "supplement"
    } | null>(null)
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

        setExpandedSection({
            parentId: visibleChildParentId,
            type: "child"
        })
    }, [isParentExpandable, sortedParents, visibleChildParentId])

    useEffect(() => {
        setExpandedSection((current) => {
            if (!current) {
                return current
            }

            if (current.type !== "child") {
                return sortedParents.some((parent) => parent.id === current.parentId) ? current : null
            }

            const expandedParent = sortedParents.find((parent) => parent.id === current.parentId)
            if (!expandedParent || !isParentExpandable(expandedParent)) {
                return null
            }

            return current
        })
    }, [isParentExpandable, sortedParents])

    const toggleChildExpanded = (parent: TParent) => {
        if (interactionLocked) {
            return
        }

        if (!isParentExpandable(parent)) {
            return
        }

        setExpandedSection((current) => {
            if (current?.parentId === parent.id && current.type === "child") {
                return null
            }

            return {
                parentId: parent.id,
                type: "child"
            }
        })
    }

    const toggleSupplementExpanded = (parentId: string) => {
        if (interactionLocked) {
            return
        }

        setExpandedSection((current) => {
            if (current?.parentId === parentId && current.type === "supplement") {
                return null
            }

            return {
                parentId,
                type: "supplement"
            }
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
    const parentIsLocked = interactionLocked || Boolean(activeEditorKey && activeEditorKey !== PARENT_LOCK_KEY)
    const canStartParentAction = !parentIsLocked && !hasLocalParentActiveEditor
    const canSaveNewParent = newParentName.trim().length > 0
    const canSaveEditedParent = parentDraftName.trim().length > 0
    const allParentsCollapsed = expandedSection === null
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
                    const isChildExpanded =
                        canExpand &&
                        expandedSection?.parentId === parent.id &&
                        expandedSection.type === "child"
                    const isEditing = editingParentId === parent.id
                    const showChildren = canExpand && (!visibleChildParentId || visibleChildParentId === parent.id)
                    const parentReorderIsAvailable = canReorderParents
                    const isDraggingRow = parentReorderIsAvailable && parentSortable.draggingId === parent.id
                    const secondaryDisplayValue =
                        secondaryColumn.getDisplayValue?.(parent) ?? secondaryColumn.getValue(parent)
                    const parentSupplement = showParentSupplement
                        ? renderParentSupplement?.(parent)
                        : null
                    const hasSupplementSection = Boolean(showParentSupplement && parentSupplement)
                    const isSupplementExpanded =
                        hasSupplementSection &&
                        expandedSection?.parentId === parent.id &&
                        expandedSection.type === "supplement"
                    const showOptionsSection = canExpand
                    const toggleButtonClass =
                        "flex w-full items-center gap-1.5 rounded-sm py-1 text-left text-muted-foreground transition-colors"

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
                                <div className="flex items-start gap-3">
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
                                                "mt-1 text-muted-foreground",
                                                parentReorderIsAvailable
                                                    ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                                                    : "cursor-not-allowed opacity-30"
                                            )}
                                        >
                                            <GripVertical />
                                        </Button>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            type="text"
                                                            value={parentDraftName}
                                                            onChange={(event) =>
                                                                setParentDraftName(event.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            {secondaryColumn.label}
                                                        </Label>
                                                        {secondaryColumn.inputType === "select" ? (
                                                            <Select
                                                                value={secondaryDraftValue}
                                                                onValueChange={setSecondaryDraftValue}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder={secondaryColumn.placeholder} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(secondaryColumn.options ?? []).map((option) => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                type="text"
                                                                value={secondaryDraftValue}
                                                                placeholder={secondaryColumn.placeholder}
                                                                onChange={(event) =>
                                                                    setSecondaryDraftValue(event.target.value)
                                                                }
                                                                className="w-full"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex max-w-full min-w-0 flex-col gap-1">
                                                    {hasSupplementSection ? (
                                                        <div
                                                            className={cn(
                                                                "space-y-2 rounded-md border border-border/60 px-2 py-1",
                                                                isSupplementExpanded && "bg-muted/10"
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSupplementExpanded(parent.id)}
                                                                disabled={interactionLocked}
                                                                className={cn(
                                                                    toggleButtonClass,
                                                                    "hover:text-foreground disabled:cursor-default disabled:opacity-50"
                                                                )}
                                                                aria-label={
                                                                    isSupplementExpanded
                                                                        ? `Collapse ${parentSupplementLabel}`
                                                                        : `Expand ${parentSupplementLabel}`
                                                                }
                                                            >
                                                                {isSupplementExpanded ? <ChevronDown /> : <ChevronRight />}
                                                                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                                                                    {parentSupplementLabel}
                                                                </span>
                                                            </button>

                                                            {isSupplementExpanded ? (
                                                                <div className="border-t pt-3">
                                                                    {parentSupplement}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}

                                                    {showOptionsSection ? (
                                                        <div
                                                            className={cn(
                                                                "space-y-2 rounded-md border border-border/60 px-2 py-1",
                                                                isChildExpanded && "bg-muted/10"
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleChildExpanded(parent)}
                                                                disabled={interactionLocked || !canExpand}
                                                                className={cn(
                                                                    toggleButtonClass,
                                                                    canExpand
                                                                        ? "hover:text-foreground"
                                                                        : "cursor-default opacity-50"
                                                                )}
                                                                aria-label={
                                                                    isChildExpanded
                                                                        ? `Collapse ${childSectionLabel}`
                                                                        : `Expand ${childSectionLabel}`
                                                                }
                                                            >
                                                                {isChildExpanded ? <ChevronDown /> : <ChevronRight />}
                                                                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                                                                    {childSectionLabel}
                                                                </span>
                                                            </button>

                                                            {isChildExpanded && showChildren && !isDraggingRow ? (
                                                                <div className="border-l pl-4">
                                                                    <ListEditor<TChild>
                                                                        items={parent.children}
                                                                        sortField="displayOrder"
                                                                        editableField="name"
                                                                        interactionLocked={
                                                                            interactionLocked ||
                                                                            Boolean(
                                                                                activeEditorKey &&
                                                                                activeEditorKey !== `child:${parent.id}`
                                                                            )
                                                                        }
                                                                        onActiveStateChange={(isActive) =>
                                                                            handleChildActiveStateChange(
                                                                                `child:${parent.id}`,
                                                                                isActive
                                                                            )
                                                                        }
                                                                        onSave={
                                                                            onSaveChild
                                                                                ? (child, newValue) =>
                                                                                    onSaveChild(parent, child, newValue)
                                                                                : undefined
                                                                        }
                                                                        onCreate={
                                                                            onCreateChild
                                                                                ? (newValue) =>
                                                                                    onCreateChild(parent, newValue)
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
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div
                                                        className={cn(
                                                            "truncate font-medium",
                                                            interactionLocked && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {parent.name}
                                                    </div>
                                                    <div className="truncate text-sm text-muted-foreground">
                                                        {secondaryDisplayValue || "N/A"}
                                                    </div>
                                                </div>

                                                <div className="flex max-w-full min-w-0 flex-col gap-1">
                                                    {hasSupplementSection ? (
                                                        <div
                                                            className={cn(
                                                                "space-y-2 rounded-md border border-border/60 px-2 py-1",
                                                                isSupplementExpanded && "bg-muted/10"
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSupplementExpanded(parent.id)}
                                                                disabled={interactionLocked}
                                                                className={cn(
                                                                    toggleButtonClass,
                                                                    "hover:text-foreground disabled:cursor-default disabled:opacity-50"
                                                                )}
                                                                aria-label={
                                                                    isSupplementExpanded
                                                                        ? `Collapse ${parentSupplementLabel}`
                                                                        : `Expand ${parentSupplementLabel}`
                                                                }
                                                            >
                                                                {isSupplementExpanded ? <ChevronDown /> : <ChevronRight />}
                                                                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                                                                    {parentSupplementLabel}
                                                                </span>
                                                            </button>

                                                            {isSupplementExpanded ? (
                                                                <div className="border-t pt-3">
                                                                    {parentSupplement}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}

                                                    {showOptionsSection ? (
                                                        <div
                                                            className={cn(
                                                                "space-y-2 rounded-md border border-border/60 px-2 py-1",
                                                                isChildExpanded && "bg-muted/10"
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleChildExpanded(parent)}
                                                                disabled={interactionLocked || !canExpand}
                                                                className={cn(
                                                                    toggleButtonClass,
                                                                    canExpand
                                                                        ? "hover:text-foreground"
                                                                        : "cursor-default opacity-50"
                                                                )}
                                                                aria-label={
                                                                    isChildExpanded
                                                                        ? `Collapse ${childSectionLabel}`
                                                                        : `Expand ${childSectionLabel}`
                                                                }
                                                            >
                                                                {isChildExpanded ? <ChevronDown /> : <ChevronRight />}
                                                                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                                                                    {childSectionLabel}
                                                                </span>
                                                            </button>

                                                            {isChildExpanded && showChildren && !isDraggingRow ? (
                                                                <div className="border-l pl-4">
                                                                    <ListEditor<TChild>
                                                                        items={parent.children}
                                                                        sortField="displayOrder"
                                                                        editableField="name"
                                                                        interactionLocked={
                                                                            interactionLocked ||
                                                                            Boolean(
                                                                                activeEditorKey &&
                                                                                activeEditorKey !== `child:${parent.id}`
                                                                            )
                                                                        }
                                                                        onActiveStateChange={(isActive) =>
                                                                            handleChildActiveStateChange(
                                                                                `child:${parent.id}`,
                                                                                isActive
                                                                            )
                                                                        }
                                                                        onSave={
                                                                            onSaveChild
                                                                                ? (child, newValue) =>
                                                                                    onSaveChild(parent, child, newValue)
                                                                                : undefined
                                                                        }
                                                                        onCreate={
                                                                            onCreateChild
                                                                                ? (newValue) =>
                                                                                    onCreateChild(parent, newValue)
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
                                                            ) : null}
                                                        </div>
                                                    ) : null}
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
                                                <Save />
                                                {isSavingParent ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={cancelEditingParent}
                                                disabled={isSavingParent}
                                            >
                                                <X />
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
                                            <Pencil />
                                            Edit
                                        </Button>
                                    ) : null}
                                </div>

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
