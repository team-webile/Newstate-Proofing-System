import { notFound } from "next/navigation"
import Link from "next/link"
import { getReviewByShareLink, getDesignItemsByReviewId } from "@/lib/db"
import { CopyLinkButton } from "@/components/copy-link-button"
import LogoImage from "@/components/LogoImage"

export default async function ClientApprovePage({
  params,
}: {
  params: { shareLink: string }
}) {
  const review = await getReviewByShareLink(params.shareLink)

  if (!review) {
    notFound()
  }

  const designItems = await getDesignItemsByReviewId(review.id)

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-neutral-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <LogoImage 
              width={180}
              height={50}
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Project Title Bar */}
      <div className="bg-[#1a1a1a] border-b border-neutral-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              {review.project_number} - {review.project_name?.toUpperCase()}
            </h1>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors text-sm">
                📥 Download
              </button>
              <CopyLinkButton shareLink={params.shareLink} showUrl />
              <button className="px-6 py-2.5 bg-transparent border-2 border-[#fdb913] text-[#fdb913] font-bold rounded hover:bg-[#fdb913] hover:text-black transition-all uppercase tracking-wide text-sm">
                Approve Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="bg-[#0f0f0f] border-b border-neutral-800">
        <div className="container mx-auto px-6 py-4">
          <p className="text-neutral-300 text-sm">
            PLEASE CLICK THROUGH EACH ELEMENT OF YOUR PROJECT TO REVIEW AND OR APPROVE THE ELEMENT. DOUBLE CHECK ALL
            SPELLING AND PROVIDE ANY ANNOTATIONS AND COMMENTS FOR REVISIONS HERE.
          </p>
        </div>
      </div>

      {/* Main Content - Design Items Grid */}
      <main className="container mx-auto px-6 py-8">
        {designItems.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900 rounded-lg">
            <p className="text-neutral-400 text-lg">No design items uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {designItems.map((item) => (
              <Link
                key={item.id}
                href={`/review/${params.shareLink}`}
                className="group"
              >
                <div className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-brand-yellow transition-all relative">
                  <Image
                    src={item.file_url || "/placeholder.svg"}
                    alt={item.file_name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm font-semibold truncate">
                      {item.file_name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

