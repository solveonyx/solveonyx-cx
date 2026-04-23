"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { appNavItems } from "@/lib/app-nav"
import { cn } from "@/lib/utils"

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed inset-y-0 left-0 w-64 overflow-y-auto border-r bg-background p-4">
            <div className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
                Navigation
            </div>

            <nav className="space-y-1">
                {appNavItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(`${item.href}/`))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "block rounded px-3 py-2 text-sm transition-colors",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
