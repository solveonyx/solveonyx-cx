export type AppNavItem = {
    label: string
    href: string
}

export const appNavItems: AppNavItem[] = [
    { label: "Home", href: "/" },
    { label: "Configuration Hierarchy", href: "/admin/config_structure" },
    { label: "Product Hierarchy", href: "/admin/prod_structure" },
    { label: "Product Management", href: "/admin/prod_mgmt" },
    { label: "Configuration Management", href: "/admin/config_mgmt" },
    { label: "Products Editor", href: "/admin/products-editor" },
    { label: "Display Order", href: "/admin/display_order" }
]
