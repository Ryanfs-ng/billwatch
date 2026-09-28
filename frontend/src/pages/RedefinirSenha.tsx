import { redefinirSenha } from "@/api/auth";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mensagemErro } from "@/lib/utils";
import { Login } from "@/pages/Login";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroConfirmacao, setErroConfirmacao] = useState("");

  const mutation = useMutation({
    mutationFn: redefinirSenha,
    onSuccess: () => {
      toast.success("Senha redefinida. Entre com a nova senha.");
      navigate("/login", { replace: true, viewTransition: true });
    },
    onError: (erro) => toast.error(mensagemErro(erro)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErroConfirmacao("As senhas não coincidem.");
      return;
    }
    setErroConfirmacao("");
    mutation.mutate({ token: token!, novaSenha });
  }

  if (!token) {
    return (
      <>
        <Login />
        <Modal aberto titulo="Link inválido" onFechar={() => navigate("/login", { replace: true })}>
          <p className="text-sm text-ink-600">
            Este link de redefinição de senha está incompleto. Solicite um novo em "Esqueceu a senha?".
          </p>
          <Button className="mt-5 h-10 w-full" onClick={() => navigate("/login", { replace: true })}>
            Voltar ao login
          </Button>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Login />
      <Modal
        aberto
        titulo="Redefinir senha"
        descricao="Escolha uma nova senha para sua conta."
        onFechar={() => navigate("/login", { replace: true })}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nova-senha" className="text-[13px] font-semibold text-foreground">
              Nova senha
            </label>
            <Input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              autoFocus
              className="h-11 border-border-strong"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
            <p className="text-xs text-ink-600">Mínimo de 8 caracteres.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmar-senha" className="text-[13px] font-semibold text-foreground">
              Confirmar nova senha
            </label>
            <Input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="h-11 border-border-strong"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            {erroConfirmacao && <p className="text-xs text-destructive">{erroConfirmacao}</p>}
          </div>

          <Button type="submit" disabled={mutation.isPending} className="mt-2 h-11 w-full">
            {mutation.isPending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
