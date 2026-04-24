import {
    Boxes,
    GalleryVerticalEnd,
    GripVertical,
    Home,
    ListTree,
    Package,
    PackageSearch,
    Settings2,
    SlidersHorizontal
} from "lucide-react"
import { LucideIcon } from "lucide-react"

export type AppNavItem = {
    label: string
    href: string
    icon: LucideIcon
}

export const appNavItems: AppNavItem[] = [
    { label: "Home", href: "/", icon: Home },
    { label: "Configuration Hierarchy", href: "/admin/config_structure", icon: ListTree },
    { label: "Product Hierarchy", href: "/admin/prod_structure", icon: Boxes },
    { label: "Product Management", href: "/admin/prod_mgmt", icon: PackageSearch },
    { label: "Configuration Management", href: "/admin/config_mgmt", icon: Settings2 },
    { label: "Products Editor", href: "/admin/products-editor", icon: Package },
    { label: "Pill Test", href: "/admin/pill_test", icon: SlidersHorizontal },
    { label: "Gallery Test", href: "/admin/gallery_test", icon: GalleryVerticalEnd },
    { label: "Display Order", href: "/admin/display_order", icon: GripVertical }
]
