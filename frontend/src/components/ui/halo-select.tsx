"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import {
  Select as SelectPrimitive,
  type SelectRoot,
} from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectContent as UiSelectContent,
} from "@/components/ui/base-select"

const LABEL_STAGGER_SEC = 0.018
const LABEL_CHAR_DURATION_SEC = 0.16
const TRAILING_ACTION_DURATION_SEC = 0.2
const LIST_STAGGER_STEP_SEC = 0.055
const LIST_STAGGER_CAP = 9
const SELECTION_FLASH_MS = 560

export interface PolishedSelectItem {
  value: string
  label: string
  disabled?: boolean
}

type SelectValueChangeDetails = Parameters<
  NonNullable<SelectRoot.Props<PolishedSelectItem>["onValueChange"]>
>[1]

interface HaloSelectContextValue {
  isLoading: boolean
  showSelectionFlash: boolean
  reduceMotion: boolean
  open: boolean
  setOpen: (open: boolean) => void
  isFocused: boolean
  setIsFocused: (focused: boolean) => void
  listBurst: number
  labelStagger: { key: number; text: string }
  showStaggerOverlay: boolean
  placeholder: string
  trailingMode: "spinner" | "check" | "chevron"
  fieldId: string
}

const HaloSelectContext = createContext<HaloSelectContextValue | null>(null)

function useHaloSelect() {
  const ctx = useContext(HaloSelectContext)
  if (!ctx) {
    throw new Error(
      "Animated select components must be used within <HaloSelect>."
    )
  }
  return ctx
}

function SelectStaggeredGlyphLine({
  text,
  animateKey,
  reduceMotion,
  className,
}: {
  text: string
  animateKey: number
  reduceMotion: boolean
  className?: string
}) {
  const chars = useMemo(() => {
    const counts = new Map<string, number>()
    return Array.from(text, (char) => {
      const count = counts.get(char) ?? 0
      counts.set(char, count + 1)
      return { char, key: `${char}-${count}` }
    })
  }, [text])

  return (
    <motion.span
      animate="visible"
      className={className}
      initial="hidden"
      key={animateKey}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : LABEL_STAGGER_SEC,
          },
        },
      }}
    >
      {chars.map((glyph) => (
        <motion.span
          className="inline-block whitespace-pre"
          key={glyph.key}
          transition={{
            duration: reduceMotion ? 0 : LABEL_CHAR_DURATION_SEC,
            ease: "easeOut",
          }}
          variants={{
            hidden: { opacity: reduceMotion ? 1 : 0 },
            visible: { opacity: 1 },
          }}
        >
          {glyph.char}
        </motion.span>
      ))}
    </motion.span>
  )
}

function TrailingSpinner({
  className,
  reduceMotion,
}: {
  className?: string
  reduceMotion: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex origin-center text-muted-foreground",
        !reduceMotion && "animate-spin",
        className
      )}
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-[0.22]"
          cx="12"
          cy="12"
          fill="none"
          r="9"
          stroke="currentColor"
          strokeWidth="2.25"
        />
        <circle
          cx="12"
          cy="12"
          fill="none"
          r="9"
          stroke="currentColor"
          strokeDasharray="14 42"
          strokeLinecap="round"
          strokeWidth="2.25"
        />
      </svg>
    </span>
  )
}

const trailingMotionTransition = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : TRAILING_ACTION_DURATION_SEC,
  ease: "easeOut" as const,
})

const trailingCrossfade = (reduceMotion: boolean) => ({
  exit: {
    opacity: reduceMotion ? 1 : 0,
    scale: reduceMotion ? 1 : 0.25,
    filter: reduceMotion ? "none" : "blur(4px)",
  },
  initial: {
    opacity: reduceMotion ? 1 : 0,
    scale: reduceMotion ? 1 : 0.25,
    filter: reduceMotion ? "none" : "blur(4px)",
  },
})

const trailingEnter = (reduceMotion: boolean) => ({
  opacity: 1,
  scale: 1,
  filter: reduceMotion ? "none" : "blur(0px)",
})

const trailingThumbSurface = cn(
  "rounded-full border border-brand-200 bg-brand-50 shadow-xs",
  "transition-colors duration-200 ease-out fine-hover:group-hover/select:border-brand-500/40"
)

function resolveTrailingMode(
  isLoading: boolean,
  selectionFlash: boolean,
  showSelectionFlash: boolean,
  reduceMotion: boolean
): "spinner" | "check" | "chevron" {
  if (isLoading) {
    return "spinner"
  }
  if (selectionFlash && showSelectionFlash && !reduceMotion) {
    return "check"
  }
  return "chevron"
}

export type HaloSelectProps = Omit<
  ComponentProps<typeof Select>,
  "children" | "onValueChange"
> & {
  children: ReactNode
  isLoading?: boolean
  showSelectionFlash?: boolean
  placeholder?: string
  className?: string
  onValueChange?: (
    value: unknown,
    eventDetails: SelectValueChangeDetails
  ) => void
}

