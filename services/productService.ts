import { supabase } from "@/lib/supabase"
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
    const { data, error } = await supabase
        .from("product_line")
        .insert([{ product_id: productId, name }])
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
    const { data, error } = await supabase
        .from("product_line_model")
        .insert([{ product_line_id: productLineId, name }])
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