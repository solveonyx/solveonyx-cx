"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

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
    emptyMessage = "No rows to display."
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
    const hasLocalActiveEditor = editingId !== null || isAdding
    const canStartNewAction = !interactionLocked && !hasLocalActiveEditor
    const canSaveNewRow = newDraftValue.trim().length > 0
    const canSaveEditedRow = draftValue.trim().length > 0

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
        <div className="space-y-2">
            {sortedItems.map((row) => {
                const isEditing = editingId === row.id

                return (
                    <div
                        key={row.id}
                        className="flex items-center justify-between gap-3 rounded border p-3"
                    >
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
                )
            })}

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
