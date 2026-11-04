import { login } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { BotaoGoogle } from "@/components/BotaoGoogle";
import { EsqueciSenhaModal } from "@/components/EsqueciSenhaModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { mensagemPorStatus } from "@/lib/utils";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Login() {
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email ?? "");
  const [senha, setSenha] = useState("");
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      signIn(data.token);
      navigate("/dashboard", { replace: true, viewTransition: true });
    },
    onError: (erro) => {
      toast.error(
        mensagemPorStatus(erro, {
          401: "E-mail ou senha inválidos.",
          403: "Confirme seu e-mail pelo link que enviamos para ativar a conta.",
        }, "Não foi possível entrar. Tente novamente."),
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ email, senha });
  }

  return (
    <>
      <h2 className="font-display text-[26px] font-extrabold text-foreground">Bem-vindo de volta</h2>
      <p className="mt-1 text-sm text-ink-600">
        Entre para acompanhar seus boletos e próximos vencimentos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-foreground">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 border-border-strong"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="senha" className="text-[13px] font-semibold text-foreground">
            Senha
          </label>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 border-border-strong"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setRecuperandoSenha(true)}
            className="self-start text-xs font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Esqueceu a senha?
          </button>
        </div>

        <Button type="submit" disabled={mutation.isPending} className="h-12 w-full text-base">
          {mutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <BotaoGoogle texto="signin_with" />

      <p className="mt-6 text-center text-sm text-ink-600">
        Não tem conta?{" "}
        <Link to="/cadastro" viewTransition className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>

      <EsqueciSenhaModal
        aberto={recuperandoSenha}
        emailInicial={email}
        onFechar={() => setRecuperandoSenha(false)}
      />
    </>
  );
}

