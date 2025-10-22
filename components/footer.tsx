import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center">
          {/* Centered Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/NSB FOOTER.png" 
              alt="NEWSTATE BRANDING CO." 
              className="h-12 sm:h-16 w-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
   