"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const AUTO_SCROLL_THRESHOLD = 50
const AUTO_SCROLL_MAX_SPEED = 18

function withReindexedDisplayOrder<T extends { id: string }>(items: T[]): T[] {
    return items.map((item, index) => {
        const next = { ...item } as T & {
            displayOrder?: number
            display_order?: number
        }

        if ("displayOrder" in next) {
            next.displayOrder = index + 1
        }

        if ("display_order" in next) {
            next.display_order = index + 1
        }

        return next
    })
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
}

export function useSortableList<T extends { id: string }>(
    items: T[],
    onReorder?: (items: T[]) => void
) {
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [dropIndex, setDropIndex] = useState<number | null>(null)
    const [dragOffsetY, setDragOffsetY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const containerRef = useRef<HTMLElement | null>(null)
    const itemElementsRef = useRef(new Map<string, HTMLElement>())
    const dragStartClientYRef = useRef(0)
    const draggingIdRef = useRef<string | null>(null)
    const didMoveRef = useRef(false)
    const lastClientYRef = useRef<number | null>(null)
    const scrollVelocityRef = useRef(0)
    const autoScrollRafRef = useRef<number | null>(null)
    const originalUserSelectRef = useRef<string | null>(null)

    const setContainerElement = useCallback((element: HTMLElement | null) => {
        containerRef.current = element
    }, [])

    const setItemElement = useCallback((id: string, element: HTMLElement | null) => {
        if (!element) {
            itemElementsRef.current.delete(id)
            return
        }

        itemElementsRef.current.set(id, element)
    }, [])

    const stopAutoScroll = useCallback(() => {
        if (autoScrollRafRef.current !== null) {
            window.cancelAnimationFrame(autoScrollRafRef.current)
            autoScrollRafRef.current = null
        }
        scrollVelocityRef.current = 0
    }, [])

    const getDropFromClientY = useCallback((clientY: number) => {
        if (items.length === 0) {
            return { nextDropIndex: null as number | null, nextDragOverId: null as string | null }
        }

        const containerRect = containerRef.current?.getBoundingClientRect()
        if (containerRect) {
            if (clientY <= containerRect.top) {
                return {
                    nextDropIndex: 0,
                    nextDragOverId: items[0]?.id ?? null
                }
            }

            if (clientY >= containerRect.bottom) {
                return {
                    nextDropIndex: items.length,
                    nextDragOverId: items[items.length - 1]?.id ?? null
                }
            }
        }

        for (let index = 0; index < items.length; index += 1) {
            const item = items[index]
            const itemElement = itemElementsRef.current.get(item.id)
            if (!itemElement) {
                continue
            }

            const rect = itemElement.getBoundingClientRect()
            const midpoint = rect.top + rect.height / 2
            if (clientY < midpoint) {
                return { nextDropIndex: index, nextDragOverId: item.id }
            }
        }

        return {
            nextDropIndex: items.length,
            nextDragOverId: items[items.length - 1]?.id ?? null
        }
    }, [items])

    const updateDropFromClientY = useCallback((clientY: number) => {
        const { nextDropIndex, nextDragOverId } = getDropFromClientY(clientY)
        setDropIndex(nextDropIndex)
        setDragOverId(nextDragOverId)
    }, [getDropFromClientY])

    const updateAutoScroll = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) {
            stopAutoScroll()
            return
        }

        const rect = container.getBoundingClientRect()
        const distanceToTop = clientY - rect.top
        const distanceToBottom = rect.bottom - clientY

        let velocity = 0

        if (distanceToTop < AUTO_SCROLL_THRESHOLD) {
            const intensity = (AUTO_SCROLL_THRESHOLD - distanceToTop) / AUTO_SCROLL_THRESHOLD
            velocity = -AUTO_SCROLL_MAX_SPEED * Math.min(Math.max(intensity, 0), 1)
        } else if (distanceToBottom < AUTO_SCROLL_THRESHOLD) {
            const intensity = (AUTO_SCROLL_THRESHOLD - distanceToBottom) / AUTO_SCROLL_THRESHOLD
            velocity = AUTO_SCROLL_MAX_SPEED * Math.min(Math.max(intensity, 0), 1)
        }

        scrollVelocityRef.current = velocity

        if (velocity === 0) {
            stopAutoScroll()
            return
        }

        if (autoScrollRafRef.current !== null) {
            return
        }

        const tick = () => {
            const currentContainer = containerRef.current
            if (!currentContainer || !draggingIdRef.current) {
                autoScrollRafRef.current = null
                return
            }

            if (scrollVelocityRef.current !== 0) {
                currentContainer.scrollTop += scrollVelocityRef.current
                if (lastClientYRef.current !== null) {
                    updateDropFromClientY(lastClientYRef.current)
                }
            }

            if (scrollVelocityRef.current === 0) {
                autoScrollRafRef.current = null
                return
            }

            autoScrollRafRef.current = window.requestAnimationFrame(tick)
        }

        autoScrollRafRef.current = window.requestAnimationFrame(tick)
    }, [stopAutoScroll, updateDropFromClientY])

    const resetDragState = useCallback(() => {
        setDraggingId(null)
        setDragOverId(null)
        setDropIndex(null)
        setDragOffsetY(0)
        setIsDragging(false)
        draggingIdRef.current = null
        didMoveRef.current = false
        lastClientYRef.current = null
        stopAutoScroll()

        if (originalUserSelectRef.current !== null) {
            document.body.style.userSelect = originalUserSelectRef.current
            originalUserSelectRef.current = null
        }
    }, [stopAutoScroll])

    const handleMouseDown = useCallback((id: string, event: MouseEvent) => {
        if (items.length <= 1) {
            return
        }

        const startIndex = items.findIndex((item) => item.id === id)
        if (startIndex < 0) {
            return
        }

        event.preventDefault()

        if (originalUserSelectRef.current === null) {
            originalUserSelectRef.current = document.body.style.userSelect
        }
        document.body.style.userSelect = "none"

        dragStartClientYRef.current = event.clientY
        lastClientYRef.current = event.clientY
        draggingIdRef.current = id
        didMoveRef.current = false

        setDraggingId(id)
        setDragOverId(id)
        setDropIndex(startIndex)
        setDragOffsetY(0)
        setIsDragging(true)
    }, [items])

    const handleMouseEnter = useCallback((id: string) => {
        if (!draggingIdRef.current) {
            return
        }

        const index = items.findIndex((item) => item.id === id)
        if (index < 0) {
            return
        }

        setDragOverId(id)
        setDropIndex(index)
    }, [items])

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!draggingIdRef.current) {
            return
        }

        const clientY = event.clientY
        lastClientYRef.current = clientY

        const deltaY = clientY - dragStartClientYRef.current
        if (Math.abs(deltaY) > 2) {
            didMoveRef.current = true
        }

        setDragOffsetY(deltaY)
        updateDropFromClientY(clientY)
        updateAutoScroll(clientY)
    }, [updateAutoScroll, updateDropFromClientY])

    const handleMouseUp = useCallback(() => {
        const currentDraggingId = draggingIdRef.current
        if (!currentDraggingId) {
            return
        }

        const fromIndex = items.findIndex((item) => item.id === currentDraggingId)
        const insertionIndex = dropIndex ?? fromIndex

        if (fromIndex < 0) {
            resetDragState()
            return
        }

        const toIndex = insertionIndex > fromIndex ? insertionIndex - 1 : insertionIndex
        const didPositionChange = toIndex !== fromIndex

        if (didMoveRef.current && didPositionChange) {
            const movedItems = moveItem(items, fromIndex, toIndex)
            onReorder?.(withReindexedDisplayOrder(movedItems))
        }

        resetDragState()
    }, [dropIndex, items, onReorder, resetDragState])

    useEffect(() => {
        if (!isDragging) {
            return
        }

        const onWindowMouseMove = (event: MouseEvent) => {
            handleMouseMove(event)
        }

        const onWindowMouseUp = () => {
            handleMouseUp()
        }

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)

        return () => {
            window.removeEventListener("mousemove", onWindowMouseMove)
            window.removeEventListener("mouseup", onWindowMouseUp)
        }
    }, [handleMouseMove, handleMouseUp, isDragging])

    useEffect(() => {
        return () => {
            stopAutoScroll()
            if (originalUserSelectRef.current !== null) {
                document.body.style.userSelect = originalUserSelectRef.current
            }
        }
    }, [stopAutoScroll])

    return {
        draggingId,
        dragOverId,
        dropIndex,
        dragOffsetY,
        isDragging,
        handleMouseDown,
        handleMouseEnter,
        handleMouseMove,
        handleMouseUp,
        setContainerElement,
        setItemElement
    }
}
