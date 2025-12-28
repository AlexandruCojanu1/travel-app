import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { MapPin, Calendar, Bookmark, ArrowRight, Building2, Users } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  // Check server-side session with error handling
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // If user is logged in, redirect to home
    if (user && !error) {
      redirect("/home")
    }
  } catch (error) {
    // If there's an error checking auth, continue to show landing page
    // This prevents the entire page from crashing
    console.warn('Landing page: Error checking auth status:', error)
  }

  // If guest, render landing page
  return (
    <div className="min-h-screen bg-airbnb-light-gray">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-airbnb-red/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-airbnb-red/5 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20 lg:py-32">
          <div className="text-center space-y-6 md:space-y-8">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-airbnb-dark leading-tight px-2">
              Planifică-ți călătoria perfectă în
              <br />
              <span className="text-airbnb-red">
                România
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-airbnb-gray max-w-3xl mx-auto px-2">
              Descoperă destinații uimitoare, planifică călătorii perfecte și rezervă
              experiențe de neuitat cu cea mai intuitivă platformă de călătorii.
            </p>

            {/* Dual CTA Section - Users vs Businesses */}
            <div className="pt-8 space-y-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-airbnb-dark mb-6">
                  Sunt...
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
                {/* User CTA Card */}
                <div className="group relative airbnb-card p-8 shadow-airbnb hover:shadow-airbnb-hover transition-all border-2 border-transparent hover:border-airbnb-red/30">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-airbnb-lg bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-airbnb-red" />
                    </div>
                    <h3 className="text-2xl font-bold text-airbnb-dark">
                      Călător
                    </h3>
                    <p className="text-airbnb-gray">
                      Explorează destinații, planifică călătorii și rezervă experiențe uimitoare
                    </p>
                    <div className="w-full space-y-3">
                      <Link href="/auth/login">
                        <Button
                          size="lg"
                          className="w-full airbnb-button group-hover:shadow-airbnb-hover transition-all"
                        >
                          Începe acum
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-2 border-airbnb-red text-airbnb-red hover:bg-red-50"
                        >
                          Creează cont
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Business CTA Card */}
                <div className="group relative airbnb-card p-8 shadow-airbnb hover:shadow-airbnb-hover transition-all border-2 border-transparent hover:border-airbnb-red/30">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-airbnb-lg bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-airbnb-red" />
                    </div>
                    <h3 className="text-2xl font-bold text-airbnb-dark">
                      Proprietar de afacere
                    </h3>
                    <p className="text-airbnb-gray">
                      Gestionează afacerea, camerele și rezervările pe platforma noastră
                    </p>
                    <div className="w-full space-y-3">
                      <Link href="/auth/login?redirect=/business-portal/onboarding">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-2 border-airbnb-red text-airbnb-red hover:bg-red-50 group-hover:shadow-airbnb-md transition-all"
                        >
                          Autentificare
                        </Button>
                      </Link>
                      <Link href="/auth/login?redirect=/business-portal/onboarding&mode=signup">
                        <Button
                          size="lg"
                          className="w-full airbnb-button group-hover:shadow-airbnb-hover transition-all"
                        >
                          Creează cont afacere
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-airbnb-gray">
                  Ai deja cont?{" "}
                  <Link
                    href="/auth/login"
                    className="text-airbnb-red font-semibold hover:text-[#FF484D] underline"
                  >
                    Autentifică-te
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
          <h2 className="text-3xl md:text-4xl font-bold text-airbnb-dark mb-4">
            Tot ce ai nevoie pentru călătoria perfectă
          </h2>
          <p className="text-lg text-airbnb-gray max-w-2xl mx-auto">
            De la planificare la rezervare, te ajutăm cu instrumente puternice
            și recomandări personalizate.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Explorează",
              description:
                "Descoperă destinații uimitoare, afaceri locale și locuri ascunse cu harta noastră interactivă și recomandările noastre.",
            },
            {
              icon: Calendar,
              title: "Planifică",
              description:
                "Construiește-ți itinerariul perfect cu planificare drag-and-drop. Salvează automat călătoriile și accesează-le oriunde.",
            },
            {
              icon: Bookmark,
              title: "Rezervă",
              description:
                "Rezervă fără probleme hoteluri, activități și experiențe. Primește bilete digitale și gestionează toate rezervările într-un singur loc.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="airbnb-card p-8 shadow-airbnb hover:shadow-airbnb-hover transition-shadow text-center"
            >
              <div className="h-16 w-16 rounded-airbnb-lg bg-red-50 flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-8 w-8 text-airbnb-red" />
              </div>
              <h3 className="text-2xl font-bold text-airbnb-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-airbnb-gray">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-200">
        <div className="text-center text-airbnb-gray">
          <p>&copy; {new Date().getFullYear()} Travel App. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  )
}
