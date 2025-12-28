import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-airbnb bg-airbnb-light-gray", className)}
      {...props}
    />
  )
}

export { Skeleton }


