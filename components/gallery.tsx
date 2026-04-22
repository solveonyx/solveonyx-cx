"use client"

import { cn } from "@/lib/utils"

export interface GalleryItem {
    id: string
    name: string
}

interface GalleryProps<T extends GalleryItem> {
    items: T[]
    selectedId?: string | null
    onSelect: (item: T) => void
}

export function Gallery<T extends GalleryItem>({
    items,
    selectedId,
    onSelect,
}: GalleryProps<T>) {
    return (
        <div className="flex flex-col border rounded-md overflow-hidden">
            {items.map((item) => {
                const isSelected = item.id === selectedId

                return (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={cn(
                            "px-3 py-2 cursor-pointer border-b last:border-b-0",
                            "hover:bg-muted transition-colors",
                            isSelected && "bg-accent text-accent-foreground"
                        )}
                    >
                        {item.name}
                    </div>
                )
            })}
        </div>
    )
}