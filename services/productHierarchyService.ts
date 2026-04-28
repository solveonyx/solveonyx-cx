import { supabase } from "@/lib/supabase"
import { ProductLineWithModels } from "@/types/productHierarchy"

// GET FULL HIERARCHY FOR A PRODUCT
export async function fetchProductHierarchy(
    productId?: string
): Promise<ProductLineWithModels[]> {
    let query = supabase
        .from("prod_line")
        .select(`
      id,
      prod_id,
      prod_line_name,
      display_order,
      model (
        id,
        prod_line_id,
        model_name,
        display_order
      )
    `)
        .order("display_order")

    if (productId) {
        query = query.eq("prod_id", productId)
    }

    const { data, error } = await query

    if (error) {
        console.error("fetchProductHierarchy error:", error)
        throw error
    }

    return (data ?? []).map((pl) => ({
        id: pl.id,
        productId: pl.prod_id,
        name: pl.prod_line_name,
        displayOrder: pl.display_order,
        models: (pl.model ?? []).map((m: {
            id: string
            prod_line_id: string
            model_name: string
            display_order: number
        }) => ({
            id: m.id,
            productLineId: m.prod_line_id,
            name: m.model_name,
            displayOrder: m.display_order
        }))
            .sort((a, b) => {
                if (a.displayOrder !== b.displayOrder) {
                    return a.displayOrder - b.displayOrder
                }

                return a.id.localeCompare(b.id)
            })
    }))
        .sort((a, b) => {
            if (a.displayOrder !== b.displayOrder) {
                return a.displayOrder - b.displayOrder
            }

            return a.id.localeCompare(b.id)
        })
}
