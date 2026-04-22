"use client"

import { useEffect, useState } from "react"
import { Gallery } from "@/components/gallery"
import { fetchProducts } from "@/services/productService"
import { Product } from "@/types"

export default function AdminPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchProducts()
                setProducts(data)
            } catch (err) {
                console.error("Failed to load products:", err)
            }
        }

        load()
    }, [])

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* LEFT: Product Gallery */}
            <Gallery
                items={products}
                selectedId={selectedProduct?.id}
                onSelect={(item) => setSelectedProduct(item)}
            />

            {/* RIGHT: Debug Panel */}
            <div className="border rounded p-4">
                <h2 className="font-semibold mb-2">Selected Product</h2>
                <pre>{JSON.stringify(selectedProduct, null, 2)}</pre>
            </div>
        </div>
    )
}