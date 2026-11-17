import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-ink-soft/70 selection:bg-blue selection:text-on-blue border-blue-wash bg-card h-8 w-full min-w-0 rounded-[10px_18px_12px_16px] border-2 px-2.5 py-1 text-base transition-[color,background-color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-blue/60 focus-visible:border-blue focus-visible:bg-blue-wash/10",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5",
        className
      )}
      {...props}
    />
  )
}

export { Input }
