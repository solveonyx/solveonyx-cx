import { ProductLine, ProductLineModel } from "@/types"

export type ProductLineWithModels = ProductLine & {
    models: ProductLineModel[]
}