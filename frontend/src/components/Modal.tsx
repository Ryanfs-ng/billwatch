import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

// <dialog> nativo: foco preso, Esc e backdrop sem dependência extra.
export function Modal({ aberto, onFechar, titulo, descricao, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (aberto && !dialog?.open) dialog?.showModal();
    if (!aberto && dialog?.open) dialog.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && onFechar()}
      aria-labelledby="modal-titulo"
      className="m-auto w-[min(100%-2rem,30rem)] rounded-lg border bg-card p-0 text-foreground shadow-md backdrop:bg-black/50"
    >
      {aberto && (
        <div className="p-6">
          <h2 id="modal-titulo" className="font-display text-2xl font-extrabold tracking-tight">
            {titulo}
          </h2>
          {descricao && <p className="mt-1 text-sm text-ink-600">{descricao}</p>}
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
