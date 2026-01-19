import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative flex items-center justify-center w-5 h-5">
            <input
                type="checkbox"
                className={cn(
                    "peer h-5 w-5 shrink-0 rounded-md border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-blue-600 checked:border-blue-600 appearance-none cursor-pointer transition-all",
                    className
                )}
                ref={ref}
                {...props}
            />
            <Check className="absolute h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
    )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
