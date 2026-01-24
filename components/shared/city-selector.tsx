"use client"

import * as React from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import { getActiveCities } from "@/services/auth/city.service"
import { useAppStore, City } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface CitySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cityId: string) => void
}

const ITEM_HEIGHT = 80 // Height of each city item in px
const VISIBLE_ITEMS = 5 // How many items to show above/below center roughly

export function CitySelector({ isOpen, onClose, onSelect }: CitySelectorProps) {
  const { currentCity } = useAppStore()
  const [cities, setCities] = React.useState<City[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Fetch cities
  React.useEffect(() => {
    async function loadCities() {
      try {
        const data = await getActiveCities()
        const validCities = (data || []).map(c => ({
          ...c,
          country: c.country || 'Romania'
        })) as City[]

        // Sort explicitly if needed, or trust DB order
        setCities(validCities)
      } catch (error) {
        console.error("Failed to load cities", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (isOpen) {
      loadCities()
    }
  }, [isOpen])

  // Scroll to active city on open
  React.useEffect(() => {
    if (!isLoading && cities.length > 0 && containerRef.current && isOpen) {
      const index = cities.findIndex(c => c.id === currentCity?.id)
      if (index !== -1) {
        // Center the item: ScrollTop = Index * ItemHeight - (ContainerHeight / 2) + (ItemHeight / 2)
        const containerHeight = containerRef.current.clientHeight
        const scrollTo = (index * ITEM_HEIGHT) - (containerHeight / 2) + (ITEM_HEIGHT / 2)
        containerRef.current.scrollTo({ top: scrollTo, behavior: 'instant' })
      } else {
        // Default to first item or middle? Let's just stay top or center roughly.
        const containerHeight = containerRef.current.clientHeight
        containerRef.current.scrollTo({ top: -containerHeight / 2 + ITEM_HEIGHT / 2, behavior: 'instant' })
      }
    }
  }, [isLoading, cities, currentCity, isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white text-neutral-900 overflow-hidden"
        >
          {/* Title */}
          <div className="absolute top-24 left-0 right-0 text-center z-20 pointer-events-none">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Unde mergi?
            </h2>
          </div>
          {/* Close overlay (click outside) */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Central selection line indicator (optional, maybe just visual focus) */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[80px] pointer-events-none z-0 border-y border-neutral-200 bg-neutral-50/50 backdrop-blur-sm" />

          {/* Scroll Container */}
          <div
            ref={containerRef}
            className="w-full h-full max-w-md relative z-10 overflow-y-auto no-scrollbar snap-y snap-mandatory py-[50vh]"
            style={{
              scrollBehavior: 'smooth',
              // Hide scrollbar but keep functionality
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {cities.map((city, i) => (
                  <CityItem
                    key={city.id}
                    city={city}
                    containerRef={containerRef}
                    index={i}
                    total={cities.length}
                    onClick={() => {
                      onSelect(city.id)
                      onClose()
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Back Button / Instruction */}
          <button
            onClick={onClose}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-400 text-sm hover:text-neutral-900 transition-colors uppercase tracking-widest"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CityItem({ city, containerRef, index, onClick }: {
  city: City,
  containerRef: React.RefObject<HTMLDivElement>,
  index: number,
  total: number,
  onClick: () => void
}) {
  // We use ref to track this item's position relative to the center of the container
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: containerRef })

  // We want to transform based on distance from viewport center
  // However, useScroll gives standard scroll progress.
  // For a simpler "3D wheel" effect in a standard scroll container, 
  // we can calculate opacity/scale based on the element's position using a simpler approach or Motion values.

  // Since `useScroll` with container works, let's try to map the specific scroll offset to this item's visual state.
  // But getting exact pixel values for each item relative to viewport center reliably via pure framer hooks can be tricky with dynamic resizing.
  // An alternative: use InteractionObserver mechanism or just stick to a simpler "Active" class if we rely on Snap.

  // BUT the requirement is "Wheel" visual. Let's try to use `useTransform` with inputs roughly estimated or valid.
  // Actually, a simpler robust way for the "Wheel" look:
  // 1. Snap to center.
  // 2. IntersectionObserver to detect which is centered (100% visible in middle slice).
  // 3. Apply style.

  // Let's stick to Framer Motion values for smooth animation if possible.
  // We can map `scrollY` to item values.
  // Center position of the list = scrollY + containerHeight / 2.
  // Item Center = index * ITEM_HEIGHT + ITEM_HEIGHT / 2.
  // Distance = |CenterPosition - ItemCenter|.

  const [elementTop, setElementTop] = React.useState(0)

  React.useLayoutEffect(() => {
    // approximation: assumes fixed height items and consistent layout
    setElementTop(index * ITEM_HEIGHT)
  }, [index])

  // We need container height to know the center offset. Assuming ~window height or measuring.
  // Let's assume height is properly passed or we measure. We can pass a motionValue for scrollTop from parent?
  // Doing it individually is fine if we accept standard viewport scroll tracking.
  // `useScroll` tracks the container's scroll position.

  // Let's simplify: Use `whileInView` or just standard CSS snap with scroll-driven animations? 
  // No, Motion is better.

  const y = useTransform(scrollY, (value) => {
    // container center is roughly `value + windowHeight/2`.
    // Ideally we grab actual container height. Let's guess 800px or use a prop?
    // Better: `useScroll` returns 0..1 if using progress, or pixels if using scrollY.
    // It's pixels.

    // Let's assume the container is `100vh`. Center is `50vh`.
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const centerOffset = viewportHeight / 2
    const scrollCenter = value + centerOffset
    const itemCenter = (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2)

    return scrollCenter - itemCenter // distance from center
  })

  const distance = useTransform(y, (d) => Math.abs(d))

  // Maps distance (px) to visual properties
  const scale = useTransform(distance, [0, 200], [1.2, 0.7])
  const opacity = useTransform(distance, [0, 200], [1, 0.3])
  const rotateX = useTransform(y, [-200, 200], [45, -45]) // Tilt effect

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      style={{
        height: ITEM_HEIGHT,
        scale,
        opacity,
        rotateX,
        perspective: 800
      }}
      className="w-full flex items-center justify-center snap-center cursor-pointer origin-center"
    >
      <div className="text-center">
        <motion.span
          className="block text-4xl md:text-5xl font-serif tracking-tight"
          style={{
            color: useTransform(distance, [0, 100], ["#171717", "#a3a3a3"]) // Neutral 900 -> Neutral 400
          }}
        >
          {city.name}
        </motion.span>
        {/* Optional Country subtitle, hidden if far away to clean up? */}
        <motion.span
          style={{ opacity: useTransform(distance, [0, 80], [1, 0]) }}
          className="block text-xs uppercase tracking-[0.2em] text-blue-600 mt-1"
        >
          {city.country}
        </motion.span>
      </div>
    </motion.div>
  )
}
