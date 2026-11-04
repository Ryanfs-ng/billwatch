import { confirmarEmail, confirmarNovoEmail } from "@/api/auth";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, mensagemPorStatus } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, MailX } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const TIPOS = {
  cadastro: {
    confirmar: confirmarEmail,
    sucesso: "E-mail confirmado! Sua conta está pronta.",
    destino: "/dashboard",
    dica: "Se o link expirou, faça o cadastro de novo para receber outro.",
    acao: { para: "/cadastro", texto: "Cadastrar novamente" },
  },
  troca: {
    confirmar: confirmarNovoEmail,
    sucesso: "E-mail alterado! Use o novo endereço para entrar.",
    destino: "/configuracoes",
    dica: "Se o link expirou, peça a troca de novo em Configurações.",
    acao: { para: "/configuracoes", texto: "Ir para Configurações" },
  },
};

export function ConfirmarEmail({ tipo = "cadastro" }: { tipo?: keyof typeof TIPOS }) {
  const config = TIPOS[tipo];
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const enviado = useRef(false);

  const mutation = useMutation({
    mutationFn: config.confirmar,
    onSuccess: (data) => {
      toast.success(config.sucesso);
      signIn(data.token);
      navigate(config.destino, { replace: true, viewTransition: true });
    },
  });

  useEffect(() => {
    if (!token || enviado.current) return;
    enviado.current = true;
    mutation.mutate(token);
  }, [token, mutation]);

  if (token && !mutation.isError) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center text-sm text-ink-600">
        <LoaderCircle aria-hidden className="size-7 animate-spin text-brand-500 motion-reduce:animate-none" />
        Confirmando seu e-mail…
      </div>
    );
  }

  const mensagem = token
    ? mensagemPorStatus(
        mutation.error,
        { 400: "Este link é inválido ou já expirou.", 409: "Este e-mail já está em uso por outra conta." },
        "Não foi possível confirmar o e-mail. Tente novamente.",
      )
    : "Este link de confirmação está incompleto.";

  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-atrasado-bg text-atrasado">
        <MailX aria-hidden className="size-7" />
      </span>
      <h2 className="mt-4 font-display text-[26px] font-extrabold text-foreground">Link inválido</h2>
      <p className="mt-2 text-sm text-ink-600">
        {mensagem} {config.dica}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Link to={config.acao.para} viewTransition className={cn(buttonVariants(), "h-11 w-full")}>
          {config.acao.texto}
        </Link>
        <Link to="/login" viewTransition className={cn(buttonVariants({ variant: "ghost" }), "h-11 w-full")}>
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
