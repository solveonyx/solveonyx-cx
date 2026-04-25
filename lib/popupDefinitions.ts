export type PopupButtonCount = 1 | 2 | 3

export type PopupDefinition = {
    messageText: string
    buttonCount: PopupButtonCount
    buttonLabels: [string] | [string, string] | [string, string, string]
}

export const popupDefinitions = {
    assignedProductLines: {
        messageText:
            "Remove assigned product lines for {productName} before removing the product from this configurable.",
        buttonCount: 1,
        buttonLabels: ["OK"]
    },
    assignedModels: {
        messageText:
            "Remove assigned models for {productLineName} before removing the product line from this configurable.",
        buttonCount: 1,
        buttonLabels: ["OK"]
    }
} satisfies Record<string, PopupDefinition>
