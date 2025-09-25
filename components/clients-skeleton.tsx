import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ClientsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="p-6">
        {/* Title Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Table Skeleton */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <div className="border-b border-border">
              <div className="flex items-center px-6 py-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-48 ml-8" />
                <Skeleton className="h-4 w-48 ml-8" />
                <Skeleton className="h-4 w-32 ml-8" />
                <Skeleton className="h-4 w-32 ml-8" />
                <Skeleton className="h-4 w-48 ml-8" />
              </div>
            </div>
            
            {/* Table Rows Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-border last:border-b-0">
                <div className="flex items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-32 ml-8" />
                  <div className="ml-8 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16 ml-8" />
                  <Skeleton className="h-4 w-20 ml-8" />
                  <div className="flex items-center gap-2 ml-8">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
