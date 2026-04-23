import { Config } from "./config"
import { ConfigOption } from "./configOption"

export type ConfigWithOptions = Config & {
    configTypeName: string | null
    options: ConfigOption[]
}
