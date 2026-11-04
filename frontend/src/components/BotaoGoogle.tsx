import { entrarComGoogle } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { mensagemErro } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GoogleIdentity {
  initialize(config: { client_id: string; callback: (resposta: { credential: string }) => void }): void;
  renderButton(elemento: HTMLElement, opcoes: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const LARGURA_MAXIMA = 400;

let carregamento: Promise<void> | undefined;

function carregarScriptGoogle() {
  carregamento ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      carregamento = undefined;
      reject(new Error("Falha ao carregar o Google"));
    };
    document.head.append(script);
  });
  return carregamento;
}

export function BotaoGoogle({ texto }: { texto: "signin_with" | "signup_with" }) {
  const area = useRef<HTMLDivElement>(null);
  const botaoClaro = useRef<HTMLDivElement>(null);
  const botaoEscuro = useRef<HTMLDivElement>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: entrarComGoogle,
    onSuccess: (data) => {
      signIn(data.token);
      navigate("/dashboard", { replace: true, viewTransition: true });
    },
    onError: (erro) => toast.error(mensagemErro(erro, "Não foi possível entrar com o Google. Tente novamente.")),
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let ativo = true;
    carregarScriptGoogle()
      .then(() => {
        const google = window.google?.accounts.id;
        if (!ativo || !area.current || !botaoClaro.current || !botaoEscuro.current || !google) return;
        google.initialize({ client_id: CLIENT_ID, callback: (resposta) => mutate(resposta.credential) });
        const opcoes = {
          type: "standard",
          size: "large",
          shape: "pill",
          text: texto,
          locale: "pt-BR",
          width: Math.min(area.current.clientWidth, LARGURA_MAXIMA),
        };
        google.renderButton(botaoClaro.current, { ...opcoes, theme: "outline" });
        google.renderButton(botaoEscuro.current, { ...opcoes, theme: "filled_black" });
      })
      .catch(() => {
        if (ativo) toast.error("Não foi possível carregar o login com Google.");
      });
    return () => {
      ativo = false;
    };
  }, [texto, mutate]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <div
        ref={area}
        aria-busy={isPending}
        className="min-h-11 w-full transition-opacity [color-scheme:light] aria-busy:pointer-events-none aria-busy:opacity-60"
      >
        <div ref={botaoClaro} className="flex justify-center dark:hidden" />
        <div ref={botaoEscuro} className="hidden justify-center dark:flex" />
      </div>
    </>
  );
}
