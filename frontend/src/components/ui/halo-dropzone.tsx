import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { FileText, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"

const BORDER_TRAIL_LOOP_MS = 5250

/** Brilho que percorre a borda enquanto a área está em foco, com hover ou recebendo um arquivo. */
function BordaAnimada({ ativa }: { ativa: boolean }) {
  const progresso = useMotionValue(0)
  const offsetDistance = useTransform(progresso, (v) => `${((v % 100) + 100) % 100}%`)

  useEffect(() => {
    if (!ativa) return
    let rafId = 0
    let anterior = performance.now()
    const tick = (agora: number) => {
      progresso.set((progresso.get() + ((agora - anterior) / BORDER_TRAIL_LOOP_MS) * 100) % 100)
      anterior = agora
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [ativa, progresso])

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        ativa ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      {/* offsetDistance é um MotionValue: só pode ir pelo style do motion. */}
      <motion.div className="absolute h-8 w-46 blur-md [offset-path:rect(0_auto_auto_0_round_14px)]" style={{ offsetDistance }}>
        <div className="size-full rounded-full bg-linear-to-r from-transparent via-brand-500 to-transparent" />
      </motion.div>
      <motion.div className="absolute h-8 w-46 blur-[3px] [offset-path:rect(0_auto_auto_0_round_14px)]" style={{ offsetDistance }}>
        <div className="size-full rounded-full bg-linear-to-r from-transparent via-brand-200 to-transparent" />
      </motion.div>
    </div>
  )
}

function aceitaArquivo(arquivo: File, accept?: string) {
  if (!accept) return true
  const nome = arquivo.name.toLowerCase()
  return accept.split(",").some((regra) => {
    const r = regra.trim().toLowerCase()
    if (r.startsWith(".")) return nome.endsWith(r)
    if (r.endsWith("/*")) return arquivo.type.startsWith(r.slice(0, -1))
    return arquivo.type === r
  })
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
}

/** Miniatura via URL temporária, criada e revogada no ref do <img> (seguro com StrictMode). */
function Miniatura({ arquivo }: { arquivo: File }) {
  const mostrar = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return
      const url = URL.createObjectURL(arquivo)
      img.src = url
      return () => URL.revokeObjectURL(url)
    },
    [arquivo],
  )
  return <img ref={mostrar} alt="" className="size-full object-cover" />
}

export interface HaloDropzoneProps {
  /** Nome do campo no `<form>`: o arquivo escolhido entra no FormData com esse nome. */
  name?: string
  id?: string
  accept?: string
  disabled?: boolean
  className?: string
  emptyLabel?: string
  formatHint?: string | null
  /** Chamado quando o arquivo arrastado não bate com `accept` (ele é descartado). */
  onRejeitado?: (arquivo: File) => void
  onArquivo?: (arquivo: File | null) => void
}

