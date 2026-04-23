"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { appNavItems } from "@/lib/app-nav"
import { cn } from "@/lib/utils"

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed inset-y-0 left-0 w-64 overflow-y-auto border-r bg-card p-4">
            <div className="mb-4 space-y-3">
                <div>
                    <div className="text-base font-semibold tracking-tight">SolveOnyx CX</div>
                    <div className="text-xs text-muted-foreground">Admin workspace</div>
                </div>
                <Badge variant="secondary">Navigation</Badge>
                <Separator />
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
                                "block rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
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
