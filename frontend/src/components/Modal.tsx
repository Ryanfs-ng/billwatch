import { useEffect, useRef, useState, type ReactNode } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

const DURACAO_SAIDA_MS = 120; // igual à transição de saída de dialog.modal no index.css

// O <dialog> aberto fica na "top layer" do navegador, acima de qualquer z-index, e deixa o resto da
// página inerte. Para os toasts aparecerem por cima do fundo (e continuarem clicáveis), o #toaster
// vai para dentro do dialog enquanto ele está aberto e volta para o <body> ao fechar.
function moverToasts(destino: HTMLElement | null | undefined) {
  const toaster = document.getElementById("toaster");
  if (toaster && destino && toaster.parentElement !== destino) destino.append(toaster);
}

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
      moverToasts(dialog);
    } else if (dialog?.open) {
      moverToasts(document.body);
      dialog.close();
    }
  }, [aberto]);

  // Se a tela trocar com o modal aberto, os toasts não podem sumir junto com ele.
  useEffect(() => () => moverToasts(document.body), []);

  // Dispara tanto pelo Esc quanto pelo dialog.close() acima.
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
      // O dialog é só um container transparente do tamanho da tela (clicar nele = clicar fora);
      // o cartão visível é o .modal-painel, que é quem anima (ver index.css).
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
