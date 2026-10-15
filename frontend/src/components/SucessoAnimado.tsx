import { lazy, Suspense, useEffect, useRef } from "react";

// O player do Lottie só é baixado quando um sucesso aparece pela primeira vez.
const AnimacaoSucesso = lazy(() => import("@/components/AnimacaoSucesso"));

// O check dura 0,7s; depois dele espera um pouco para a mensagem ser lida.
const PAUSA_APOS_CHECK_MS = 600;
// Se a animação não terminar (asset ou player falhou ao carregar), avisa o fim mesmo assim.
const LIMITE_MS = 3000;

// Quem pediu menos movimento no sistema recebe só o toast, sem animação.
export const preferePoucoMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Só o check animado, no tamanho do className. Chama onFim quando a animação termina.
export function CheckAnimado({ className, onFim }: { className?: string; onFim: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onFim, LIMITE_MS);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense fallback={<div className={className} />}>
      <AnimacaoSucesso className={className} onFim={onFim} />
    </Suspense>
  );
}

// Check grande + mensagem, para usar dentro de um Modal. Chama onConcluir depois da pausa de leitura.
export function SucessoAnimado({ mensagem, onConcluir }: { mensagem: string; onConcluir: () => void }) {
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function aoTerminarCheck() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onConcluir, PAUSA_APOS_CHECK_MS);
  }

  return (
    <div role="status" className="flex flex-col items-center pb-2 text-center">
      <CheckAnimado className="size-32" onFim={aoTerminarCheck} />
      <p className="font-semibold">{mensagem}</p>
    </div>
  );
}
