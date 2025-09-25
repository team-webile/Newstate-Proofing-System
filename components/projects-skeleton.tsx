import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProjectsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
    

      {/* Main Content Skeleton */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Title Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Projects Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Thumbnail Skeleton */}
                  <Skeleton className="aspect-video rounded-lg" />

                  {/* Project Info Skeleton */}
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>

                  {/* Project Stats Skeleton */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>

                  {/* Project Settings Skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>

          {/* Results Info Skeleton */}
          <div className="text-center mt-4">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </main>
    </div>
  )
}
