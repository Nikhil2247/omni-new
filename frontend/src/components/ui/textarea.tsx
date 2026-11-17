import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-blue-wash placeholder:text-ink-soft/70 bg-card hover:border-blue/60 focus-visible:border-blue focus-visible:bg-blue-wash/10 aria-invalid:border-destructive aria-invalid:bg-destructive/5 flex field-sizing-content min-h-14 w-full rounded-[10px_18px_12px_16px] border-2 px-2.5 py-1.5 text-base transition-[color,background-color,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
