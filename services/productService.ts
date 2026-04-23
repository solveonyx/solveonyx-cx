import { supabase } from "@/lib/supabase"
import { normalizeDisplayOrders } from "@/lib/displayOrder"
import { Model, Product, ProductLine } from "@/types"

// GET ALL PRODUCTS
export async function fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("prod")
        .select("id, prod_name, display_order")
        .order("display_order")

    if (error) {
        console.error("fetchProducts error:", error)
        throw error
    }

    return (data ?? []).map((p) => ({
        id: p.id,
        name: p.prod_name,
        displayOrder: p.display_order
    }))
}

// CREATE PRODUCT
export async function createProduct(name: string): Promise<Product> {
    const { data, error } = await supabase
        .from("prod")
        .insert([{ prod_name: name }])
        .select("id, prod_name, display_order")
        .single()

    if (error) {
        console.error("createProduct error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.prod_name,
        displayOrder: data.display_order
    }
}

export type UpdateProductInput = {
    name?: string
    displayOrder?: number | null
}

// UPDATE PRODUCT
export async function updateProduct(
    productId: string,
    updates: UpdateProductInput
): Promise<Product> {
    const payload: {
        prod_name?: string
        display_order?: number | null
    } = {}

    if (updates.name !== undefined) {
        payload.prod_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateProduct requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("prod")
        .update(payload)
        .eq("id", productId)
        .select("id, prod_name, display_order")
        .single()

    if (error) {
        console.error("updateProduct error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.prod_name,
        displayOrder: data.display_order
    }
}

// GET PRODUCT LINES BY PRODUCT
export async function fetchProductLines(productId: string): Promise<ProductLine[]> {
    const { data, error } = await supabase
        .from("prod_line")
        .select("id, prod_id, prod_line_name, display_order")
        .eq("prod_id", productId)
        .order("display_order")

    if (error) {
        console.error("fetchProductLines error:", error)
        throw error
    }

    return (data ?? []).map((pl) => ({
        id: pl.id,
        productId: pl.prod_id,
        name: pl.prod_line_name,
        displayOrder: pl.display_order
    }))
}

// CREATE PRODUCT LINE
export async function createProductLine(
    productId: string,
    name: string
): Promise<ProductLine> {
    const { count, error: countError } = await supabase
        .from("prod_line")
        .select("id", { count: "exact", head: true })
        .eq("prod_id", productId)

    if (countError) {
        console.error("createProductLine count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("prod_line")
        .insert([{
            prod_id: productId,
            prod_line_name: name,
            display_order: nextDisplayOrder
        }])
        .select("id, prod_id, prod_line_name, display_order")
        .single()

    if (error) {
        console.error("createProductLine error:", error)
        throw error
    }

    return {
        id: data.id,
        productId: data.prod_id,
        name: data.prod_line_name,
        displayOrder: data.display_order
    }
}

export type UpdateProductLineInput = {
    productId?: string
    name?: string
    displayOrder?: number | null
}

// UPDATE PRODUCT LINE
export async function updateProductLine(
    productLineId: string,
    updates: UpdateProductLineInput
): Promise<ProductLine> {
    const payload: {
        prod_id?: string
        prod_line_name?: string
        display_order?: number | null
    } = {}

    if (updates.productId !== undefined) {
        payload.prod_id = updates.productId
    }

    if (updates.name !== undefined) {
        payload.prod_line_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateProductLine requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("prod_line")
        .update(payload)
        .eq("id", productLineId)
        .select("id, prod_id, prod_line_name, display_order")
        .single()

    if (error) {
        console.error("updateProductLine error:", error)
        throw error
    }

    return {
        id: data.id,
        productId: data.prod_id,
        name: data.prod_line_name,
        displayOrder: data.display_order
    }
}


// GET MODELS BY PRODUCT LINE
export async function fetchModels(
    productLineId: string
): Promise<Model[]> {
    const { data, error } = await supabase
        .from("model")
        .select("id, prod_line_id, model_name, display_order")
        .eq("prod_line_id", productLineId)
        .order("display_order")

    if (error) {
        console.error("fetchModels error:", error)
        throw error
    }

    return (data ?? []).map((m) => ({
        id: m.id,
        productLineId: m.prod_line_id,
        name: m.model_name,
        displayOrder: m.display_order
    }))
}

// CREATE MODEL
export async function createModel(
    productLineId: string,
    name: string
): Promise<Model> {
    const { count, error: countError } = await supabase
        .from("model")
        .select("id", { count: "exact", head: true })
        .eq("prod_line_id", productLineId)

    if (countError) {
        console.error("createModel count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("model")
        .insert([{
            prod_line_id: productLineId,
            model_name: name,
            display_order: nextDisplayOrder
        }])
        .select("id, prod_line_id, model_name, display_order")
        .single()

    if (error) {
        console.error("createModel error:", error)
        throw error
    }

    return {
        id: data.id,
        productLineId: data.prod_line_id,
        name: data.model_name,
        displayOrder: data.display_order
    }
}

export type UpdateModelInput = {
    productLineId?: string
    name?: string
    displayOrder?: number | null
}

// UPDATE MODEL
export async function updateModel(
    modelId: string,
    updates: UpdateModelInput
): Promise<Model> {
    const payload: {
        prod_line_id?: string
        model_name?: string
        display_order?: number | null
    } = {}

    if (updates.productLineId !== undefined) {
        payload.prod_line_id = updates.productLineId
    }

    if (updates.name !== undefined) {
        payload.model_name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateModel requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("model")
        .update(payload)
        .eq("id", modelId)
        .select("id, prod_line_id, model_name, display_order")
        .single()

    if (error) {
        console.error("updateModel error:", error)
        throw error
    }

    return {
        id: data.id,
        productLineId: data.prod_line_id,
        name: data.model_name,
        displayOrder: data.display_order
    }
}

type DisplayOrderEntity = "prod" | "prod_line" | "model"

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

export async function reestablishProductDisplayOrder(): Promise<DisplayOrderRepairSummary> {
    const { data, error } = await supabase
        .from("prod")
        .select("id, display_order")

    if (error) {
        console.error("reestablishProductDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("prod", changed)

    return {
        entity: "prod",
        scanned: rows.length,
        updated
    }
}

export async function reestablishProductLineDisplayOrder(
    productId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("prod_line")
        .select("id, prod_id, display_order")

    if (productId) {
        query = query.eq("prod_id", productId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishProductLineDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        prod_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.prod_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("prod_line", changed)

    return {
        entity: "prod_line",
        scanned: rows.length,
        updated
    }
}

export async function reestablishModelDisplayOrder(
    productLineId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("model")
        .select("id, prod_line_id, display_order")

    if (productLineId) {
        query = query.eq("prod_line_id", productLineId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishModelDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        prod_line_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.prod_line_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("model", changed)

    return {
        entity: "model",
        scanned: rows.length,
        updated
    }
}

export async function reestablishAllDisplayOrders(): Promise<DisplayOrderRepairSummary[]> {
    const productSummary = await reestablishProductDisplayOrder()
    const productLineSummary = await reestablishProductLineDisplayOrder()
    const modelSummary = await reestablishModelDisplayOrder()

    return [productSummary, productLineSummary, modelSummary]
}
