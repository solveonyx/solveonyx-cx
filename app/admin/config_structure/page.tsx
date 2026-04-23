import { fetchConfigHierarchy } from "@/services/configurableHierarchyService"

export default async function ConfigurationHierarchyPage() {
    const hierarchy = await fetchConfigHierarchy()

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-bold">Configuration Hierarchy</h1>

            {hierarchy.length === 0 && <div>No configs found</div>}

            {hierarchy.length > 0 && (
                <div className="space-y-2">
                    {hierarchy.map((config) => (
                        <div key={config.id} className="ml-4 mt-2">
                            <div className="font-medium">
                                {config.name}
                                {config.configTypeName ? ` (${config.configTypeName})` : ""}
                            </div>

                            {config.options.map((option) => (
                                <div key={option.id} className="ml-4 text-sm">
                                    {option.name}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
