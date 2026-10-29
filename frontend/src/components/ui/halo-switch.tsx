import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type Ref, type RefCallback } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const layoutSpring = {
  type: "spring" as const,
  bounce: 0.12,
  damping: 34,
  stiffness: 420,
}

const TRACK_PAD_X_PX = 3

function approximateTravelPx(size: "sm" | "default") {
  const trackW = size === "sm" ? 34 : 40
  const thumbW = size === "sm" ? 12 : 14
  return Math.max(0, trackW - thumbW - TRACK_PAD_X_PX * 2)
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") (ref as RefCallback<T>)(node)
      else if (ref) (ref as { current: T | null }).current = node
    }
  }
}

export interface HaloSwitchProps extends SwitchPrimitive.Root.Props {
  /** Brilho azul suave por baixo do switch quando ligado. */
  translucent?: boolean
  size?: "sm" | "default"
}

export function HaloSwitch({ className, translucent = true, size = "default", ...rootProps }: HaloSwitchProps) {
  const reduceMotion = useReducedMotion() ?? false
  const trackRef = useRef<HTMLSpanElement | null>(null)
  const thumbRef = useRef<HTMLSpanElement | null>(null)
  const [thumbTravel, setThumbTravel] = useState(() => approximateTravelPx(size))

  const measure = useCallback(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!(track && thumb)) return
    const styles = getComputedStyle(track)
    const padX = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight)
    setThumbTravel(Math.max(0, track.clientWidth - padX - thumb.getBoundingClientRect().width))
  }, [])

  useLayoutEffect(() => {
    const track = trackRef.current
    measure()
    if (!track || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [measure])

  return (
    <div className={cn("group/halo relative inline-flex max-w-full rounded-full", className)}>
      {translucent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-brand-500/35 opacity-0 blur-md transition-opacity duration-300 group-has-data-checked/halo:opacity-100 group-has-data-disabled/halo:opacity-0 motion-reduce:transition-none"
        />
      )}

      <div className="relative rounded-full border border-border-strong bg-card shadow-xs">
        <SwitchPrimitive.Root
          {...rootProps}
          ref={trackRef}
          data-size={size}
          data-slot="halo-switch"
          className={cn(
            "group/switch relative isolate flex shrink-0 cursor-pointer items-center justify-start rounded-full border border-transparent px-[3px] outline-none",
            "transition-[background-color,box-shadow] duration-200 ease-out",
            "after:absolute after:-inset-x-3 after:z-0 after:rounded-full after:content-['']",
            size === "sm" ? "h-[18px] w-[34px] after:-inset-y-[13px]" : "h-[22px] w-10 after:-inset-y-[11px]",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
            "data-unchecked:bg-pendente-bg data-checked:bg-brand-500",
            "data-disabled:cursor-not-allowed data-disabled:opacity-50",
          )}
        >
          <SwitchPrimitive.Thumb
            data-slot="halo-switch-thumb"
            render={(thumbProps, thumbState) => {
              const {
                className: thumbClassName,
                ref: thumbRefProp,
                style: thumbStyle,
                onDrag: _onDrag,
                onDragStart: _onDragStart,
                onDragEnd: _onDragEnd,
                onAnimationStart: _onAnimationStart,
                onAnimationEnd: _onAnimationEnd,
                ...thumbRest
              } = thumbProps
              const { transform: _transform, ...thumbStyleSafe } = (thumbStyle ?? {}) as CSSProperties
              return (
                <motion.span
                  {...thumbRest}
                  ref={mergeRefs(thumbRefProp, thumbRef)}
                  style={thumbStyleSafe}
                  initial={false}
                  animate={{ x: thumbState.checked ? thumbTravel : 0 }}
                  transition={reduceMotion ? { duration: 0 } : layoutSpring}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className={cn(
                    thumbClassName,
                    "pointer-events-none relative z-1 block shrink-0 rounded-full bg-white shadow-xs ring-1 ring-black/10 will-change-transform",
                    "group-hover/switch:ring-2 group-hover/switch:ring-ring/25",
                    size === "sm" ? "size-3" : "size-3.5",
                  )}
                />
              )
            }}
          />
        </SwitchPrimitive.Root>
      </div>
    </div>
  )
}
