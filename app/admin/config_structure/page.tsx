import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { fetchConfigHierarchy } from "@/services/configurableHierarchyService"

export default async function ConfigurationHierarchyPage() {
    const hierarchy = await fetchConfigHierarchy()

    return (
        <div className="mx-auto max-w-4xl space-y-5 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Configuration Hierarchy</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Review configs, their types, and available options.
                </p>
            </div>

            {hierarchy.length === 0 && (
                <Alert>
                    <AlertTitle>No configs found</AlertTitle>
                    <AlertDescription>Create a config before reviewing the hierarchy.</AlertDescription>
                </Alert>
            )}

            {hierarchy.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configs</CardTitle>
                        <CardDescription>Each config is grouped with its nested options.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {hierarchy.map((config) => (
                            <div key={config.id} className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-medium">{config.name}</div>
                                    {config.configTypeName && (
                                        <Badge variant="secondary">{config.configTypeName}</Badge>
                                    )}
                                    <Badge variant="outline">{config.options.length} options</Badge>
                                </div>

                                {config.options.length > 0 && (
                                    <div className="ml-4 space-y-2 border-l pl-4">
                                        {config.options.map((option) => (
                                            <div key={option.id} className="text-sm text-muted-foreground">
                                                {option.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Separator />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
