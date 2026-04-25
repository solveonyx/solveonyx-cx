"use client"

import { createContext, ReactNode, useContext, useMemo, useState } from "react"

type AppShellLockContextValue = {
    isNavigationLocked: boolean
    setNavigationLocked: (locked: boolean) => void
}

const AppShellLockContext = createContext<AppShellLockContextValue | null>(null)

export function AppShellLockProvider({ children }: { children: ReactNode }) {
    const [isNavigationLocked, setNavigationLocked] = useState(false)

    const value = useMemo(() => ({
        isNavigationLocked,
        setNavigationLocked
    }), [isNavigationLocked])

    return (
        <AppShellLockContext.Provider value={value}>
            {children}
        </AppShellLockContext.Provider>
    )
}

export function useAppShellLock() {
    const context = useContext(AppShellLockContext)

    if (!context) {
        throw new Error("useAppShellLock must be used within AppShellLockProvider.")
    }

    return context
}
