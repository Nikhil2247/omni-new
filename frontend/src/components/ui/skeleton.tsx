import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("sk-skeleton bg-blue-wash/35 relative overflow-hidden rounded-[8px_14px_10px_12px]", className)}
      {...props}
    />
  )
}

export { Skeleton }
