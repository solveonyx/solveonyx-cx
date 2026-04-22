"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DisplayOrderRepairSummary,
    fetchProductLines,
    fetchProducts,
    reestablishAllDisplayOrders,
    reestablishModelDisplayOrder,
    reestablishProductDisplayOrder,
    reestablishProductLineDisplayOrder
} from "@/services/productService"
import { Product, ProductLine } from "@/types"

type RepairResult = {
    label: string
    summaries: DisplayOrderRepairSummary[]
    timestamp: string
}

export default function DisplayOrderAdminPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [productLines, setProductLines] = useState<ProductLine[]>([])
    const [selectedProductIdForLines, setSelectedProductIdForLines] = useState("")
    const [selectedProductIdForModels, setSelectedProductIdForModels] = useState("")
    const [selectedProductLineId, setSelectedProductLineId] = useState("")
    const [results, setResults] = useState<RepairResult[]>([])
    const [errorMessage, setErrorMessage] = useState("")
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingProductLines, setIsLoadingProductLines] = useState(false)
    const [isRunningAll, setIsRunningAll] = useState(false)
    const [isRunningProducts, setIsRunningProducts] = useState(false)
    const [isRunningProductLines, setIsRunningProductLines] = useState(false)
    const [isRunningModels, setIsRunningModels] = useState(false)

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts()
                setProducts(data)
            } catch (error) {
                console.error("Failed to fetch products:", error)
                setErrorMessage("Could not load products.")
            } finally {
                setIsLoadingProducts(false)
            }
        }

        loadProducts()
    }, [])

    useEffect(() => {
        const loadProductLines = async () => {
            if (!selectedProductIdForModels) {
                setProductLines([])
                setSelectedProductLineId("")
                return
            }

            setIsLoadingProductLines(true)
            setErrorMessage("")
            setSelectedProductLineId("")

            try {
                const data = await fetchProductLines(selectedProductIdForModels)
                setProductLines(data)
            } catch (error) {
                console.error("Failed to fetch product lines:", error)
                setErrorMessage("Could not load product lines.")
            } finally {
                setIsLoadingProductLines(false)
            }
        }

        loadProductLines()
    }, [selectedProductIdForModels])

    const selectedProductForLineScope = useMemo(
        () => products.find((product) => product.id === selectedProductIdForLines),
        [products, selectedProductIdForLines]
    )

    const selectedProductForModelScope = useMemo(
        () => products.find((product) => product.id === selectedProductIdForModels),
        [products, selectedProductIdForModels]
    )

    const selectedLineForModelScope = useMemo(
        () => productLines.find((line) => line.id === selectedProductLineId),
        [productLines, selectedProductLineId]
    )

    const pushResult = (label: string, summaries: DisplayOrderRepairSummary[]) => {
        setResults((prev) => [
            {
                label,
                summaries,
                timestamp: new Date().toLocaleString()
            },
            ...prev
        ])
    }

    const runReestablishAll = async () => {
        setErrorMessage("")
        setIsRunningAll(true)
        try {
            const summaries = await reestablishAllDisplayOrders()
            pushResult("Re-establish ALL display orders", summaries)
        } catch (error) {
            console.error("reestablishAllDisplayOrders failed:", error)
            setErrorMessage("Failed to re-establish all display orders.")
        } finally {
            setIsRunningAll(false)
        }
    }

    const runReestablishProducts = async () => {
        setErrorMessage("")
        setIsRunningProducts(true)
        try {
            const summary = await reestablishProductDisplayOrder()
            pushResult("Re-establish PRODUCT display order", [summary])
        } catch (error) {
            console.error("reestablishProductDisplayOrder failed:", error)
            setErrorMessage("Failed to re-establish product display order.")
        } finally {
            setIsRunningProducts(false)
        }
    }

    const runReestablishProductLines = async () => {
        if (!selectedProductIdForLines) {
            setErrorMessage("Select a product for product-line re-sort.")
            return
        }

        setErrorMessage("")
        setIsRunningProductLines(true)
        try {
            const summary = await reestablishProductLineDisplayOrder(selectedProductIdForLines)
            const productName = selectedProductForLineScope?.name ?? "Selected Product"
            pushResult(`Re-establish PRODUCT LINE display order for ${productName}`, [summary])
        } catch (error) {
            console.error("reestablishProductLineDisplayOrder failed:", error)
            setErrorMessage("Failed to re-establish product-line display order.")
        } finally {
            setIsRunningProductLines(false)
        }
    }

    const runReestablishModels = async () => {
        if (!selectedProductLineId) {
            setErrorMessage("Select a product line for model re-sort.")
            return
        }

        setErrorMessage("")
        setIsRunningModels(true)
        try {
            const summary = await reestablishModelDisplayOrder(selectedProductLineId)
            const lineName = selectedLineForModelScope?.name ?? "Selected Product Line"
            pushResult(`Re-establish MODEL display order for ${lineName}`, [summary])
        } catch (error) {
            console.error("reestablishModelDisplayOrder failed:", error)
            setErrorMessage("Failed to re-establish model display order.")
        } finally {
            setIsRunningModels(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8 p-6">
            <div>
                <h1 className="text-xl font-semibold">Display Order Repair</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Re-sequence display order values to remove duplicates, gaps, and null issues.
                </p>
            </div>

            <section className="space-y-3 rounded border p-4">
                <h2 className="font-medium">No-Argument Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Button onClick={runReestablishAll} disabled={isRunningAll}>
                        {isRunningAll ? "Running..." : "Re-establish All"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={runReestablishProducts}
                        disabled={isRunningProducts}
                    >
                        {isRunningProducts ? "Running..." : "Re-establish Products"}
                    </Button>
                </div>
            </section>

            <section className="space-y-3 rounded border p-4">
                <h2 className="font-medium">Scoped Product-Line Re-sort</h2>
                <div className="space-y-1">
                    <label htmlFor="productForLines" className="block text-sm font-medium">
                        Product
                    </label>
                    <select
                        id="productForLines"
                        value={selectedProductIdForLines}
                        onChange={(event) => setSelectedProductIdForLines(event.target.value)}
                        disabled={isLoadingProducts}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Button onClick={runReestablishProductLines} disabled={isRunningProductLines}>
                    {isRunningProductLines ? "Running..." : "Re-establish Product Lines"}
                </Button>
            </section>

            <section className="space-y-3 rounded border p-4">
                <h2 className="font-medium">Scoped Model Re-sort</h2>
                <div className="space-y-1">
                    <label htmlFor="productForModels" className="block text-sm font-medium">
                        Product
                    </label>
                    <select
                        id="productForModels"
                        value={selectedProductIdForModels}
                        onChange={(event) => setSelectedProductIdForModels(event.target.value)}
                        disabled={isLoadingProducts}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="productLineForModels" className="block text-sm font-medium">
                        Product Line
                    </label>
                    <select
                        id="productLineForModels"
                        value={selectedProductLineId}
                        onChange={(event) => setSelectedProductLineId(event.target.value)}
                        disabled={!selectedProductIdForModels || isLoadingProductLines}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select product line</option>
                        {productLines.map((line) => (
                            <option key={line.id} value={line.id}>
                                {line.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Button onClick={runReestablishModels} disabled={isRunningModels}>
                    {isRunningModels ? "Running..." : "Re-establish Models"}
                </Button>
            </section>

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            <section className="space-y-3 rounded border p-4">
                <h2 className="font-medium">Recent Results</h2>
                {results.length === 0 && (
                    <p className="text-sm text-muted-foreground">No repair runs yet.</p>
                )}
                {results.map((result, index) => (
                    <div key={`${result.timestamp}-${index}`} className="rounded border p-3">
                        <div className="text-sm font-medium">{result.label}</div>
                        <div className="text-xs text-muted-foreground">{result.timestamp}</div>
                        <div className="mt-2 space-y-1 text-sm">
                            {result.summaries.map((summary) => (
                                <div key={`${summary.entity}-${result.timestamp}`}>
                                    {summary.entity}: scanned {summary.scanned}, updated {summary.updated}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {(selectedProductForModelScope || selectedLineForModelScope) && (
                <section className="rounded border p-4 text-sm text-muted-foreground">
                    {selectedProductForModelScope && (
                        <div>Model scope product: {selectedProductForModelScope.name}</div>
                    )}
                    {selectedLineForModelScope && (
                        <div>Model scope line: {selectedLineForModelScope.name}</div>
                    )}
                </section>
            )}
        </div>
    )
}
