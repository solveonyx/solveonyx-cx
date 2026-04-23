import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminHomePage() {
    return (
        <div className="mx-auto flex min-h-screen max-w-4xl items-center p-6">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">SolveOnyx CX Admin</CardTitle>
                    <CardDescription>Jump into the tools that maintain product and configuration data.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href="/admin/products-editor">Products</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/display_order">Display Order</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
