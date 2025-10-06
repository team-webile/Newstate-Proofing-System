'use client'

export default function AdminFooter() {
  return (
    <footer className="bg-black border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-3">Proofing System</h3>
            <p className="text-gray-400 text-sm mb-4">
              Professional design review and approval system for creative agencies and teams.
            </p>
            <div className="flex space-x-4">
              <div className="text-xs text-gray-500">
                Version 1.0.0
              </div>
              <div className="text-xs text-gray-500">
                © 2024 All rights reserved
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/admin/projects" className="text-gray-400 hover:text-white text-sm transition-colors">
                  All Projects
                </a>
              </li>
              <li>
                <a href="/admin/new-project" className="text-gray-400 hover:text-white text-sm transition-colors">
                  New Project
                </a>
              </li>
              <li>
                <a href="/admin/archives" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Archives
                </a>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">System</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">
                <span className="text-green-400">●</span> System Online
              </li>
              <li className="text-gray-400 text-sm">
                <span className="text-blue-400">●</span> Database Connected
              </li>
              <li className="text-gray-400 text-sm">
                <span className="text-purple-400">●</span> Admin Access
              </li>
              <li className="text-gray-400 text-sm">
                Last updated: {new Date().toLocaleDateString()}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-xs text-gray-500">
            Built with Next.js, Prisma, and Tailwind CSS
          </div>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span className="text-xs text-gray-500">Privacy Policy</span>
            <span className="text-xs text-gray-500">Terms of Service</span>
            <span className="text-xs text-gray-500">Support</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
