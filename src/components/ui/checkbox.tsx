'use client'

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded-lg border-2 border-slate-200 bg-white ring-offset-white transition-all duration-200 hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-indigo-600 checked:border-indigo-600",
            className
          )}
          {...props}
        />
        <Check 
          className="absolute h-3.5 w-3.5 text-white scale-0 transition-transform duration-200 peer-checked:scale-100 pointer-events-none" 
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
