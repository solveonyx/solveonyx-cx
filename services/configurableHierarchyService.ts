import { supabase } from "@/lib/supabase"
import { ConfigWithOptions } from "@/types/configHierarchy"

// GET FULL CONFIG HIERARCHY (ALL CONFIGS WITH CHILD OPTIONS)
export async function fetchConfigHierarchy(): Promise<ConfigWithOptions[]> {
    const query = supabase
        .from("config")
        .select(`
      id,
      config_type_id,
      config_name,
      display_order,
      config_option (
        id,
        config_id,
        config_option_name,
        display_order
      )
    `)
        .order("display_order")

    const { data, error } = await query
    if (error) {
        console.error("fetchConfigHierarchy error:", error)
        throw error
    }

    const configTypeIds = Array.from(
        new Set(
            (data ?? [])
                .map((config) => config.config_type_id)
                .filter((id): id is string => Boolean(id))
        )
    )

    let configTypeNameById = new Map<string, string>()
    if (configTypeIds.length > 0) {
        const { data: typesData, error: typesError } = await supabase
            .from("config_type")
            .select("id, config_type_name")
            .in("id", configTypeIds)

        if (typesError) {
            console.error("fetchConfigHierarchy config_type lookup error:", typesError)
            throw typesError
        }

        configTypeNameById = new Map(
            (typesData ?? []).map((typeRow) => [typeRow.id, typeRow.config_type_name])
        )
    }

    return (data ?? []).map((config) => ({
        id: config.id,
        configTypeId: config.config_type_id,
        name: config.config_name,
        displayOrder: config.display_order,
        configTypeName: configTypeNameById.get(config.config_type_id) ?? null,
        options: (config.config_option ?? [])
            .map((option) => ({
                id: option.id,
                configId: option.config_id,
                name: option.config_option_name,
                displayOrder: option.display_order
            }))
            .sort((a, b) => {
                if (a.displayOrder !== b.displayOrder) {
                    return a.displayOrder - b.displayOrder
                }
                return a.id.localeCompare(b.id)
            })
    }))
}
