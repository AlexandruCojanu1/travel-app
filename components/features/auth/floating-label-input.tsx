"use client"

import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: LucideIcon
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, icon: Icon, className, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = Boolean(value && String(value).length > 0)

    return (
      <div className="relative">
        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            value={value}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              "w-full px-4 py-4 rounded-xl border-2 bg-white/50 backdrop-blur-sm transition-all",
              Icon && "pl-12",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
              className
            )}
          />
          <motion.label
            initial={false}
            animate={{
              y: isFocused || hasValue ? -28 : 0,
              x: isFocused || hasValue ? (Icon ? 8 : 0) : (Icon ? 48 : 16),
              scale: isFocused || hasValue ? 0.85 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
              Icon && "left-12",
              isFocused || hasValue
                ? error
                  ? "text-red-600"
                  : "text-blue-600"
                : "text-slate-400"
            )}
          >
            {label}
          </motion.label>
        </div>
        {error && (
          <AnimatePresence>
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1 text-sm text-red-600"
            >
              {error}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    )
  }
)

FloatingLabelInput.displayName = 'FloatingLabelInput'

