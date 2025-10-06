import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between space-y-6 sm:space-y-0">
          {/* Left Section - Logo and Company Name */}
          <div className="flex items-center sm:items-start">
            {/* NSB Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/NSB FOOTER.png" 
                alt="NEWSTATE BRANDING CO." 
                className="h-12 sm:h-16 w-auto"
              />
            </div>
          </div>

          {/* Vertical Divider - Hidden on mobile */}
          <div className="hidden sm:block w-px bg-white h-16 mx-4 sm:mx-8"></div>

          {/* Right Section - Company Info */}
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <div className="text-white uppercase font-normal tracking-wide text-sm sm:text-base">
              NEWSTATE BRANDING CO.
            </div>
            <div className="text-white uppercase font-normal tracking-wide text-sm sm:text-base">
              USA | GLOBAL MANUFACTURING
            </div>
            <div className="text-white uppercase font-normal tracking-wide text-sm sm:text-base">
              WWW.NEWSTATEBRANDING.COM
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
