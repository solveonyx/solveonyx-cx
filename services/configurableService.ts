import { supabase } from "@/lib/supabase"
import { normalizeDisplayOrders } from "@/lib/displayOrder"
import { Config, ConfigOption, ConfigType } from "@/types"

export type UpdateConfigTypeInput = {
    name?: string
    displayOrder?: number | null
}

export type UpdateConfigInput = {
    configTypeId?: string
    name?: string
    displayOrder?: number | null
}

export type UpdateConfigOptionInput = {
    configId?: string
    name?: string
    displayOrder?: number | null
}

// GET ALL CONFIG TYPES
export async function fetchConfigTypes(): Promise<ConfigType[]> {
    const { data, error } = await supabase
        .from("config_type")
        .select("id, config_type_name, display_order")
        .order("display_order")

    if (error) {
        console.error("fetchConfigTypes error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.config_type_name,
        displayOrder: row.display_order
    }))
}

// CREATE CONFIG TYPE
export async function createConfigType(name: string): Promise<ConfigType> {
    const { count, error: countError } = await supabase
        .from("config_type")
        .select("id", { count: "exact", head: true })

    if (countError) {
        console.error("createConfigType count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("config_type")
        .insert([{
            config_type_name: name,
            display_order: nextDisplayOrder
        }])
        .select("id, config_type_name, display_order")
        .single()

    if (error) {
        console.error("createConfigType error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.config_type_name,
        displayOrder: data.display_order
    }
}

// UPDATE CONFIG TYPE
export async function updateConfigType(
    configTypeId: string,
    updates: UpdateConfigTypeInput
): Promise<ConfigType> {
    const payload: {
        config_type_name?: string
        display_order?: number | null
    } = {}

    if (updates.name !== undefined) {
        payload.config_type_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateConfigType requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("config_type")
        .update(payload)
        .eq("id", configTypeId)
        .select("id, config_type_name, display_order")
        .single()

    if (error) {
        console.error("updateConfigType error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.config_type_name,
        displayOrder: data.display_order
    }
}

// GET CONFIGS (OPTIONALLY SCOPED TO TYPE)
export async function fetchConfigs(configTypeId?: string): Promise<Config[]> {
    let query = supabase
        .from("config")
        .select("id, config_type_id, config_name, display_order")
        .order("display_order")

    if (configTypeId) {
        query = query.eq("config_type_id", configTypeId)
    }

    const { data, error } = await query

    if (error) {
        console.error("fetchConfigs error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        configTypeId: row.config_type_id,
        name: row.config_name,
        displayOrder: row.display_order
    }))
}

// CREATE CONFIG
export async function createConfig(
    configTypeId: string,
    name: string
): Promise<Config> {
    const { count, error: countError } = await supabase
        .from("config")
        .select("id", { count: "exact", head: true })
        .eq("config_type_id", configTypeId)

    if (countError) {
        console.error("createConfig count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("config")
        .insert([{
            config_type_id: configTypeId,
            config_name: name,
            display_order: nextDisplayOrder
        }])
        .select("id, config_type_id, config_name, display_order")
        .single()

    if (error) {
        console.error("createConfig error:", error)
        throw error
    }

    return {
        id: data.id,
        configTypeId: data.config_type_id,
        name: data.config_name,
        displayOrder: data.display_order
    }
}

// UPDATE CONFIG
export async function updateConfig(
    configId: string,
    updates: UpdateConfigInput
): Promise<Config> {
    const payload: {
        config_type_id?: string
        config_name?: string
        display_order?: number | null
    } = {}

    if (updates.configTypeId !== undefined) {
        payload.config_type_id = updates.configTypeId
    }

    if (updates.name !== undefined) {
        payload.config_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateConfig requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("config")
        .update(payload)
        .eq("id", configId)
        .select("id, config_type_id, config_name, display_order")
        .single()

    if (error) {
        console.error("updateConfig error:", error)
        throw error
    }

    return {
        id: data.id,
        configTypeId: data.config_type_id,
        name: data.config_name,
        displayOrder: data.display_order
    }
}

// GET CONFIG OPTIONS (OPTIONALLY SCOPED TO CONFIG)
export async function fetchConfigOptions(configId?: string): Promise<ConfigOption[]> {
    let query = supabase
        .from("config_option")
        .select("id, config_id, config_option_name, display_order")
        .order("display_order")

    if (configId) {
        query = query.eq("config_id", configId)
    }

    const { data, error } = await query

    if (error) {
        console.error("fetchConfigOptions error:", error)
        throw error
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        configId: row.config_id,
        name: row.config_option_name,
        displayOrder: row.display_order
    }))
}

// CREATE CONFIG OPTION
export async function createConfigOption(
    configId: string,
    name: string
): Promise<ConfigOption> {
    const { count, error: countError } = await supabase
        .from("config_option")
        .select("id", { count: "exact", head: true })
        .eq("config_id", configId)

    if (countError) {
        console.error("createConfigOption count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("config_option")
        .insert([{
            config_id: configId,
            config_option_name: name,
            display_order: nextDisplayOrder
        }])
        .select("id, config_id, config_option_name, display_order")
        .single()

    if (error) {
        console.error("createConfigOption error:", error)
        throw error
    }

    return {
        id: data.id,
        configId: data.config_id,
        name: data.config_option_name,
        displayOrder: data.display_order
    }
}

// UPDATE CONFIG OPTION
export async function updateConfigOption(
    configOptionId: string,
    updates: UpdateConfigOptionInput
): Promise<ConfigOption> {
    const payload: {
        config_id?: string
        config_option_name?: string
        display_order?: number | null
    } = {}

    if (updates.configId !== undefined) {
        payload.config_id = updates.configId
    }

    if (updates.name !== undefined) {
        payload.config_option_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateConfigOption requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("config_option")
        .update(payload)
        .eq("id", configOptionId)
        .select("id, config_id, config_option_name, display_order")
        .single()

    if (error) {
        console.error("updateConfigOption error:", error)
        throw error
    }

    return {
        id: data.id,
        configId: data.config_id,
        name: data.config_option_name,
        displayOrder: data.display_order
    }
}

type DisplayOrderEntity = "config_type" | "config" | "config_option"

export type DisplayOrderRepairSummary = {
    entity: DisplayOrderEntity
    scanned: number
    updated: number
}

async function applyDisplayOrderUpdates(
    entity: DisplayOrderEntity,
    updates: Array<{ id: string; nextDisplayOrder: number }>
): Promise<number> {
    if (updates.length === 0) {
        return 0
    }

    const updateResults = await Promise.all(
        updates.map((update) =>
            supabase
                .from(entity)
                .update({ display_order: update.nextDisplayOrder })
                .eq("id", update.id)
        )
    )

    const failed = updateResults.find((result) => result.error)
    if (failed?.error) {
        console.error(`applyDisplayOrderUpdates (${entity}) error:`, failed.error)
        throw failed.error
    }

    return updates.length
}

export async function reestablishConfigTypeDisplayOrder(): Promise<DisplayOrderRepairSummary> {
    const { data, error } = await supabase
        .from("config_type")
        .select("id, display_order")

    if (error) {
        console.error("reestablishConfigTypeDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{ id: string; display_order: number | null }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("config_type", changed)

    return {
        entity: "config_type",
        scanned: rows.length,
        updated
    }
}

export async function reestablishConfigDisplayOrder(
    configTypeId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("config")
        .select("id, config_type_id, display_order")

    if (configTypeId) {
        query = query.eq("config_type_id", configTypeId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishConfigDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        config_type_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.config_type_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("config", changed)

    return {
        entity: "config",
        scanned: rows.length,
        updated
    }
}

export async function reestablishConfigOptionDisplayOrder(
    configId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("config_option")
        .select("id, config_id, display_order")

    if (configId) {
        query = query.eq("config_id", configId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishConfigOptionDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        config_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.config_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("config_option", changed)

    return {
        entity: "config_option",
        scanned: rows.length,
        updated
    }
}
