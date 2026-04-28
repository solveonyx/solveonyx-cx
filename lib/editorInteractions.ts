"use client"

export const EDITOR_ICON_BUTTON_CLASS =
    "bg-transparent text-muted-foreground shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0"

export const EDITOR_ICON_BUTTON_INTERACTIVE_CLASS = "hover:text-foreground"

export const EDITOR_LOCKED_DIMMED_CLASS = "cursor-default opacity-50"

export const EDITOR_LOCKED_SUBTLE_DIMMED_CLASS = "cursor-default opacity-30"

export const EDITOR_MUTED_TEXT_CLASS = "text-muted-foreground"

export function hasActiveEditor(activeEditorKey: string | null): boolean {
    return activeEditorKey !== null
}

export function isLockedByOtherEditor(
    interactionLocked: boolean,
    activeEditorKey: string | null,
    ownerKey: string
): boolean {
    return interactionLocked || Boolean(activeEditorKey && activeEditorKey !== ownerKey)
}

export function isExpansionLocked(
    interactionLocked: boolean,
    activeEditorKey: string | null
): boolean {
    return interactionLocked || hasActiveEditor(activeEditorKey)
}

export function isSiblingEditorLocked(
    interactionLocked: boolean,
    hasLocalActiveEditor: boolean,
    isEditing: boolean
): boolean {
    return interactionLocked || (hasLocalActiveEditor && !isEditing)
}
