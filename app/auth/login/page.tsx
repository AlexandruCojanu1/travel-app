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
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-airbnb-red/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-airbnb-red/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:block space-y-8">
          {/* Logo & Title */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-airbnb-lg bg-airbnb-red shadow-airbnb-md">
                <Plane className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-airbnb-red">
                  TravelPWA
                </h1>
                <p className="text-airbnb-gray text-sm">Your Premium Travel Companion</p>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-airbnb-dark leading-tight">
              Discover Your Next
              <br />
              <span className="text-airbnb-red">
                Amazing Adventure
              </span>
            </h2>
            <p className="text-airbnb-gray text-lg leading-relaxed">
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
                className="flex items-start gap-4 p-5 rounded-airbnb-lg airbnb-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-airbnb bg-airbnb-light-gray">
                  <feature.icon className="h-5 w-5 text-airbnb-red" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-airbnb-dark mb-1 text-base">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-airbnb-gray">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md p-8 md:p-10 bg-white rounded-airbnb-lg shadow-airbnb-lg border border-gray-200">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-airbnb-lg bg-airbnb-red shadow-airbnb-md mx-auto mb-4">
                <Plane className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-airbnb-red">
                Welcome to TravelPWA
              </h1>
              <p className="text-airbnb-gray text-sm mt-2">Sign in to continue your journey</p>
            </div>

            <AuthForm redirectTo={redirectTo} defaultMode={defaultMode} />
          </div>
        </div>
      </div>
    </div>
  )
}

