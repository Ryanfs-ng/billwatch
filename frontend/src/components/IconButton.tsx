import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Botão só-ícone: o label vira aria-label e tooltip.
export function IconButton({ label, className, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-ink-600 transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px]",
        className,
      )}
      {...props}
    />
  );
}
