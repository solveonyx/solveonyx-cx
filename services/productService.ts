import { supabase } from "@/lib/supabase"
import { normalizeDisplayOrders } from "@/lib/displayOrder"
import { Product, ProductLine, ProductLineModel } from "@/types"

// GET ALL PRODUCTS
export async function fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("product")
        .select("id, name, display_order")
        .order("display_order")

    if (error) {
        console.error("fetchProducts error:", error)
        throw error
    }

    return (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        displayOrder: p.display_order
    }))
}

// CREATE PRODUCT
export async function createProduct(name: string): Promise<Product> {
    const { data, error } = await supabase
        .from("product")
        .insert([{ name }])
        .select("id, name, display_order")
        .single()

    if (error) {
        console.error("createProduct error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.name,
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
        name?: string
        display_order?: number | null
    } = {}

    if (updates.name !== undefined) {
        payload.name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateProduct requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("product")
        .update(payload)
        .eq("id", productId)
        .select("id, name, display_order")
        .single()

    if (error) {
        console.error("updateProduct error:", error)
        throw error
    }

    return {
        id: data.id,
        name: data.name,
        displayOrder: data.display_order
    }
}

// GET PRODUCT LINES BY PRODUCT
export async function fetchProductLines(productId: string): Promise<ProductLine[]> {
    const { data, error } = await supabase
        .from("product_line")
        .select("id, product_id, name, display_order")
        .eq("product_id", productId)
        .order("display_order")

    if (error) {
        console.error("fetchProductLines error:", error)
        throw error
    }

    return (data ?? []).map((pl) => ({
        id: pl.id,
        productId: pl.product_id,
        name: pl.name,
        displayOrder: pl.display_order
    }))
}

// CREATE PRODUCT LINE
export async function createProductLine(
    productId: string,
    name: string
): Promise<ProductLine> {
    const { count, error: countError } = await supabase
        .from("product_line")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)

    if (countError) {
        console.error("createProductLine count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("product_line")
        .insert([{
            product_id: productId,
            name,
            display_order: nextDisplayOrder
        }])
        .select("id, product_id, name, display_order")
        .single()

    if (error) {
        console.error("createProductLine error:", error)
        throw error
    }

    return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
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
        product_id?: string
        name?: string
        display_order?: number | null
    } = {}

    if (updates.productId !== undefined) {
        payload.product_id = updates.productId
    }

    if (updates.name !== undefined) {
        payload.name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateProductLine requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("product_line")
        .update(payload)
        .eq("id", productLineId)
        .select("id, product_id, name, display_order")
        .single()

    if (error) {
        console.error("updateProductLine error:", error)
        throw error
    }

    return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        displayOrder: data.display_order
    }
}


// GET MODELS BY PRODUCT LINE
export async function fetchModels(
    productLineId: string
): Promise<ProductLineModel[]> {
    const { data, error } = await supabase
        .from("product_line_model")
        .select("id, product_line_id, name, display_order")
        .eq("product_line_id", productLineId)
        .order("display_order")

    if (error) {
        console.error("fetchModels error:", error)
        throw error
    }

    return (data ?? []).map((m) => ({
        id: m.id,
        productLineId: m.product_line_id,
        name: m.name,
        displayOrder: m.display_order
    }))
}

// CREATE MODEL
export async function createModel(
    productLineId: string,
    name: string
): Promise<ProductLineModel> {
    const { count, error: countError } = await supabase
        .from("product_line_model")
        .select("id", { count: "exact", head: true })
        .eq("product_line_id", productLineId)

    if (countError) {
        console.error("createModel count error:", countError)
        throw countError
    }

    const nextDisplayOrder = (count ?? 0) + 1

    const { data, error } = await supabase
        .from("product_line_model")
        .insert([{
            product_line_id: productLineId,
            name,
            display_order: nextDisplayOrder
        }])
        .select("id, product_line_id, name, display_order")
        .single()

    if (error) {
        console.error("createModel error:", error)
        throw error
    }

    return {
        id: data.id,
        productLineId: data.product_line_id,
        name: data.name,
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
): Promise<ProductLineModel> {
    const payload: {
        product_line_id?: string
        name?: string
        display_order?: number | null
    } = {}

    if (updates.productLineId !== undefined) {
        payload.product_line_id = updates.productLineId
    }

    if (updates.name !== undefined) {
        payload.name = updates.name
    }

    if (updates.displayOrder !== undefined) {
        payload.display_order = updates.displayOrder
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("updateModel requires at least one field to update.")
    }

    const { data, error } = await supabase
        .from("product_line_model")
        .update(payload)
        .eq("id", modelId)
        .select("id, product_line_id, name, display_order")
        .single()

    if (error) {
        console.error("updateModel error:", error)
        throw error
    }

    return {
        id: data.id,
        productLineId: data.product_line_id,
        name: data.name,
        displayOrder: data.display_order
    }
}

type DisplayOrderEntity = "product" | "product_line" | "product_line_model"

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
        .from("product")
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

    const updated = await applyDisplayOrderUpdates("product", changed)

    return {
        entity: "product",
        scanned: rows.length,
        updated
    }
}

export async function reestablishProductLineDisplayOrder(
    productId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("product_line")
        .select("id, product_id, display_order")

    if (productId) {
        query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishProductLineDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        product_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.product_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("product_line", changed)

    return {
        entity: "product_line",
        scanned: rows.length,
        updated
    }
}

export async function reestablishModelDisplayOrder(
    productLineId?: string
): Promise<DisplayOrderRepairSummary> {
    let query = supabase
        .from("product_line_model")
        .select("id, product_line_id, display_order")

    if (productLineId) {
        query = query.eq("product_line_id", productLineId)
    }

    const { data, error } = await query

    if (error) {
        console.error("reestablishModelDisplayOrder error:", error)
        throw error
    }

    const rows = (data ?? []) as Array<{
        id: string
        product_line_id: string
        display_order: number | null
    }>

    const normalized = normalizeDisplayOrders(rows, {
        getId: (row) => row.id,
        getDisplayOrder: (row) => row.display_order,
        getGroupKey: (row) => row.product_line_id
    })

    const changed = normalized
        .filter((row) => row.changed)
        .map((row) => ({ id: row.id, nextDisplayOrder: row.nextDisplayOrder }))

    const updated = await applyDisplayOrderUpdates("product_line_model", changed)

    return {
        entity: "product_line_model",
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
