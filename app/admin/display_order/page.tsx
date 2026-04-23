"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    DisplayOrderRepairSummary,
    fetchProductLines,
    fetchProducts,
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
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Display Order Repair</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Re-sequence display order values to remove duplicates, gaps, and null issues.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Display Order</CardTitle>
                    <CardDescription>Repair ordering across all products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={runReestablishProducts}
                        disabled={isRunningProducts}
                    >
                        {isRunningProducts ? "Running..." : "Re-establish Products"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product-Line Display Order</CardTitle>
                    <CardDescription>Repair product lines for a selected product.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="productForLines">Product</Label>
                        <Select
                        value={selectedProductIdForLines}
                        onValueChange={setSelectedProductIdForLines}
                        disabled={isLoadingProducts}
                    >
                            <SelectTrigger id="productForLines" className="w-full">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={runReestablishProductLines} disabled={isRunningProductLines}>
                        {isRunningProductLines ? "Running..." : "Re-establish Product Lines"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Model Display Order</CardTitle>
                    <CardDescription>Repair models within a selected product line.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="productForModels">Product</Label>
                        <Select
                            value={selectedProductIdForModels}
                            onValueChange={setSelectedProductIdForModels}
                            disabled={isLoadingProducts}
                        >
                            <SelectTrigger id="productForModels" className="w-full">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="productLineForModels">Product Line</Label>
                        <Select
                            value={selectedProductLineId}
                            onValueChange={setSelectedProductLineId}
                            disabled={!selectedProductIdForModels || isLoadingProductLines}
                        >
                            <SelectTrigger id="productLineForModels" className="w-full">
                                <SelectValue placeholder="Select product line" />
                            </SelectTrigger>
                            <SelectContent>
                                {productLines.map((line) => (
                                    <SelectItem key={line.id} value={line.id}>
                                        {line.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={runReestablishModels} disabled={isRunningModels}>
                        {isRunningModels ? "Running..." : "Re-establish Models"}
                    </Button>
                </CardContent>
            </Card>

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertTitle>Display order issue</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Recent Results</CardTitle>
                    <CardDescription>Latest repair runs and their update counts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {results.length === 0 && (
                        <p className="text-sm text-muted-foreground">No repair runs yet.</p>
                    )}
                    {results.length > 0 && (
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <div key={`${result.timestamp}-${index}`} className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-medium">{result.label}</div>
                                        <Badge variant="outline">{result.timestamp}</Badge>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Entity</TableHead>
                                                <TableHead>Scanned</TableHead>
                                                <TableHead>Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.summaries.map((summary) => (
                                                <TableRow key={`${summary.entity}-${result.timestamp}`}>
                                                    <TableCell>{summary.entity}</TableCell>
                                                    <TableCell>{summary.scanned}</TableCell>
                                                    <TableCell>{summary.updated}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Separator />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {(selectedProductForModelScope || selectedLineForModelScope) && (
                <Card>
                    <CardContent className="space-y-1 pt-4 text-sm text-muted-foreground">
                    {selectedProductForModelScope && (
                        <div>Model scope product: {selectedProductForModelScope.name}</div>
                    )}
                    {selectedLineForModelScope && (
                        <div>Model scope line: {selectedLineForModelScope.name}</div>
                    )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
