export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Light Sky Blue Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
       radial-gradient(circle at center, #C2DCF0, transparent)
     `,
        }}
      />
      <div className="min-h-screen flex items-center justify-center  z-100 relative">
        {children}
      </div>
    </div>
  )
}


