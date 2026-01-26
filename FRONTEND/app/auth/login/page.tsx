import { AuthForm } from "@/components/features/auth/auth-form"
import { Globe, MapPin, Plane, Star } from "lucide-react"
import { Scene3D } from "@/components/ui/scene-3d"
import Image from "next/image"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string; mode?: string; role?: string }
}) {
  const redirectTo = searchParams?.redirect || '/home'
  const defaultMode = searchParams?.mode === 'signup' ? 'signup' : 'login'
  const role = searchParams?.role // 'tourist' or 'local'

  // Model selection (fallback to insurance model since 2.blend cannot be rendered directly)
  const modelPath = '/models/travel-insurance.glb'

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Digital Map Background - Removed as per request to keep it white */}
      {/* <div className="absolute inset-0 z-0">
        <Image
          src="/images/digital-map-bg.png"
          alt="Digital Map Background"
          fill
          className="object-cover opacity-30"
          quality={100}
          priority
        />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
      </div> */}

      {/* Abstract Shapes for subtle depth on white background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
        {/* Left Side (Desktop) - Auth Form */}
        <div className="flex items-center justify-center lg:justify-end order-1 lg:order-1">
          <div className="w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-md rounded-airbnb-lg shadow-airbnb-lg border border-gray-200">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-airbnb-lg bg-white shadow-airbnb-md mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/mova-logo.png"
                  alt="MOVA Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-primary">
                Bun venit la MOVE
              </h1>
              <p className="text-muted-foreground text-sm mt-2">Autentifică-te pentru a continua</p>
            </div>

            <AuthForm redirectTo={redirectTo} defaultMode={defaultMode} role={role} />
          </div>
        </div>

        {/* Right Side (Desktop) - 3D Animation */}
        <div className="hidden lg:flex flex-col items-center justify-center order-2 lg:order-2 h-full min-h-[500px]">
          <Scene3D modelPath={modelPath} />
        </div>
      </div>
    </div>
  )
}

