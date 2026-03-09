export function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Background decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-[#333] opacity-20" />
      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full border border-[#333] opacity-20" />
      
      <div className="relative z-10 space-y-6">
        {/* Logo and branding */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-6xl font-bold text-[#ff3333]">] [</span>
          <span className="text-6xl font-bold text-white">Peercast</span>
        </div>
        
        {/* Tagline */}
        <div className="flex items-center justify-center gap-2 text-xl text-white">
          <span className="text-2xl">↗</span>
          <span>a social-native prediction network</span>
        </div>
      </div>
    </div>
  )
}
