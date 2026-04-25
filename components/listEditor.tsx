"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GripVertical, Pencil, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSortableList } from "@/hooks/useSortableList"
import { cn } from "@/lib/utils"

type EditableValue = string | number | null | undefined

type ListEditorProps<T extends { id: string }> = {
    items: T[]
    sortField: keyof T
    editableField: keyof T
    onSave?: (row: T, newValue: string) => Promise<void>
    onCreate?: (newValue: string) => Promise<void>
    interactionLocked?: boolean
    onActiveStateChange?: (isActive: boolean) => void
    addButtonLabel?: string
    emptyMessage?: string
    reorder?: {
        onReorder: (items: T[]) => void
    }
}

function toSortable(value: EditableValue): string | number {
    if (value === null || value === undefined) {
        return Number.POSITIVE_INFINITY
    }
    return value
}

export function ListEditor<T extends { id: string }>({
    items,
    sortField,
    editableField,
    onSave,
    onCreate,
    interactionLocked = false,
    onActiveStateChange,
    addButtonLabel = "Add",
    emptyMessage = "No rows to display.",
    reorder
}: ListEditorProps<T>) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draftValue, setDraftValue] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [newDraftValue, setNewDraftValue] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const newRowInputRef = useRef<HTMLInputElement | null>(null)

    const sortedItems = useMemo(() => {
        const clone = [...items]
        clone.sort((a, b) => {
            const aValue = toSortable(a[sortField] as EditableValue)
            const bValue = toSortable(b[sortField] as EditableValue)

            if (aValue < bValue) return -1
            if (aValue > bValue) return 1
            return a.id.localeCompare(b.id)
        })
        return clone
    }, [items, sortField])

    const startEditing = (row: T) => {
        setEditingId(row.id)
        setDraftValue(String((row[editableField] as EditableValue) ?? ""))
        setIsAdding(false)
        setNewDraftValue("")
        setErrorMessage("")
    }

    const startAdding = () => {
        if (!onCreate) {
            return
        }

        setEditingId(null)
        setDraftValue("")
        setIsAdding(true)
        setNewDraftValue("")
        setErrorMessage("")
    }

    const saveRow = async (row: T) => {
        if (!onSave) {
            return
        }

        setErrorMessage("")
        setIsSaving(true)

        try {
            await onSave(row, draftValue)
            setEditingId(null)
            setDraftValue("")
        } catch (error) {
            console.error("ListEditor save error:", error)
            setErrorMessage("Unable to save changes. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const cancelEditing = () => {
        setEditingId(null)
        setDraftValue("")
        setErrorMessage("")
    }

    const saveNewRow = async () => {
        if (!onCreate) {
            return
        }

        setErrorMessage("")
        setIsSaving(true)

        try {
            await onCreate(newDraftValue)
            setIsAdding(false)
            setNewDraftValue("")
        } catch (error) {
            console.error("ListEditor create error:", error)
            setErrorMessage("Unable to add item. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const cancelAdding = () => {
        setIsAdding(false)
        setNewDraftValue("")
        setErrorMessage("")
    }

    const canAdd = Boolean(onCreate)
    const canEdit = Boolean(onSave)
    const reorderEnabled = Boolean(reorder?.onReorder)
    const hasLocalActiveEditor = editingId !== null || isAdding
    const canStartNewAction = !interactionLocked && !hasLocalActiveEditor
    const canSaveNewRow = newDraftValue.trim().length > 0
    const canSaveEditedRow = draftValue.trim().length > 0
    const canReorder = reorderEnabled && sortedItems.length > 1 && canStartNewAction && !isSaving
    const showReorderHandle = reorderEnabled && sortedItems.length > 1

    const sortable = useSortableList(sortedItems, reorder?.onReorder, canReorder)

    useEffect(() => {
        if (!isAdding) {
            return
        }

        newRowInputRef.current?.focus()
    }, [isAdding])

    useEffect(() => {
        onActiveStateChange?.(hasLocalActiveEditor)
    }, [hasLocalActiveEditor, onActiveStateChange])

    if (sortedItems.length === 0 && !canAdd) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div
            className="space-y-2"
            ref={canReorder ? sortable.setContainerElement : undefined}
        >
            {sortedItems.map((row) => {
                const isEditing = editingId === row.id
                const isDraggingRow = canReorder && sortable.draggingId === row.id

                return (
                    <div key={row.id} className="space-y-2">
                        <div
                            ref={canReorder ? (node) => sortable.setItemElement(row.id, node) : undefined}
                            className={cn(
                                "flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm transition-[transform,box-shadow,background-color,opacity]",
                                !isDraggingRow && "hover:bg-muted/30",
                                isDraggingRow && "pointer-events-none relative z-20 bg-accent opacity-80 shadow-lg will-change-transform !transition-none"
                            )}
                        >
                            <div className={cn("min-w-0 flex-1", showReorderHandle && "flex items-center gap-3")}>
                                {showReorderHandle && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={!canReorder}
                                        onMouseDown={
                                            canReorder
                                                ? (event) => sortable.handleMouseDown(row.id, event.nativeEvent)
                                                : undefined
                                        }
                                        aria-label="Reorder row"
                                        className={cn(
                                            "text-muted-foreground",
                                            canReorder
                                                ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                                                : "cursor-not-allowed opacity-30"
                                        )}
                                    >
                                        <GripVertical />
                                    </Button>
                                )}

                                <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                        <Input
                                            type="text"
                                            value={draftValue}
                                            onChange={(event) => setDraftValue(event.target.value)}
                                            className="w-full"
                                        />
                                    ) : (
                                        <div
                                            className={cn(
                                                "truncate text-sm font-medium",
                                                interactionLocked && "text-muted-foreground"
                                            )}
                                        >
                                            {String((row[editableField] as EditableValue) ?? "")}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => saveRow(row)}
                                        disabled={isSaving || !canSaveEditedRow}
                                    >
                                        <Save />
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                                        <X />
                                        Cancel
                                    </Button>
                                </div>
                            ) : canEdit ? (
                                <Button
                                    variant="outline"
                                    onClick={() => startEditing(row)}
                                    disabled={!canStartNewAction}
                                >
                                    <Pencil />
                                    Edit
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )
            })}

            {canAdd && isAdding && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                        <Input
                            ref={newRowInputRef}
                            type="text"
                            value={newDraftValue}
                            onChange={(event) => setNewDraftValue(event.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={saveNewRow} disabled={isSaving || !canSaveNewRow}>
                            <Save />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={cancelAdding} disabled={isSaving}>
                            <X />
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {canAdd && !isAdding && (
                <Button
                    variant={sortedItems.length === 0 ? "default" : "outline"}
                    onClick={startAdding}
                    disabled={isSaving || !canStartNewAction}
                >
                    <Plus />
                    {addButtonLabel}
                </Button>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
