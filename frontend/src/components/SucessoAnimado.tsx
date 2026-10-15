import { lazy, Suspense, useEffect, useRef } from "react";

const AnimacaoSucesso = lazy(() => import("@/components/AnimacaoSucesso"));

const PAUSA_APOS_CHECK_MS = 600;
const LIMITE_MS = 3000;

export const preferePoucoMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

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
