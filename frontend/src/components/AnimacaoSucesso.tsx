import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";
import wasmUrl from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";

setWasmUrl(wasmUrl);

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
