import { supabase } from "@/lib/supabase"
import { ProductLineWithModels } from "@/types/productHierarchy"

// GET FULL HIERARCHY FOR A PRODUCT
export async function fetchProductHierarchy(
    productId: string
): Promise<ProductLineWithModels[]> {
    const { data, error } = await supabase
        .from("product_line")
        .select(`
      id,
      product_id,
      name,
      display_order,
      product_line_model (
        id,
        product_line_id,
        name,
        display_order
      )
    `)
        .eq("product_id", productId)
        .order("display_order")

    if (error) {
        console.error("fetchProductHierarchy error:", error)
        throw error
    }

    return (data ?? []).map((pl) => ({
        id: pl.id,
        productId: pl.product_id,
        name: pl.name,
        displayOrder: pl.display_order,
        models: (pl.product_line_model ?? []).map((m: {
            id: string
            product_line_id: string
            name: string
            display_order: number
        }) => ({
            id: m.id,
            productLineId: m.product_line_id,
            name: m.name,
            displayOrder: m.display_order
        }))
    }))
}