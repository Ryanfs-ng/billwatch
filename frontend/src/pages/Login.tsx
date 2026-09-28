import { login } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { EsqueciSenhaModal } from "@/components/EsqueciSenhaModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Login() {
  const [email, setEmail] = useState("");
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
        isAxiosError(erro) && erro.response?.status === 401
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar. Tente novamente.",
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

      <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="h-12 w-full gap-2 text-base" title="Em breve">
        <GoogleIcon className="size-4" />
        Continuar com o Google
      </Button>

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}
