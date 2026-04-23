export type HierarchyEditorChild = {
    id: string
    name: string
    displayOrder: number
}

export type HierarchyEditorParent<TChild extends HierarchyEditorChild = HierarchyEditorChild> = {
    id: string
    name: string
    displayOrder: number
    children: TChild[]
}
