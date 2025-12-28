import { AuthForm } from "@/components/features/auth/auth-form"
import { Globe, MapPin, Plane, Star } from "lucide-react"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string; mode?: string }
}) {
  const redirectTo = searchParams?.redirect || '/home'
  const defaultMode = searchParams?.mode === 'signup' ? 'signup' : 'login'
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:block space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl shadow-blue-500/25">
                <Plane className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TravelPWA
                </h1>
                <p className="text-slate-600 text-sm">Your Premium Travel Companion</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Discover Your Next
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Amazing Adventure
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Join thousands of travelers exploring the world with personalized
              itineraries, local insights, and seamless bookings.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4">
            {[
              {
                icon: MapPin,
                title: "150+ Destinations",
                description: "Explore curated travel experiences worldwide",
              },
              {
                icon: Star,
                title: "Trusted Reviews",
                description: "25,000+ authentic reviews from real travelers",
              },
              {
                icon: Globe,
                title: "Local Insights",
                description: "Connect with locals for authentic experiences",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl shadow-blue-500/25 mx-auto mb-3">
                <Plane className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to TravelPWA
              </h1>
              <p className="text-slate-600 text-sm mt-1">Sign in to continue your journey</p>
            </div>

            <AuthForm redirectTo={redirectTo} defaultMode={defaultMode} />
          </div>
        </div>
      </div>
    </div>
  )
}