function staggerDurationMs(text: string, reduceMotion: boolean): number {
  if (reduceMotion || text.length === 0) {
    return 0
  }
  const n = text.length
  const runSec = (n - 1) * LABEL_STAGGER_SEC + LABEL_CHAR_DURATION_SEC
  return runSec * 1000 + 80
}

export function HaloSelect({
  children,
  isLoading = false,
  showSelectionFlash = true,
  placeholder = "Selecione",
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  onOpenChange: onOpenChangeUser,
  ...selectProps
}: HaloSelectProps) {
  const reduceMotion = useReducedMotion() ?? false
  const generatedId = useId()
  const fieldId = selectProps.id ?? generatedId
  const [open, setOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [listBurst, setListBurst] = useState(0)
  const [labelStagger, setLabelStagger] = useState({ key: 0, text: "" })
  const [isStaggering, setIsStaggering] = useState(false)
  const [selectionFlash, setSelectionFlash] = useState(false)
  const flashTimerRef = useRef<number | null>(null)

  const isControlled = valueProp !== undefined
  useEffect(() => {
    if (open) {
      setListBurst((b) => b + 1)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const text = labelStagger.text
    if (reduceMotion || !text || open) {
      setIsStaggering(false)
      return
    }
    setIsStaggering(true)
    const ms = staggerDurationMs(text, reduceMotion)
    const t = window.setTimeout(() => setIsStaggering(false), ms)
    return () => window.clearTimeout(t)
  }, [labelStagger, open, reduceMotion])

  const handleValueChange = useCallback(
    (next: unknown, eventDetails: SelectValueChangeDetails) => {
      onValueChange?.(next, eventDetails)
      if (
        next &&
        typeof next === "object" &&
        "label" in next &&
        typeof (next as PolishedSelectItem).label === "string"
      ) {
        setLabelStagger((s) => ({
          key: s.key + 1,
          text: (next as PolishedSelectItem).label,
        }))
        if (showSelectionFlash && !reduceMotion) {
          if (flashTimerRef.current) {
            window.clearTimeout(flashTimerRef.current)
          }
          setSelectionFlash(true)
          flashTimerRef.current = window.setTimeout(() => {
            setSelectionFlash(false)
            flashTimerRef.current = null
          }, SELECTION_FLASH_MS)
        }
      } else {
        setLabelStagger({ key: 0, text: "" })
      }
    },
    [onValueChange, reduceMotion, showSelectionFlash]
  )

  const showStaggerOverlay =
    Boolean(labelStagger.text) && isStaggering && !open && !reduceMotion

  const trailingMode = resolveTrailingMode(
    isLoading,
    selectionFlash,
    showSelectionFlash,
    reduceMotion
  )

  const contextValue = useMemo(
    (): HaloSelectContextValue => ({
      isLoading,
      showSelectionFlash,
      reduceMotion,
      open,
      setOpen,
      isFocused,
      setIsFocused,
      listBurst,
      labelStagger,
      showStaggerOverlay,
      placeholder,
      trailingMode,
      fieldId,
    }),
    [
      isLoading,
      showSelectionFlash,
      reduceMotion,
      open,
      isFocused,
      listBurst,
      labelStagger,
      showStaggerOverlay,
      placeholder,
      trailingMode,
      fieldId,
    ]
  )

  return (
    <HaloSelectContext.Provider value={contextValue}>
      <div
        className={cn(
          "relative inline-block w-max min-w-0 max-w-full",
          className
        )}
      >
        <Select
          {...selectProps}
          defaultValue={
            isControlled
              ? undefined
              : (defaultValue as PolishedSelectItem | undefined)
          }
          disabled={selectProps.disabled || isLoading}
          onOpenChange={(nextOpen, eventDetails) => {
            setOpen(nextOpen)
            onOpenChangeUser?.(nextOpen, eventDetails)
          }}
          onValueChange={handleValueChange}
          open={open}
          value={isControlled ? (valueProp ?? null) : undefined}
        >
          {children}
        </Select>
      </div>
    </HaloSelectContext.Provider>
  )
}

export type HaloSelectTriggerProps = SelectPrimitive.Trigger.Props

export function HaloSelectTrigger({
  className,
  children,
  onBlur,
  onFocus,
  ...props
}: HaloSelectTriggerProps) {
  const { isLoading, open, isFocused, setIsFocused, fieldId } = useHaloSelect()

  const ringActive = isFocused || open

  return (
      <SelectPrimitive.Trigger
        aria-busy={isLoading || props["aria-busy"]}
        className={cn(
          "group/select relative inline-flex min-w-40 max-w-[min(100%,20rem)] items-center gap-2 rounded-full py-1 pr-1 pl-4 text-left",
          "border border-border-strong bg-card shadow-xs",
          "whitespace-nowrap text-sm font-semibold text-foreground antialiased",
          "outline-none transition-colors duration-200 ease-out",
          "fine-hover:hover:border-brand-200",
          "focus-visible:ring-3 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-placeholder:text-ink-600",
          ringActive && "border-brand-200",
          className
        )}
        data-slot="halo-select-trigger"
        disabled={props.disabled ?? isLoading}
        id={props.id ?? fieldId}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        {...props}
        type="button"
      >
        {children}
      </SelectPrimitive.Trigger>
  )
}

export function HaloSelectValue({
  className,
  placeholder: placeholderProp,
  ...props
}: SelectPrimitive.Value.Props) {
  const {
    placeholder: contextPlaceholder,
    showStaggerOverlay,
    labelStagger,
    reduceMotion,
  } = useHaloSelect()

  return (
    <div className="relative min-w-0 flex-1 text-sm/relaxed">
      <SelectPrimitive.Value
        className={cn(
          "block min-w-0 flex-1 truncate bg-transparent text-foreground text-sm/relaxed",
          showStaggerOverlay && "text-transparent",
          className
        )}
        data-slot="halo-select-value"
        placeholder={placeholderProp ?? contextPlaceholder}
        {...props}
      />
      {showStaggerOverlay && (
        <SelectStaggeredGlyphLine
          animateKey={labelStagger.key}
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-foreground"
          reduceMotion={reduceMotion}
          text={labelStagger.text}
        />
      )}
    </div>
  )
}

export function HaloSelectTrailingIndicator({
  className,
}: {
  className?: string
}) {
  const { trailingMode, reduceMotion, open } = useHaloSelect()
  const cross = trailingCrossfade(reduceMotion)
  const transition = trailingMotionTransition(reduceMotion)

  return (
    <div className={cn("relative size-9 shrink-0", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          trailingThumbSurface
        )}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="sync">
          {trailingMode === "spinner" && (
            <motion.span
              animate={trailingEnter(reduceMotion)}
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-muted-foreground"
              exit={cross.exit}
              initial={cross.initial}
              key="trail-spin"
              transition={transition}
            >
              <TrailingSpinner reduceMotion={reduceMotion} />
            </motion.span>
          )}
          {trailingMode === "check" && (
            <motion.span
              animate={trailingEnter(reduceMotion)}
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-pago"
              exit={cross.exit}
              initial={cross.initial}
              key="trail-check"
              transition={transition}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </motion.span>
          )}
          {trailingMode === "chevron" && (
            <motion.span
              animate={trailingEnter(reduceMotion)}
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-brand-700"
              exit={cross.exit}
              initial={cross.initial}
              key="trail-chevron"
              transition={transition}
            >
              <motion.span
                animate={{
                  rotate: !reduceMotion && open ? 180 : 0,
                }}
                className="inline-flex"
                transition={transition}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HaloSelectContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  ...props
}: ComponentProps<typeof UiSelectContent>) {
  return (
    <UiSelectContent
      {...props}
      align={align}
      alignItemWithTrigger={true}
      className={cn(
        "max-h-72 w-(--anchor-width) min-w-(--anchor-width) rounded-2xl border border-border-strong bg-popover p-1 shadow-md",
        "data-closed:fade-out-0 data-open:fade-in-0 data-closed:animate-out data-open:animate-in",
        "data-closed:zoom-out-95 data-open:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "duration-150 ease-out",
        className
      )}
      side={side}
      sideOffset={sideOffset}
    />
  )
}

export function HaloSelectItem({
  className,
  children,
  index = 0,
  label,
  value,
  ...props
}: SelectPrimitive.Item.Props & { index?: number }) {
  const { listBurst, reduceMotion } = useHaloSelect()
  const capped = Math.min(index, LIST_STAGGER_CAP)
  const delay = reduceMotion ? 0 : capped * LIST_STAGGER_STEP_SEC
  const valueKey =
    value !== undefined &&
    value !== null &&
    typeof value === "object" &&
    "value" in (value as PolishedSelectItem)
      ? (value as PolishedSelectItem).value
      : String(value)

  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex min-h-10 w-full cursor-default select-none items-center gap-2 rounded-full px-3.5 py-2",
        "text-sm font-semibold text-ink-600 antialiased outline-none",
        "transition-colors duration-150 ease-out",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-selected:text-brand-700",
        "data-highlighted:bg-brand-50 data-highlighted:text-brand-700",
        className
      )}
      data-slot="halo-select-item"
      label={label}
      value={value}
      {...props}
    >
      <motion.div
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        className="flex w-full min-w-0 items-center gap-2"
        initial={
          reduceMotion ? false : { filter: "blur(4px)", opacity: 0, y: 4 }
        }
        key={`${listBurst}-${valueKey}`}
        transition={{
          delay,
          duration: 0.22,
          ease: [0.2, 0, 0, 1],
        }}
      >
        <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate text-pretty">
          {children}
        </SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="flex shrink-0 text-brand-700">
          <Check
            aria-hidden
            className="h-3.5 w-3.5 opacity-90"
            strokeWidth={2.5}
          />
        </SelectPrimitive.ItemIndicator>
      </motion.div>
    </SelectPrimitive.Item>
  )
}

export const HaloSelectGroup = SelectGroup
export const HaloSelectLabel = SelectLabel
export const HaloSelectScrollUpButton = SelectScrollUpButton
export const HaloSelectScrollDownButton = SelectScrollDownButton
export const HaloSelectSeparator = SelectSeparator
