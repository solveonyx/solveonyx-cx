"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const AUTO_SCROLL_THRESHOLD = 50
const AUTO_SCROLL_MAX_SPEED = 18

type ItemMetrics = {
    id: string
    top: number
    bottom: number
    height: number
    midpoint: number
}

type ContainerBounds = {
    top: number
    bottom: number
}

type DragElementStyles = {
    pointerEvents: string
    position: string
    zIndex: string
    transition: string
    willChange: string
}

type DisplacedElementStyles = {
    transform: string
    willChange: string
}

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
    onReorder?: (items: T[]) => void,
    enabled = Boolean(onReorder)
) {
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [dropIndex, setDropIndex] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const containerRef = useRef<HTMLElement | null>(null)
    const containerBoundsRef = useRef<ContainerBounds | null>(null)
    const itemElementsRef = useRef(new Map<string, HTMLElement>())
    const itemMetricsRef = useRef<ItemMetrics[]>([])
    const dragStartClientYRef = useRef(0)
    const draggingIdRef = useRef<string | null>(null)
    const didMoveRef = useRef(false)
    const lastClientYRef = useRef<number | null>(null)
    const scrollVelocityRef = useRef(0)
    const autoScrollRafRef = useRef<number | null>(null)
    const moveRafRef = useRef<number | null>(null)
    const pendingClientYRef = useRef<number | null>(null)
    const originalUserSelectRef = useRef<string | null>(null)
    const dragOffsetRef = useRef(0)
    const dropIndexRef = useRef<number | null>(null)
    const dragOverIdRef = useRef<string | null>(null)
    const draggingElementRef = useRef<HTMLElement | null>(null)
    const appliedTransformRef = useRef(0)
    const originalDragElementStylesRef = useRef<DragElementStyles | null>(null)
    const originalDisplacedElementStylesRef = useRef(new Map<string, DisplacedElementStyles>())
    const appliedDisplacementTransformsRef = useRef(new Map<string, number>())
    const dragStartIndexRef = useRef<number | null>(null)
    const dragSlotSizeRef = useRef(0)
    const enabledRef = useRef(enabled)

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

    const stopMoveLoop = useCallback(() => {
        if (moveRafRef.current !== null) {
            window.cancelAnimationFrame(moveRafRef.current)
            moveRafRef.current = null
        }
        pendingClientYRef.current = null
    }, [])

    const buildItemMetrics = useCallback(() => {
        const container = containerRef.current
        if (!container) {
            itemMetricsRef.current = []
            containerBoundsRef.current = null
            return
        }

        const containerRect = container.getBoundingClientRect()
        containerBoundsRef.current = {
            top: containerRect.top,
            bottom: containerRect.bottom
        }

        itemMetricsRef.current = items
            .map((item) => {
                const element = itemElementsRef.current.get(item.id)
                if (!element) {
                    return null
                }

                const rect = element.getBoundingClientRect()
                const topWithinContainer = rect.top - containerRect.top + container.scrollTop

                return {
                    id: item.id,
                    top: topWithinContainer,
                    bottom: topWithinContainer + rect.height,
                    height: rect.height,
                    midpoint: topWithinContainer + rect.height / 2
                } satisfies ItemMetrics
            })
            .filter((metric): metric is ItemMetrics => metric !== null)
    }, [items])

    const getDragSlotSize = useCallback((startIndex: number) => {
        const metrics = itemMetricsRef.current
        const currentMetric = metrics[startIndex]

        if (!currentMetric) {
            return 0
        }

        const nextMetric = metrics[startIndex + 1]
        if (nextMetric) {
            return Math.max(nextMetric.top - currentMetric.top, currentMetric.height)
        }

        const previousMetric = metrics[startIndex - 1]
        if (previousMetric) {
            return Math.max(currentMetric.top - previousMetric.top, currentMetric.height)
        }

        return currentMetric.height
    }, [])

    const prepareDragElement = useCallback((id: string) => {
        const element = itemElementsRef.current.get(id) ?? null
        draggingElementRef.current = element

        if (!element) {
            return
        }

        originalDragElementStylesRef.current = {
            pointerEvents: element.style.pointerEvents,
            position: element.style.position,
            zIndex: element.style.zIndex,
            transition: element.style.transition,
            willChange: element.style.willChange
        }

        element.style.pointerEvents = "none"
        element.style.position = "relative"
        element.style.zIndex = "20"
        element.style.transition = "none"
        element.style.willChange = "transform"
    }, [])

    const applyDragTransform = useCallback((deltaY: number) => {
        if (!draggingElementRef.current && draggingIdRef.current) {
            draggingElementRef.current = itemElementsRef.current.get(draggingIdRef.current) ?? null
        }

        if (!draggingElementRef.current) {
            return
        }

        if (appliedTransformRef.current === deltaY) {
            return
        }

        draggingElementRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`
        appliedTransformRef.current = deltaY
    }, [])

    const clearDragTransform = useCallback(() => {
        if (draggingElementRef.current) {
            const originalStyles = originalDragElementStylesRef.current

            draggingElementRef.current.style.transform = ""

            if (originalStyles) {
                draggingElementRef.current.style.pointerEvents = originalStyles.pointerEvents
                draggingElementRef.current.style.position = originalStyles.position
                draggingElementRef.current.style.zIndex = originalStyles.zIndex
                draggingElementRef.current.style.transition = originalStyles.transition
                draggingElementRef.current.style.willChange = originalStyles.willChange
            }
        }

        draggingElementRef.current = null
        originalDragElementStylesRef.current = null
        appliedTransformRef.current = 0
    }, [])

    const clearDisplacedTransforms = useCallback(() => {
        originalDisplacedElementStylesRef.current.forEach((originalStyles, id) => {
            const element = itemElementsRef.current.get(id)
            if (!element) {
                return
            }

            element.style.transform = originalStyles.transform
            element.style.willChange = originalStyles.willChange
        })

        originalDisplacedElementStylesRef.current.clear()
        appliedDisplacementTransformsRef.current.clear()
    }, [])

    const setDisplacedTransform = useCallback((id: string, deltaY: number) => {
        const element = itemElementsRef.current.get(id)
        if (!element) {
            return
        }

        if (!originalDisplacedElementStylesRef.current.has(id)) {
            originalDisplacedElementStylesRef.current.set(id, {
                transform: element.style.transform,
                willChange: element.style.willChange
            })
        }

        if (appliedDisplacementTransformsRef.current.get(id) === deltaY) {
            return
        }

        if (deltaY === 0) {
            const originalStyles = originalDisplacedElementStylesRef.current.get(id)
            element.style.transform = originalStyles?.transform ?? ""
            element.style.willChange = originalStyles?.willChange ?? ""
            originalDisplacedElementStylesRef.current.delete(id)
            appliedDisplacementTransformsRef.current.delete(id)
            return
        }

        element.style.transform = `translate3d(0, ${deltaY}px, 0)`
        element.style.willChange = "transform"
        appliedDisplacementTransformsRef.current.set(id, deltaY)
    }, [])

    const applyDisplacedTransforms = useCallback((insertionIndex: number | null) => {
        const startIndex = dragStartIndexRef.current
        const draggedId = draggingIdRef.current
        const slotSize = dragSlotSizeRef.current

        if (startIndex === null || insertionIndex === null || !draggedId || slotSize === 0) {
            clearDisplacedTransforms()
            return
        }

        const toIndex = insertionIndex > startIndex ? insertionIndex - 1 : insertionIndex
        const nextTransforms = new Map<string, number>()

        items.forEach((item, index) => {
            if (item.id === draggedId || toIndex === startIndex) {
                return
            }

            if (toIndex > startIndex && index > startIndex && index <= toIndex) {
                nextTransforms.set(item.id, -slotSize)
                return
            }

            if (toIndex < startIndex && index >= toIndex && index < startIndex) {
                nextTransforms.set(item.id, slotSize)
            }
        })

        appliedDisplacementTransformsRef.current.forEach((_, id) => {
            if (!nextTransforms.has(id)) {
                setDisplacedTransform(id, 0)
            }
        })

        nextTransforms.forEach((deltaY, id) => {
            setDisplacedTransform(id, deltaY)
        })
    }, [clearDisplacedTransforms, items, setDisplacedTransform])

    const getDropFromClientY = useCallback((clientY: number) => {
        if (items.length === 0) {
            return { nextDropIndex: null as number | null, nextDragOverId: null as string | null }
        }

        const container = containerRef.current
        const containerBounds = containerBoundsRef.current
        if (containerBounds) {
            if (clientY <= containerBounds.top) {
                return {
                    nextDropIndex: 0,
                    nextDragOverId: items[0]?.id ?? null
                }
            }

            if (clientY >= containerBounds.bottom) {
                return {
                    nextDropIndex: items.length,
                    nextDragOverId: items[items.length - 1]?.id ?? null
                }
            }
        }

        if (container && containerBounds) {
            const yWithinContainer = clientY - containerBounds.top + container.scrollTop
            const metrics = itemMetricsRef.current

            for (let index = 0; index < metrics.length; index += 1) {
                const metric = metrics[index]
                if (yWithinContainer < metric.midpoint) {
                    return { nextDropIndex: index, nextDragOverId: metric.id }
                }
            }
        }

        return {
            nextDropIndex: items.length,
            nextDragOverId: items[items.length - 1]?.id ?? null
        }
    }, [items])

    const updateDropFromClientY = useCallback((clientY: number) => {
        const { nextDropIndex, nextDragOverId } = getDropFromClientY(clientY)
        if (dropIndexRef.current !== nextDropIndex) {
            dropIndexRef.current = nextDropIndex
            setDropIndex(nextDropIndex)
        }

        if (dragOverIdRef.current !== nextDragOverId) {
            dragOverIdRef.current = nextDragOverId
            setDragOverId(nextDragOverId)
        }

        applyDisplacedTransforms(nextDropIndex)
    }, [applyDisplacedTransforms, getDropFromClientY])

    const updateAutoScroll = useCallback((clientY: number) => {
        const container = containerRef.current
        const containerBounds = containerBoundsRef.current
        if (!container || !containerBounds) {
            stopAutoScroll()
            return
        }

        const distanceToTop = clientY - containerBounds.top
        const distanceToBottom = containerBounds.bottom - clientY

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
        setIsDragging(false)
        clearDragTransform()
        clearDisplacedTransforms()
        draggingIdRef.current = null
        didMoveRef.current = false
        lastClientYRef.current = null
        dragOffsetRef.current = 0
        dropIndexRef.current = null
        dragOverIdRef.current = null
        dragStartIndexRef.current = null
        dragSlotSizeRef.current = 0
        itemMetricsRef.current = []
        stopMoveLoop()
        stopAutoScroll()

        if (originalUserSelectRef.current !== null) {
            document.body.style.userSelect = originalUserSelectRef.current
            originalUserSelectRef.current = null
        }
    }, [clearDisplacedTransforms, clearDragTransform, stopAutoScroll, stopMoveLoop])

    const processPendingPointer = useCallback(() => {
        moveRafRef.current = null

        if (!draggingIdRef.current || pendingClientYRef.current === null) {
            return
        }

        const clientY = pendingClientYRef.current
        const deltaY = clientY - dragStartClientYRef.current
        if (Math.abs(deltaY) > 2) {
            didMoveRef.current = true
        }

        if (dragOffsetRef.current !== deltaY) {
            dragOffsetRef.current = deltaY
            applyDragTransform(deltaY)
        }

        updateDropFromClientY(clientY)
        updateAutoScroll(clientY)
    }, [applyDragTransform, updateAutoScroll, updateDropFromClientY])

    const handleMouseDown = useCallback((id: string, event: MouseEvent) => {
        if (!enabledRef.current || !onReorder || items.length <= 1) {
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
        pendingClientYRef.current = event.clientY
        draggingIdRef.current = id
        dragStartIndexRef.current = startIndex
        didMoveRef.current = false

        setDraggingId(id)
        setDragOverId(id)
        setDropIndex(startIndex)
        setIsDragging(true)

        dragOffsetRef.current = 0
        dropIndexRef.current = startIndex
        dragOverIdRef.current = id
        draggingElementRef.current = itemElementsRef.current.get(id) ?? null
        appliedTransformRef.current = 0
        buildItemMetrics()
        dragSlotSizeRef.current = getDragSlotSize(startIndex)
        prepareDragElement(id)
    }, [buildItemMetrics, getDragSlotSize, items, onReorder, prepareDragElement])

    const handleMouseEnter = useCallback((id: string) => {
        if (!draggingIdRef.current) {
            return
        }

        const index = items.findIndex((item) => item.id === id)
        if (index < 0) {
            return
        }

        if (dragOverIdRef.current !== id) {
            dragOverIdRef.current = id
            setDragOverId(id)
        }

        if (dropIndexRef.current !== index) {
            dropIndexRef.current = index
            setDropIndex(index)
        }

        applyDisplacedTransforms(index)
    }, [applyDisplacedTransforms, items])

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!enabledRef.current || !draggingIdRef.current) {
            return
        }

        const clientY = event.clientY
        lastClientYRef.current = clientY
        pendingClientYRef.current = clientY

        if (moveRafRef.current === null) {
            moveRafRef.current = window.requestAnimationFrame(processPendingPointer)
        }
    }, [processPendingPointer])

    const handleMouseUp = useCallback(() => {
        const currentDraggingId = draggingIdRef.current
        if (!currentDraggingId) {
            return
        }

        const fromIndex = items.findIndex((item) => item.id === currentDraggingId)
        const insertionIndex = dropIndexRef.current ?? fromIndex

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
    }, [items, onReorder, resetDragState])

    useEffect(() => {
        enabledRef.current = enabled

        if (!enabled && draggingIdRef.current) {
            const resetFrame = window.requestAnimationFrame(resetDragState)
            return () => window.cancelAnimationFrame(resetFrame)
        }
    }, [enabled, resetDragState])

    useEffect(() => {
        if (!isDragging) {
            return
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [handleMouseMove, handleMouseUp, isDragging])

    useEffect(() => {
        return () => {
            clearDragTransform()
            clearDisplacedTransforms()
            stopMoveLoop()
            stopAutoScroll()
            if (originalUserSelectRef.current !== null) {
                document.body.style.userSelect = originalUserSelectRef.current
            }
        }
    }, [clearDisplacedTransforms, clearDragTransform, stopAutoScroll, stopMoveLoop])

    return {
        draggingId,
        dragOverId,
        dropIndex,
        isDragging,
        handleMouseDown,
        handleMouseEnter,
        handleMouseMove,
        handleMouseUp,
        setContainerElement,
        setItemElement
    }
}
