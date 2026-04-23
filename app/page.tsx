import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function Page() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">SolveOnyx CX</CardTitle>
          <CardDescription>Configuration and product hierarchy administration.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/prod_mgmt">Product Management</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/config_mgmt">Configuration Management</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
