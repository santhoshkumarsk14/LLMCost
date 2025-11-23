import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="backdrop-blur-md bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="backdrop-blur-md bg-card/50 border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Requests Table */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2"><Skeleton className="h-4 w-12" /></th>
                  <th className="text-left p-2"><Skeleton className="h-4 w-8" /></th>
                  <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-2"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-2"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}