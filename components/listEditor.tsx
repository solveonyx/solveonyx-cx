"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSortableList } from "@/hooks/useSortableList"
import { cn } from "@/lib/utils"

type EditableValue = string | number | null | undefined

type EditableFieldKey<T> = {
    [K in keyof T]-?: T[K] extends EditableValue ? K : never
}[keyof T]

type ListEditorProps<T extends { id: string }> = {
    items: T[]
    sortField: EditableFieldKey<T>
    editableField: EditableFieldKey<T>
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

    const sortable = useSortableList(sortedItems, reorder?.onReorder)

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
        return <div className="rounded border p-4 text-sm text-muted-foreground">{emptyMessage}</div>
    }

    return (
        <div
            className="space-y-2"
            ref={canReorder ? sortable.setContainerElement : undefined}
            onMouseMove={
                canReorder
                    ? (event) => sortable.handleMouseMove(event.nativeEvent)
                    : undefined
            }
            onMouseUp={canReorder ? sortable.handleMouseUp : undefined}
        >
            {sortedItems.map((row, rowIndex) => {
                const isEditing = editingId === row.id
                const isDraggingRow = canReorder && sortable.draggingId === row.id
                const showGapBefore =
                    canReorder &&
                    sortable.isDragging &&
                    sortable.dropIndex === rowIndex &&
                    sortable.draggingId !== row.id

                return (
                    <div key={row.id} className="space-y-2">
                        {showGapBefore && (
                            <div className="h-2 rounded border-2 border-dashed border-accent/70 bg-accent/20" />
                        )}

                        <div
                            ref={canReorder ? (node) => sortable.setItemElement(row.id, node) : undefined}
                            onMouseEnter={canReorder ? () => sortable.handleMouseEnter(row.id) : undefined}
                            className={cn(
                                "flex items-center justify-between gap-3 rounded border p-3 transition-[transform,box-shadow,background-color,opacity]",
                                isDraggingRow && "relative z-20 bg-accent opacity-70 shadow-lg"
                            )}
                            style={
                                isDraggingRow
                                    ? { transform: `translateY(${sortable.dragOffsetY}px)`, pointerEvents: "none" }
                                    : undefined
                            }
                        >
                            <div className={cn("min-w-0 flex-1", canReorder && "flex items-center gap-3")}>
                                {canReorder && (
                                    <button
                                        type="button"
                                        onMouseDown={(event) => sortable.handleMouseDown(row.id, event.nativeEvent)}
                                        aria-label="Reorder row"
                                        className={cn(
                                            "rounded px-2 py-1 text-muted-foreground transition-colors",
                                            "cursor-grab active:cursor-grabbing hover:text-foreground"
                                        )}
                                    >
                                        &#8801;
                                    </button>
                                )}

                                <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={draftValue}
                                            onChange={(event) => setDraftValue(event.target.value)}
                                            className="w-full rounded border p-2"
                                        />
                                    ) : (
                                        <div className="truncate">
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
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : canEdit ? (
                                <Button
                                    variant="outline"
                                    onClick={() => startEditing(row)}
                                    disabled={!canStartNewAction}
                                >
                                    Edit
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )
            })}

            {canReorder &&
                sortable.isDragging &&
                sortable.dropIndex === sortedItems.length && (
                    <div className="h-2 rounded border-2 border-dashed border-accent/70 bg-accent/20" />
                )}

            {canAdd && isAdding && (
                <div className="flex items-center justify-between gap-3 rounded border p-3">
                    <div className="min-w-0 flex-1">
                        <input
                            ref={newRowInputRef}
                            type="text"
                            value={newDraftValue}
                            onChange={(event) => setNewDraftValue(event.target.value)}
                            className="w-full rounded border p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={saveNewRow} disabled={isSaving || !canSaveNewRow}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={cancelAdding} disabled={isSaving}>
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
                    {addButtonLabel}
                </Button>
            )}

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
    )
}
