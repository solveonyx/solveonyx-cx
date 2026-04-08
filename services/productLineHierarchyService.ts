import { supabase } from "@/lib/supabase"
import { ProductLineWithModels } from "@/types/productHierarchy"

// GET HIERARCHY FOR A SINGLE PRODUCT LINE
export async function fetchProductLineHierarchy(
    productLineId: string
): Promise<ProductLineWithModels> {
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
        .eq("id", productLineId)
        .single()

    if (error) {
        console.error("fetchProductLineHierarchy error:", error)
        throw error
    }

    return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        displayOrder: data.display_order,
        models: (data.product_line_model ?? []).map((m: {
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
    }
}