export function HaloDropzone({
  name,
  id,
  accept,
  disabled = false,
  className,
  emptyLabel = "Arraste um arquivo ou clique para escolher",
  formatHint,
  onRejeitado,
  onArquivo,
}: HaloDropzoneProps) {
  const reduceMotion = useReducedMotion() ?? false
  const idGerado = useId()
  const inputId = id ?? idGerado
  const inputRef = useRef<HTMLInputElement>(null)
  const profundidadeArraste = useRef(0)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [destacada, setDestacada] = useState(false)

  const escolher = useCallback(
    (novo: File | null) => {
      setArquivo(novo)
      onArquivo?.(novo)
    },
    [onArquivo],
  )

  function aoMudarInput(e: ChangeEvent<HTMLInputElement>) {
    escolher(e.target.files?.[0] ?? null)
  }

  function aoSoltar(e: DragEvent) {
    e.preventDefault()
    profundidadeArraste.current = 0
    setArrastando(false)
    const solto = e.dataTransfer.files[0]
    if (disabled || !solto || !inputRef.current) return
    if (!aceitaArquivo(solto, accept)) return onRejeitado?.(solto)
    const dt = new DataTransfer()
    dt.items.add(solto)
    inputRef.current.files = dt.files
    escolher(solto)
  }

  function remover() {
    if (inputRef.current) inputRef.current.value = ""
    escolher(null)
  }

  const cf = {
    initial: { opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -2 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 2 },
    transition: { duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const },
  }
  const enfatizada = !disabled && (destacada || arrastando)

  return (
    <div
      className={cn("group/drop relative rounded-2xl p-px", disabled && "pointer-events-none opacity-60", className)}
      onDragEnter={(e) => {
        e.preventDefault()
        profundidadeArraste.current += 1
        setArrastando(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        profundidadeArraste.current = Math.max(0, profundidadeArraste.current - 1)
        if (profundidadeArraste.current === 0) setArrastando(false)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
      }}
      onDrop={aoSoltar}
      onMouseEnter={() => setDestacada(true)}
      onMouseLeave={() => setDestacada(false)}
      onFocus={() => setDestacada(true)}
      onBlur={() => setDestacada(false)}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className={cn("absolute inset-x-0 bottom-0 h-3/5 transition-opacity duration-300", enfatizada ? "opacity-80" : "opacity-40")}>
          <motion.div
            animate={reduceMotion ? undefined : { left: ["-5%", "70%", "-5%"] }}
            className="absolute -bottom-10 left-0 h-28 w-72 bg-linear-to-r from-brand-600 via-brand-500 to-brand-200 blur-2xl"
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            animate={reduceMotion ? undefined : { left: ["65%", "10%", "65%"] }}
            className="absolute -bottom-7 left-1/2 h-20 w-44 bg-linear-to-r from-brand-200 to-brand-500 blur-2xl"
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={aoMudarInput}
        className="peer sr-only"
      />

      <div
        className={cn(
          "relative flex min-h-36 flex-col items-center justify-center rounded-[15px] border border-border-strong bg-card/90 px-6 py-6 backdrop-blur-xl",
          "transition-[background-color,border-color] duration-200 ease-out",
          "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40",
          arrastando && "border-brand-500 bg-brand-50/90",
        )}
      >
        <AnimatePresence initial={false} mode="wait">
          {arquivo ? (
            <motion.div key="arquivo" {...cf} className="flex w-full items-center gap-3">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-brand-50 text-brand-500 ring-1 ring-brand-200">
                {arquivo.type.startsWith("image/") ? (
                  <Miniatura arquivo={arquivo} />
                ) : (
                  <FileText aria-hidden className="size-6" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{arquivo.name}</p>
                <p className="text-xs text-ink-600 tabular-nums">
                  {formatarTamanho(arquivo.size)} ·{" "}
                  <label htmlFor={inputId} className="cursor-pointer font-medium text-primary hover:underline">
                    trocar
                  </label>
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remover ${arquivo.name}`}
                title="Remover arquivo"
                onClick={remover}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-ink-600 transition-colors hover:bg-surface-hover hover:text-atrasado focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.label
              key="vazio"
              {...cf}
              htmlFor={inputId}
              className="flex w-full cursor-pointer flex-col items-center gap-2.5 text-center"
            >
              <motion.span
                aria-hidden
                animate={reduceMotion || disabled ? { y: 0 } : { y: [0, -3, 0] }}
                className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-500 ring-1 ring-brand-200"
                transition={{ duration: 4.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
              >
                <Upload className="size-5" />
              </motion.span>
              <span className="text-sm text-balance">{arrastando ? "Solte o arquivo aqui" : emptyLabel}</span>
              {formatHint && <span className="text-xs text-ink-600">{formatHint}</span>}
            </motion.label>
          )}
        </AnimatePresence>

        {!reduceMotion && !disabled && <BordaAnimada ativa={enfatizada} />}
      </div>
    </div>
  )
}
