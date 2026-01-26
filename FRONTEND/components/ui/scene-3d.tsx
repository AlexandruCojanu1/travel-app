"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Stage, OrbitControls } from "@react-three/drei"
import { Suspense, useRef, useState, useEffect, Component, ReactNode } from "react"
import { Loader2 } from "lucide-react"

function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path)
  const ref = useRef<any>()

  useFrame((state) => {
    if (ref.current) {
      // Subtle left-right rotation only
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return <primitive ref={ref} object={scene} />
}

// Error boundary for 3D scene
class Scene3DErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Log error but don't crash the app
    console.warn("Scene3D error (likely offline):", error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-900/50 rounded-xl">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10h.01M15 10h.01M9.5 15.5a3.5 3.5 0 015 0" />
              </svg>
            </div>
            <p className="text-sm">3D scene unavailable</p>
            <p className="text-xs text-slate-500 mt-1">Check your internet connection</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple fallback stage without environment (works offline)
function SimpleStage({ children }: { children: ReactNode }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      {children}
    </>
  )
}

export function Scene3D({ modelPath }: { modelPath: string }) {
  const [isOnline, setIsOnline] = useState(true)
  const [useSimpleStage, setUseSimpleStage] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setUseSimpleStage(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // If offline from the start, use simple stage
    if (!navigator.onLine) {
      setUseSimpleStage(true)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="w-full h-[500px] lg:h-[600px] relative">
      <Scene3DErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-mova-blue/50">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          }
        >
          <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 35] }}>
            {useSimpleStage ? (
              <SimpleStage>
                <Model path={modelPath} />
              </SimpleStage>
            ) : (
              <Stage 
                environment={isOnline ? "city" : null} 
                intensity={0.6} 
                adjustCamera={false}
              >
                <Model path={modelPath} />
              </Stage>
            )}
            <OrbitControls
              enableZoom={false}
              enableRotate={false}
            />
          </Canvas>
        </Suspense>
      </Scene3DErrorBoundary>
    </div>
  )
}
