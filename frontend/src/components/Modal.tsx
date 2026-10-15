import { useEffect, useRef, useState, type ReactNode } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

const DURACAO_SAIDA_MS = 120;

function moverToasts(destino: HTMLElement | null | undefined) {
  const toaster = document.getElementById("toaster");
  if (toaster && destino && toaster.parentElement !== destino) destino.append(toaster);
}

export function Modal({ aberto, onFechar, titulo, descricao, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const timerSaida = useRef<number>(undefined);
  const [mostrarConteudo, setMostrarConteudo] = useState(aberto);
  if (aberto && !mostrarConteudo) setMostrarConteudo(true);
  /* oxlint-disable react/refs */
  const ultimoAberto = useRef({ titulo, descricao, children });
  if (aberto) ultimoAberto.current = { titulo, descricao, children };
  const conteudo = aberto ? { titulo, descricao, children } : ultimoAberto.current;
  /* oxlint-enable react/refs */

  useEffect(() => {
    const dialog = ref.current;
    if (aberto) {
      window.clearTimeout(timerSaida.current);
      if (!dialog?.open) dialog?.showModal();
      moverToasts(dialog);
    } else if (dialog?.open) {
      moverToasts(document.body);
      dialog.close();
    }
  }, [aberto]);

  useEffect(() => () => moverToasts(document.body), []);

  function aoFechar() {
    moverToasts(document.body);
    window.clearTimeout(timerSaida.current);
    timerSaida.current = window.setTimeout(() => setMostrarConteudo(false), DURACAO_SAIDA_MS);
    onFechar();
  }

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="modal-titulo"
      className="modal"
    >
      {mostrarConteudo && (
        <div className="modal-painel w-[min(100%,30rem)] rounded-lg border bg-card p-6 text-foreground shadow-md">
          <h2 id="modal-titulo" className="font-display text-2xl font-extrabold tracking-tight">
            {conteudo.titulo}
          </h2>
          {conteudo.descricao && <p className="mt-1 text-sm text-ink-600">{conteudo.descricao}</p>}
          <div className="mt-5">{conteudo.children}</div>
        </div>
      )}
    </dialog>
  );
}
