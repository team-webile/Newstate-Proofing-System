import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/nsb-logo.png"
            alt="Newstate Branding Co."
            width={200}
            height={60}
            className="h-12 w-auto"
          />
        </div>

        {/* 404 Error */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-brand-yellow mb-4">404</h1>
          <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/admin/dashboard"
            className="px-8 py-3 bg-brand-yellow text-black font-semibold rounded hover:bg-brand-yellow-hover transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-8 py-3 bg-neutral-800 text-white font-semibold rounded hover:bg-neutral-700 transition-colors border-2 border-neutral-600"
          >
            Go to Home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">
            Need help? Contact support at{" "}
            <a
              href="mailto:support@newstatebranding.com"
              className="text-brand-yellow hover:underline"
            >
              support@newstatebranding.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

