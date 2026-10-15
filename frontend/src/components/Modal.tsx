import { useEffect, useRef, useState, type ReactNode } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

const DURACAO_SAIDA_MS = 120; // igual à transição de saída de dialog.modal no index.css

// <dialog> nativo: foco preso, Esc e backdrop sem dependência extra. A animação fica no index.css.
export function Modal({ aberto, onFechar, titulo, descricao, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const timerSaida = useRef<number>(undefined);
  // O conteúdo continua montado durante a animação de saída; senão a caixa sumiria vazia.
  const [mostrarConteudo, setMostrarConteudo] = useState(aberto);
  if (aberto && !mostrarConteudo) setMostrarConteudo(true);
  // Quem usa o Modal costuma limpar os dados ao fechar (ex.: setDiaAberto(null)); durante a saída
  // exibimos o último conteúdo de quando estava aberto, para o título não sumir no meio da animação.
  // Ref lido no render de propósito: só importa o valor da última renderização aberta.
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
    } else if (dialog?.open) {
      dialog.close();
    }
  }, [aberto]);

  // Dispara tanto pelo Esc quanto pelo dialog.close() acima.
  function aoFechar() {
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
      className="modal m-auto w-[min(100%-2rem,30rem)] rounded-lg border bg-card p-0 text-foreground shadow-md"
    >
      {mostrarConteudo && (
        <div className="p-6">
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
