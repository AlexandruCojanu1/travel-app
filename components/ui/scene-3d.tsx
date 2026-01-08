"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Stage, OrbitControls } from "@react-three/drei"
import { Suspense, useRef } from "react"
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

export function Scene3D({ modelPath }: { modelPath: string }) {
  return (
    <div className="w-full h-[500px] lg:h-[600px] relative">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-mova-blue/50">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        }
      >
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 35] }}>
          <Stage environment="city" intensity={0.6} adjustCamera={false}>
            <Model path={modelPath} />
          </Stage>
          <OrbitControls
            enableZoom={false}
            enableRotate={false}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
