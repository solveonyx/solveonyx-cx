import { supabase } from "@/lib/supabase"
import { MapModelConfig, MapProdConfig, MapProdLineConfig } from "@/types"

// GET PRODUCT-CONFIG MAPPINGS
export async function fetchMapProdConfigs(): Promise<MapProdConfig[]> {
    const { data, error } = await supabase
        .from("map_prod-config")
        .select("prod_id, config_id")

    if (error) {
        console.error("fetchMapProdConfigs error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        prodId: row.prod_id,
        configId: row.config_id
    }))
}

// CREATE PRODUCT-CONFIG MAPPING
export async function createMapProdConfig(
    prodId: string,
    configId: string
): Promise<MapProdConfig> {
    const { data, error } = await supabase
        .from("map_prod-config")
        .insert([{
            prod_id: prodId,
            config_id: configId
        }])
        .select("prod_id, config_id")
        .single()

    if (error) {
        console.error("createMapProdConfig error:", error)
        throw error
    }

    return {
        prodId: data.prod_id,
        configId: data.config_id
    }
}

// DELETE PRODUCT-CONFIG MAPPING
export async function deleteMapProdConfig(
    prodId: string,
    configId: string
): Promise<void> {
    const { error } = await supabase
        .from("map_prod-config")
        .delete()
        .eq("prod_id", prodId)
        .eq("config_id", configId)

    if (error) {
        console.error("deleteMapProdConfig error:", error)
        throw error
    }
}

// GET MODEL-CONFIG MAPPINGS
export async function fetchMapModelConfigs(): Promise<MapModelConfig[]> {
    const { data, error } = await supabase
        .from("map_model-config")
        .select("model_id, config_id")

    if (error) {
        console.error("fetchMapModelConfigs error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        modelId: row.model_id,
        configId: row.config_id
    }))
}

// CREATE MODEL-CONFIG MAPPING
export async function createMapModelConfig(
    modelId: string,
    configId: string
): Promise<MapModelConfig> {
    const { data, error } = await supabase
        .from("map_model-config")
        .insert([{
            model_id: modelId,
            config_id: configId
        }])
        .select("model_id, config_id")
        .single()

    if (error) {
        console.error("createMapModelConfig error:", error)
        throw error
    }

    return {
        modelId: data.model_id,
        configId: data.config_id
    }
}

// DELETE MODEL-CONFIG MAPPING
export async function deleteMapModelConfig(
    modelId: string,
    configId: string
): Promise<void> {
    const { error } = await supabase
        .from("map_model-config")
        .delete()
        .eq("model_id", modelId)
        .eq("config_id", configId)

    if (error) {
        console.error("deleteMapModelConfig error:", error)
        throw error
    }
}

// GET PRODUCT LINE-CONFIG MAPPINGS
export async function fetchMapProdLineConfigs(): Promise<MapProdLineConfig[]> {
    const { data, error } = await supabase
        .from("map_prod_line-config")
        .select("prod_line_id, config_id")

    if (error) {
        console.error("fetchMapProdLineConfigs error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        prodLineId: row.prod_line_id,
        configId: row.config_id
    }))
}

// CREATE PRODUCT LINE-CONFIG MAPPING
export async function createMapProdLineConfig(
    prodLineId: string,
    configId: string
): Promise<MapProdLineConfig> {
    const { data, error } = await supabase
        .from("map_prod_line-config")
        .insert([{
            prod_line_id: prodLineId,
            config_id: configId
        }])
        .select("prod_line_id, config_id")
        .single()

    if (error) {
        console.error("createMapProdLineConfig error:", error)
        throw error
    }

    return {
        prodLineId: data.prod_line_id,
        configId: data.config_id
    }
}

// DELETE PRODUCT LINE-CONFIG MAPPING
export async function deleteMapProdLineConfig(
    prodLineId: string,
    configId: string
): Promise<void> {
    const { error } = await supabase
        .from("map_prod_line-config")
        .delete()
        .eq("prod_line_id", prodLineId)
        .eq("config_id", configId)

    if (error) {
        console.error("deleteMapProdLineConfig error:", error)
        throw error
    }
}
