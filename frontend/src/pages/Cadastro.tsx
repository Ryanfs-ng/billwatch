import { registrar } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroConfirmacao, setErroConfirmacao] = useState("");

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const mutation = useMutation({
    mutationFn: registrar,
    onSuccess: (data) => {
      signIn(data.token);
      navigate("/dashboard", { replace: true, viewTransition: true });
    },
    onError: (erro) => {
      toast.error(
        isAxiosError(erro) && erro.response?.status === 409
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar a conta. Tente novamente.",
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (senha !== confirmarSenha) {
      setErroConfirmacao("As senhas não coincidem.");
      return;
    }
    setErroConfirmacao("");
    mutation.mutate({ nome, email, senha });
  }

  return (
    <>
      <h2 className="font-display text-[26px] font-extrabold text-foreground">Crie sua conta</h2>
      <p className="mt-1 text-sm text-ink-600">
        Comece a organizar seus boletos em poucos segundos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className="text-[13px] font-semibold text-foreground">
            Nome
          </label>
          <Input
            id="nome"
            autoComplete="name"
            required
            className="h-12 border-border-strong"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="senha-ajuda"
            className="h-12 border-border-strong"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p id="senha-ajuda" className="text-xs text-ink-600">
            Mínimo de 8 caracteres.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmar-senha" className="text-[13px] font-semibold text-foreground">
            Confirmar senha
          </label>
          <Input
            id="confirmar-senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-12 border-border-strong"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
          {erroConfirmacao && <p className="text-xs text-destructive">{erroConfirmacao}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="h-12 w-full text-base">
          {mutation.isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Já tem conta?{" "}
        <Link to="/login" viewTransition className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
