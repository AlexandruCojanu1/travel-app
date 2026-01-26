import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form"
import { Globe, MapPin, Plane, Star } from "lucide-react"
import { Scene3D } from "@/components/ui/scene-3d"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const modelPath = '/models/travel-insurance.glb'

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
        <div className="flex items-center justify-center lg:justify-end order-1 lg:order-1">
          <div className="w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-md rounded-airbnb-lg shadow-airbnb-lg border border-gray-200">
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
              <h1 className="text-2xl font-bold text-primary">Resetare Parolă</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Recuperează accesul la contul tău
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Resetare Parolă</h1>
              <p className="text-muted-foreground">
                Introdu adresa ta de email pentru a primi un link de resetare
              </p>
            </div>

            <ForgotPasswordForm />
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center order-2 lg:order-2 h-full min-h-[500px]">
          <div className="w-full h-[500px] lg:h-[600px] relative">
            <Scene3D modelPath={modelPath} />
          </div>
        </div>
      </div>
    </div>
  )
}
