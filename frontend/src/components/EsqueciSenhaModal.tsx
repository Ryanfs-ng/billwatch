import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { solicitarRedefinicaoSenha } from "@/api/auth";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mensagemErro } from "@/lib/utils";

interface EsqueciSenhaModalProps {
  aberto: boolean;
  emailInicial: string;
  onFechar: () => void;
}

export function EsqueciSenhaModal({ aberto, emailInicial, onFechar }: EsqueciSenhaModalProps) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Esqueceu a senha?"
      descricao="Informe o e-mail da sua conta e enviaremos um link para redefinir a senha."
    >
      <Formulario emailInicial={emailInicial} onFechar={onFechar} />
    </Modal>
  );
}

function Formulario({ emailInicial, onFechar }: Omit<EsqueciSenhaModalProps, "aberto">) {
  const [email, setEmail] = useState(emailInicial);

  const mutation = useMutation({
    mutationFn: solicitarRedefinicaoSenha,
    onSuccess: () => {
      toast.success("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
      onFechar();
    },
    onError: (erro) => toast.error(mensagemErro(erro)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(email);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email-recuperacao" className="text-[13px] font-semibold text-foreground">
          E-mail
        </label>
        <Input
          id="email-recuperacao"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="h-11 border-border-strong"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-10" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="h-10">
          {mutation.isPending ? "Enviando..." : "Enviar link"}
        </Button>
      </div>
    </form>
  );
}
