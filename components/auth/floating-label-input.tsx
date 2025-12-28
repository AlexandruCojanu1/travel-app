"use client"

import { useState, forwardRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const FloatingLabelInput = forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(({ label, error, type = "text", className, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isFloating = isFocused || hasValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0)
    props.onChange?.(e)
  }

  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "relative w-full rounded-xl border-2 transition-colors duration-200",
          error
            ? "border-red-500 bg-red-50/50"
            : isFocused
            ? "border-blue-500 bg-white"
            : "border-slate-200 bg-white hover:border-slate-300"
        )}
      >
        <motion.label
          htmlFor={props.id || props.name}
          className={cn(
            "absolute left-4 pointer-events-none transition-colors duration-200",
            error
              ? "text-red-600"
              : isFocused
              ? "text-blue-600"
              : "text-slate-500"
          )}
          animate={{
            top: isFloating ? "8px" : "50%",
            fontSize: isFloating ? "12px" : "16px",
            translateY: isFloating ? "0%" : "-50%",
            fontWeight: isFloating ? 600 : 400,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          {label}
        </motion.label>

        <input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full h-14 pt-6 pb-2 px-4 bg-transparent outline-none text-slate-900 text-base",
            type === "password" ? "pr-12" : "",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          {...props}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
            }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <motion.p
              className="text-red-600 text-sm font-medium mt-1.5 px-1"
              initial={{ x: -10 }}
              animate={{ x: [0, -10, 10, -10, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              {error}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

FloatingLabelInput.displayName = "FloatingLabelInput"
