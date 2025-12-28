import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-airbnb bg-mova-light-gray", className)}
      {...props}
    />
  )
}

export { Skeleton }


