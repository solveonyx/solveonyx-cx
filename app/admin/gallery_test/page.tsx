"use client"

import { useEffect, useMemo, useState } from "react"
import { SelectionGallery } from "@/components/selectionGallery"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchConfigs } from "@/services/configurableService"
import { Config } from "@/types"

export default function GalleryTestPage() {
    const [configs, setConfigs] = useState<Config[]>([])
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const data = await fetchConfigs()
                setConfigs(data)
                setSelectedConfigId((current) => current ?? data[0]?.id ?? null)
            } catch (error) {
                console.error("Failed to load configs:", error)
                setErrorMessage("Could not load configs.")
            } finally {
                setIsLoading(false)
            }
        }

        loadConfigs()
    }, [])

    const selectedConfig = useMemo(() => {
        return configs.find((config) => config.id === selectedConfigId) ?? null
    }, [configs, selectedConfigId])

    return (
        <div className="mx-auto max-w-5xl space-y-5 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gallery Test</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Select a config from the gallery to set the active parent item.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configs</CardTitle>
                    <CardDescription>Gallery rows are labeled from the config_name field.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="w-full max-w-60 space-y-2">
                            <Skeleton className="h-11 w-full" />
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 md:flex-row md:items-start">
                            <SelectionGallery
                                items={configs}
                                selectedId={selectedConfigId}
                                getItemLabel={(config) => config.name}
                                onSelect={(config) => setSelectedConfigId(config.id)}
                                emptyMessage="No configs found."
                            />

                            <div className="min-w-0 flex-1 rounded-lg bg-muted/30 p-4">
                                <div className="mb-2 text-sm font-medium">Selected Config</div>
                                {selectedConfig ? (
                                    <div className="space-y-2">
                                        <div className="text-lg font-semibold">{selectedConfig.name}</div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">ID: {selectedConfig.id}</Badge>
                                            <Badge variant="outline">
                                                Display Order: {selectedConfig.displayOrder}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No config selected.</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertTitle>Unable to load configs</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
