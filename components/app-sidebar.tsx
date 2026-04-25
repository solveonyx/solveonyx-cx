"use client"

import { FocusEvent, MouseEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAppShellLock } from "@/components/app-shell-lock-provider"
import { Separator } from "@/components/ui/separator"
import { appNavItems } from "@/lib/app-nav"
import { cn } from "@/lib/utils"

export function AppSidebar() {
    const sidebarTransitionClass = "duration-200 ease-out"
    const pathname = usePathname()
    const { isNavigationLocked } = useAppShellLock()
    const [isExpanded, setIsExpanded] = useState(false)
    const isExpandedRef = useRef(false)
    const expandTimeoutRef = useRef<number | null>(null)
    const sidebarIsExpanded = isExpanded && !isNavigationLocked

    const setExpanded = (nextIsExpanded: boolean) => {
        isExpandedRef.current = nextIsExpanded
        setIsExpanded(nextIsExpanded)
    }

    const clearExpandTimeout = () => {
        if (expandTimeoutRef.current === null) {
            return
        }

        window.clearTimeout(expandTimeoutRef.current)
        expandTimeoutRef.current = null
    }

    const handleMouseEnter = () => {
        if (isNavigationLocked) {
            return
        }

        clearExpandTimeout()
        expandTimeoutRef.current = window.setTimeout(() => {
            setExpanded(true)
            expandTimeoutRef.current = null
        }, 500)
    }

    const handleMouseLeave = () => {
        clearExpandTimeout()
        setExpanded(false)
    }

    const handleFocus = () => {
        if (isNavigationLocked) {
            return
        }

        clearExpandTimeout()
        setExpanded(true)
    }

    const handleBlur = (event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget)) {
            return
        }

        setExpanded(false)
    }

    const handleNavMouseDown = (event: MouseEvent<HTMLAnchorElement>) => {
        if (isNavigationLocked) {
            event.preventDefault()
            return
        }

        if (sidebarIsExpanded) {
            return
        }

        event.preventDefault()
    }

    const handleNavClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (isNavigationLocked) {
            event.preventDefault()
            return
        }

        if (sidebarIsExpanded) {
            return
        }

        event.preventDefault()
    }

    useEffect(() => {
        return clearExpandTimeout
    }, [])

    useEffect(() => {
        if (!isNavigationLocked) {
            return
        }

        clearExpandTimeout()
    }, [isNavigationLocked])

    return (
        <>
            <div
                className={cn(
                    `pointer-events-none fixed inset-0 z-20 bg-black/20 opacity-0 transition-opacity ${sidebarTransitionClass}`,
                    sidebarIsExpanded && "opacity-100"
                )}
            />
            <aside
                className={cn(
                    `fixed inset-y-0 left-0 z-30 overflow-hidden border-r bg-card p-3 shadow-sm transition-[width] ${sidebarTransitionClass}`,
                    sidebarIsExpanded ? "w-64" : "w-[4.5rem]",
                    isNavigationLocked && "select-none"
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
            >
                <div className="mb-4 space-y-3">
                    <div className="flex h-10 items-center rounded-lg px-2">
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                            <Image
                                src="/assets/logos/solveonyx_cube.png"
                                alt="SolveOnyx"
                                width={32}
                                height={32}
                                className="size-8 object-contain"
                                priority
                            />
                        </div>
                        <div
                            className={cn(
                                "ml-3 min-w-0 opacity-0 transition-opacity duration-150",
                                sidebarIsExpanded && "opacity-100"
                            )}
                        >
                            <div className="truncate text-base font-semibold tracking-tight">SolveOnyx CX</div>
                            <div className="truncate text-xs text-muted-foreground">Admin workspace</div>
                        </div>
                    </div>
                    <Separator />
                </div>

                <nav className="space-y-1">
                    {appNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(`${item.href}/`))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex h-10 items-center rounded-lg px-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                    isNavigationLocked && "pointer-events-none opacity-50"
                                )}
                                title={item.label}
                                onMouseDown={handleNavMouseDown}
                                onClick={handleNavClick}
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <span
                                    className={cn(
                                        "ml-2 min-w-0 truncate opacity-0 transition-opacity duration-150",
                                        sidebarIsExpanded && "opacity-100"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}
