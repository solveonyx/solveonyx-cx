"use client"

import { cn } from "@/lib/utils"

type GalleryItem = {
    id: string
    label?: string
    name?: string
}

type SelectionGalleryProps<TItem extends GalleryItem> = {
    items: TItem[]
    selectedId?: string | null
    getItemId?: (item: TItem) => string
    getItemLabel?: (item: TItem) => string
    onSelect?: (item: TItem) => void
    disabled?: boolean
    className?: string
    itemClassName?: string
    selectedItemClassName?: string
    emptyMessage?: string
}

function defaultItemId<TItem extends GalleryItem>(item: TItem) {
    return item.id
}

function defaultItemLabel<TItem extends GalleryItem>(item: TItem) {
    return item.label ?? item.name ?? item.id
}

export function SelectionGallery<TItem extends GalleryItem>({
    items,
    selectedId,
    getItemId = defaultItemId,
    getItemLabel = defaultItemLabel,
    onSelect,
    disabled = false,
    className,
    itemClassName,
    selectedItemClassName,
    emptyMessage = "No items available."
}: SelectionGalleryProps<TItem>) {
    if (items.length === 0) {
        return (
            <div
                className={cn(
                    "h-[calc(100vh-14rem)] w-full max-w-60 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground",
                    className
                )}
            >
                {emptyMessage}
            </div>
        )
    }

    return (
        <div
            className={cn(
                "selection-gallery-scrollbar flex h-[calc(100vh-14rem)] w-full max-w-60 flex-col gap-2 overflow-y-auto overscroll-contain pr-1",
                className
            )}
        >
            {items.map((item) => {
                const itemId = getItemId(item)
                const isSelected = selectedId === itemId

                return (
                    <button
                        key={itemId}
                        type="button"
                        disabled={disabled}
                        aria-pressed={isSelected}
                        onClick={() => onSelect?.(item)}
                        className={cn(
                            "w-full rounded-lg px-3 py-2.5 text-left text-sm leading-snug transition-colors",
                            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                            "disabled:pointer-events-none disabled:opacity-50",
                            isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card text-card-foreground hover:bg-muted/60",
                            itemClassName,
                            isSelected && selectedItemClassName
                        )}
                    >
                        {getItemLabel(item)}
                    </button>
                )
            })}
        </div>
    )
}
