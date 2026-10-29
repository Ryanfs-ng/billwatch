import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const LABEL_STAGGER_SEC = 0.018
const LABEL_CHAR_DURATION_SEC = 0.16
const DEFAULT_LOADING_STAGGER_SEC = 0.038
const DEFAULT_LOADING_CHAR_DURATION_SEC = 0.36

const layoutSpring = {
  type: "spring" as const,
  bounce: 0.12,
  damping: 34,
  stiffness: 420,
}

function ButtonSpinner({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <span className={cn("inline-flex origin-center text-brand-500", !reduceMotion && "animate-spin")}>
      <svg aria-hidden="true" className="size-3.5" focusable="false" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="2.25" />
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

function StaggeredTextLabel({
  text,
  reduceMotion,
  staggerSec = LABEL_STAGGER_SEC,
  charDurationSec = LABEL_CHAR_DURATION_SEC,
}: {
  text: string
  reduceMotion: boolean
  staggerSec?: number
  charDurationSec?: number
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
      aria-label={text}
      animate="visible"
      className="inline-flex items-center"
      initial="hidden"
      key={text}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : staggerSec } } }}
    >
      {chars.map((glyph) => (
        <motion.span
          aria-hidden
          className="inline-block whitespace-pre"
          key={glyph.key}
          transition={{ duration: reduceMotion ? 0 : charDurationSec, ease: "easeOut" }}
          variants={{ hidden: { opacity: reduceMotion ? 1 : 0 }, visible: { opacity: 1 } }}
        >
          {glyph.char}
        </motion.span>
      ))}
    </motion.span>
  )
}

/** Manchas do brilho que correm por baixo da borda (tons de azul da marca). */
const BRILHOS = [
  { left: ["-5%", "75%", "-5%"], duracao: 6, className: "-bottom-4 h-16 w-48 blur-xl from-brand-600 via-brand-500 to-brand-200" },
  { left: ["65%", "10%", "65%"], duracao: 5, className: "-bottom-3 h-12 w-32 blur-lg from-brand-200 via-brand-500 to-brand-700" },
  { left: ["25%", "55%", "25%"], duracao: 4, className: "-bottom-2 h-10 w-24 blur-lg from-brand-500 to-brand-200" },
]

export interface HaloButtonProps extends Omit<ComponentProps<typeof ButtonPrimitive>, "children"> {
  children: ReactNode
  /** Fundo levemente translúcido para o brilho aparecer através da superfície. */
  translucent?: boolean
  /** Mostra o spinner à direita, troca o texto por `loadingText` e desabilita o botão. */
  isLoading?: boolean
  loadingText?: string
  loadingStaggerSec?: number
  loadingCharDurationSec?: number
  /** Quando `children` é texto, as letras aparecem em sequência a cada troca. */
  staggerLabel?: boolean
  className?: string
}

export function HaloButton({
  children,
  className,
  translucent = true,
  isLoading = false,
  loadingText = "Salvando…",
  loadingStaggerSec = DEFAULT_LOADING_STAGGER_SEC,
  loadingCharDurationSec = DEFAULT_LOADING_CHAR_DURATION_SEC,
  staggerLabel = true,
  disabled,
  ...props
}: HaloButtonProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [spinnerVisivel, setSpinnerVisivel] = useState(false)

  /* O spinner entra só depois que o botão termina de alargar, para não "puxar" a animação. */
  useEffect(() => {
    if (!isLoading) return
    const id = window.setTimeout(() => setSpinnerVisivel(true), reduceMotion ? 0 : 280)
    return () => {
      window.clearTimeout(id)
      setSpinnerVisivel(false)
    }
  }, [isLoading, reduceMotion])

  const texto = isLoading ? loadingText : children
  const rotulo =
    typeof texto === "string" && staggerLabel ? (
      <StaggeredTextLabel
        reduceMotion={reduceMotion}
        text={texto}
        {...(isLoading && { staggerSec: loadingStaggerSec, charDurationSec: loadingCharDurationSec })}
      />
    ) : (
      texto
    )

  return (
    <motion.div
      className={cn("group/halo relative inline-flex max-w-full", className)}
      layout={!reduceMotion}
      transition={reduceMotion ? undefined : { layout: layoutSpring }}
    >
      <div className="relative rounded-full p-px">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-70 transition-opacity duration-200 group-focus-within/halo:opacity-100 group-hover/halo:opacity-100">
            {BRILHOS.map((brilho) => (
              <motion.div
                key={brilho.duracao}
                animate={reduceMotion ? undefined : { left: brilho.left }}
                className={cn("absolute left-1/4 bg-linear-to-r", brilho.className)}
                transition={{ duration: brilho.duracao, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>

        <ButtonPrimitive
          aria-busy={isLoading || undefined}
          className={cn(
            "relative flex min-h-11 min-w-0 cursor-pointer items-center gap-2.5 rounded-full border border-border-strong px-6 py-2.5 select-none",
            "text-sm font-semibold tracking-tight text-foreground antialiased shadow-xs",
            "bg-card hover:bg-surface-hover",
            translucent && "bg-card/85 backdrop-blur-xl backdrop-saturate-150 hover:bg-card/95",
            "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
            "transition-[transform,background-color,border-color] duration-200 ease-out",
            "enabled:active:scale-[0.96] motion-reduce:enabled:active:scale-100",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
          disabled={disabled || isLoading}
          {...props}
        >
          <span className="flex min-w-0 flex-1 items-center justify-center gap-2">{rotulo}</span>
          {isLoading && (
            <div className="relative size-7 shrink-0">
              <AnimatePresence initial={false}>
                {spinnerVisivel && (
                  <motion.div
                    aria-hidden
                    animate={{ opacity: 1, scale: 1 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-200"
                    exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.88 }}
                    initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.88 }}
                    transition={reduceMotion ? { duration: 0 } : layoutSpring}
                  >
                    <ButtonSpinner reduceMotion={reduceMotion} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </ButtonPrimitive>
      </div>
    </motion.div>
  )
}
