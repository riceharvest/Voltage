import * as React from "react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, onCheckedChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
    props.onChange?.(e)
  }

  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-white/10 bg-zinc-900/50 text-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onChange={handleChange}
      aria-checked={props.checked}
      {...props}
    />
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }