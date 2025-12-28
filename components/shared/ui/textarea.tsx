import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-airbnb border border-gray-300 bg-white px-4 py-2.5 text-sm ring-offset-white placeholder:text-airbnb-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-airbnb-red focus-visible:ring-offset-2 focus-visible:border-airbnb-red disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }

