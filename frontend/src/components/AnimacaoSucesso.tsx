import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import wasmUrl from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";

// O player baixa o motor (WASM) do CDN jsdelivr por padrão; assim ele vem do próprio app.
setWasmUrl(wasmUrl);

// Check animado (public/animacoes/sucesso.lottie, do LottieFiles). Carregado sob demanda (React.lazy)
// pelo SucessoAnimado.tsx, para o player não entrar no bundle inicial.
export default function AnimacaoSucesso({ className, onFim }: { className?: string; onFim: () => void }) {
  return (
    <DotLottieReact
      src="/animacoes/sucesso.lottie"
      autoplay
      dotLottieRefCallback={(player) => player?.addEventListener("complete", onFim)}
      className={className}
    />
  );
}
