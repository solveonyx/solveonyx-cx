import { Model } from "./model"
import { ProductLine } from "./productLine"

export type ProductLineWithModels = ProductLine & {
    models: Model[]
}
