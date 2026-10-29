import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const layoutSpring = {
  type: "spring" as const,
  bounce: 0.12,
  damping: 34,
  stiffness: 420,
}

export interface HaloSegmentedItem<T extends string = string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

export interface HaloSegmentedProps<T extends string = string> {
  items: HaloSegmentedItem<T>[]
  value: T
  onValueChange: (next: T) => void
  className?: string
  disabled?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
}

export function HaloSegmented<T extends string>({
  items,
  value,
  onValueChange,
  className,
  disabled = false,
  ...aria
}: HaloSegmentedProps<T>) {
  const reduceMotion = useReducedMotion() ?? false
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const [thumb, setThumb] = useState({ x: 0, width: 0 })

  const measureThumb = useCallback(() => {
    const track = trackRef.current
    const active = itemRefs.current.get(value)
    if (!(track && active)) return setThumb({ x: 0, width: 0 })
    const tr = track.getBoundingClientRect()
    const br = active.getBoundingClientRect()
    setThumb({ x: br.left - tr.left, width: br.width })
  }, [value])

  useLayoutEffect(() => {
    const track = trackRef.current
    measureThumb()
    if (!track || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measureThumb)
    ro.observe(track)
    return () => ro.disconnect()
  }, [measureThumb])

  return (
    <div className={cn("relative inline-flex max-w-full rounded-full border border-border-strong bg-card shadow-xs", className)}>
      <div className="relative w-full p-1" ref={trackRef}>
        <motion.div
          animate={{ x: thumb.x, width: thumb.width }}
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-0 rounded-full border border-brand-200 bg-brand-50 shadow-xs"
          initial={false}
          transition={reduceMotion ? { duration: 0 } : layoutSpring}
        />

        <ToggleGroup
          {...aria}
          className="relative z-1 flex min-w-0"
          disabled={disabled}
          onValueChange={(next) => {
            const first = next[0] as T | undefined
            if (first) onValueChange(first)
          }}
          value={[value]}
        >
          {items.map((item) => (
            <Toggle
              className={cn(
                "relative flex min-h-9 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 whitespace-nowrap sm:px-4",
                "text-sm font-semibold tracking-tight text-ink-600 antialiased",
                "outline-none transition-colors duration-200 ease-out hover:text-foreground",
                "focus-visible:ring-3 focus-visible:ring-ring/40",
                "disabled:pointer-events-none disabled:opacity-50",
                "aria-pressed:text-brand-700 aria-pressed:hover:text-brand-700",
              )}
              disabled={item.disabled}
              key={item.value}
              ref={(el) => {
                if (el) itemRefs.current.set(item.value, el)
                else itemRefs.current.delete(item.value)
              }}
              value={item.value}
            >
              {item.label}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
