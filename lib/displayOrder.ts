export type DisplayOrderValue = number | null | undefined

export type DisplayOrderUpdate = {
    id: string
    groupKey: string
    currentDisplayOrder: DisplayOrderValue
    nextDisplayOrder: number
    changed: boolean
}

type NormalizeDisplayOrderOptions<T> = {
    getId: (item: T) => string
    getDisplayOrder: (item: T) => DisplayOrderValue
    getGroupKey?: (item: T) => string | null | undefined
}

const GLOBAL_GROUP_KEY = "__global__"

function sortableDisplayOrder(value: DisplayOrderValue): number {
    return typeof value === "number" ? value : Number.POSITIVE_INFINITY
}

export function normalizeDisplayOrders<T>(
    items: T[],
    options: NormalizeDisplayOrderOptions<T>
): DisplayOrderUpdate[] {
    const groupedItems = new Map<string, T[]>()

    for (const item of items) {
        const groupKey = options.getGroupKey?.(item) ?? GLOBAL_GROUP_KEY
        const existing = groupedItems.get(groupKey)
        if (existing) {
            existing.push(item)
        } else {
            groupedItems.set(groupKey, [item])
        }
    }

    const updates: DisplayOrderUpdate[] = []

    for (const [groupKey, group] of groupedItems) {
        const sortedGroup = [...group].sort((a, b) => {
            const orderA = sortableDisplayOrder(options.getDisplayOrder(a))
            const orderB = sortableDisplayOrder(options.getDisplayOrder(b))

            if (orderA !== orderB) {
                return orderA - orderB
            }

            return options.getId(a).localeCompare(options.getId(b))
        })

        for (let index = 0; index < sortedGroup.length; index += 1) {
            const item = sortedGroup[index]
            const currentDisplayOrder = options.getDisplayOrder(item)
            const nextDisplayOrder = index + 1

            updates.push({
                id: options.getId(item),
                groupKey,
                currentDisplayOrder,
                nextDisplayOrder,
                changed: currentDisplayOrder !== nextDisplayOrder
            })
        }
    }

    return updates
}
