import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { MapPin, Calendar, Bookmark, ArrowRight, Building2, Users } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

export default async function LandingPage() {
  // Check server-side session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to home
  if (user) {
    redirect("/home")
  }

  // If guest, render landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20 lg:py-32">
          <div className="text-center space-y-6 md:space-y-8">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 leading-tight px-2">
              Plan your perfect trip to
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                România
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto px-2">
              Discover amazing destinations, plan perfect trips, and book
              unforgettable experiences with the world's most intuitive travel
              platform.
            </p>

            {/* Dual CTA Section - Users vs Businesses */}
            <div className="pt-8 space-y-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700 mb-6">
                  I am a...
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
                {/* User CTA Card */}
                <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Traveler
                    </h3>
                    <p className="text-slate-600">
                      Explore destinations, plan trips, and book amazing experiences
                    </p>
                    <div className="w-full space-y-3">
                      <Link href="/auth/login">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white group-hover:shadow-lg transition-all"
                        >
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Business CTA Card */}
                <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Business Owner
                    </h3>
                    <p className="text-slate-600">
                      Manage your business, rooms, and bookings on our platform
                    </p>
                    <div className="w-full space-y-3">
                      <Link href="/auth/login?redirect=/business-portal/onboarding">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 group-hover:shadow-lg transition-all"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/auth/login?redirect=/business-portal/onboarding&mode=signup">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white group-hover:shadow-lg transition-all"
                        >
                          Create Business Account
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-slate-600">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 font-semibold hover:text-blue-700 underline"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need for the Perfect Trip
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From planning to booking, we've got you covered with powerful tools
            and personalized recommendations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Explore",
              description:
                "Discover amazing destinations, local businesses, and hidden gems with our interactive map and curated recommendations.",
              iconBg: "bg-gradient-to-br from-blue-100 to-blue-200",
              iconColor: "text-blue-600",
            },
            {
              icon: Calendar,
              title: "Plan",
              description:
                "Build your perfect itinerary with drag-and-drop planning. Auto-save your trips and access them anywhere.",
              iconBg: "bg-gradient-to-br from-purple-100 to-purple-200",
              iconColor: "text-purple-600",
            },
            {
              icon: Bookmark,
              title: "Book",
              description:
                "Seamlessly book hotels, activities, and experiences. Get digital tickets and manage all your bookings in one place.",
              iconBg: "bg-gradient-to-br from-pink-100 to-pink-200",
              iconColor: "text-pink-600",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/50 text-center"
            >
              <div
                className={`h-16 w-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mx-auto mb-6`}
              >
                <feature.icon
                  className={`h-8 w-8 ${feature.iconColor}`}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200/50">
        <div className="text-center text-slate-600">
          <p>&copy; {new Date().getFullYear()} Travel App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
