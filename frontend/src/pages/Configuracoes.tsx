import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Trash2 } from "lucide-react";
import { alterarEmail, alterarSenha, buscarPerfil, enviarFoto, removerFoto, salvarNotificacoes } from "@/api/usuarios";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { HaloButton } from "@/components/ui/halo-button";
import { HaloSwitch } from "@/components/ui/halo-switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { inputClass, mensagemErro, mensagemPorStatus } from "@/lib/utils";
import type { Perfil } from "@/types";

const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;
const OPCOES_DIAS = [1, 3, 7, 15];
const SENHA_INCORRETA = { 400: "Senha atual incorreta." };

const label = "mb-1.5 block text-[13px] font-semibold";
const campo = "h-11 border-border-strong";

export function Configuracoes() {
  const consulta = useQuery({ queryKey: ["perfil"], queryFn: buscarPerfil });

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[28px]">Configurações</h1>
      <p className="mt-1 text-sm text-ink-600">Gerencie sua foto, seus dados de acesso e as notificações.</p>

      <div className="mt-6 flex max-w-3xl flex-col gap-4">
        {consulta.isPending ? (
          <div className="h-64 animate-pulse rounded-lg border bg-card shadow-xs" aria-label="Carregando configurações" />
        ) : consulta.isError ? (
          <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center shadow-xs">
            <p className="font-semibold">Não foi possível carregar suas configurações.</p>
            <p className="mt-1 max-w-sm text-sm text-ink-600">{mensagemErro(consulta.error)}</p>
            <Button variant="outline" className="mt-5" onClick={() => consulta.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <SecaoFoto perfil={consulta.data} />
            <SecaoEmail perfil={consulta.data} />
            <SecaoSenha />
            <SecaoNotificacoes key={consulta.data.id} perfil={consulta.data} />
          </>
        )}
      </div>
    </>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-xs">
      <h2 className="font-display text-lg font-extrabold">{titulo}</h2>
      <p className="mt-1 text-sm text-ink-600">{descricao}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BotaoSalvar({ salvando, className, children }: { salvando: boolean; className?: string; children: string }) {
  return (
    <HaloButton
      type="submit"
      isLoading={salvando}
      loadingText="Salvando…"
      loadingCharDurationSec={0.22}
      loadingStaggerSec={0.028}
      className={className}
    >
      {children}
    </HaloButton>
  );
}

function useRecarregarFoto() {
  const queryClient = useQueryClient();
  return () =>
    ["perfil", "foto", "usuarios", "grupo"].forEach((chave) => queryClient.invalidateQueries({ queryKey: [chave] }));
}

function SecaoFoto({ perfil }: { perfil: Perfil }) {
  const recarregar = useRecarregarFoto();
  const inputFoto = useRef<HTMLInputElement>(null);

  const enviar = useMutation({
    mutationFn: enviarFoto,
    onSuccess: () => (recarregar(), toast.success("Foto de perfil atualizada.")),
    onError: (e) =>
      toast.error(
        mensagemPorStatus(e, {
          413: "A imagem deve ter até 10MB.",
          415: "Envie uma imagem JPG, PNG ou WEBP.",
        }),
      ),
  });

  const remover = useMutation({
    mutationFn: removerFoto,
    onSuccess: () => (recarregar(), toast.success("Foto de perfil removida.")),
    onError: (e) => toast.error(mensagemErro(e)),
  });

  function aoEscolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      toast.error("A imagem deve ter até 10MB.");
      return;
    }
    enviar.mutate(arquivo);
  }

  const ocupado = enviar.isPending || remover.isPending;

  return (
    <Secao titulo="Foto de perfil" descricao="Aparece na barra lateral e para os membros do seu grupo.">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          usuarioId={perfil.id}
          temFoto={perfil.temFoto}
          nome={perfil.nome}
          email={perfil.email}
          className="size-20 text-2xl"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" disabled={ocupado} onClick={() => inputFoto.current?.click()}>
            <ImageUp data-icon="inline-start" className="size-4" />
            {enviar.isPending ? "Enviando…" : perfil.temFoto ? "Trocar foto" : "Enviar foto"}
          </Button>
          {perfil.temFoto && (
            <Button
              variant="outline"
              className="h-10 text-atrasado hover:bg-atrasado-bg hover:text-atrasado"
              disabled={ocupado}
              onClick={() => remover.mutate()}
            >
              <Trash2 data-icon="inline-start" className="size-4" />
              {remover.isPending ? "Removendo…" : "Remover"}
            </Button>
          )}
        </div>
        <p className="w-full text-xs text-ink-600">JPG, PNG ou WEBP, até 10MB.</p>
      </div>
      <input
        ref={inputFoto}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={aoEscolherFoto}
        tabIndex={-1}
        aria-hidden
      />
    </Secao>
  );
}

function SecaoEmail({ perfil }: { perfil: Perfil }) {
  const { signIn } = useAuth();
  const queryClient = useQueryClient();
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");

  const salvar = useMutation({
    mutationFn: alterarEmail,
    onSuccess: (token) => {
      signIn(token);
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
      setNovoEmail("");
      setSenhaAtual("");
      toast.success("E-mail alterado.");
    },
    onError: (e) => toast.error(mensagemPorStatus(e, { ...SENHA_INCORRETA, 409: "Este e-mail já está cadastrado." })),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    salvar.mutate({ novoEmail: novoEmail.trim(), senhaAtual });
  }

  return (
    <Secao titulo="E-mail" descricao={`Você entra no BillWatch com ${perfil.email}.`}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="novo-email" className={label}>Novo e-mail</label>
          <Input
            id="novo-email"
            type="email"
            pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
            title="Informe um e-mail válido, como nome@exemplo.com"
            autoComplete="email"
            required
            className={campo}
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="senha-email" className={label}>Senha atual</label>
          <Input
            id="senha-email"
            type="password"
            autoComplete="current-password"
            required
            className={campo}
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        </div>
        <BotaoSalvar salvando={salvar.isPending} className="justify-self-start">Alterar e-mail</BotaoSalvar>
      </form>
    </Secao>
  );
}

function SecaoSenha() {
  const { signIn } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroConfirmacao, setErroConfirmacao] = useState("");

  const salvar = useMutation({
    mutationFn: alterarSenha,
    onSuccess: (token) => {
      signIn(token);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      toast.success("Senha alterada. As sessões em outros aparelhos foram encerradas.");
    },
    onError: (e) => toast.error(mensagemPorStatus(e, SENHA_INCORRETA)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErroConfirmacao("As senhas não coincidem.");
      return;
    }
    setErroConfirmacao("");
    salvar.mutate({ senhaAtual, novaSenha });
  }

  return (
    <Secao titulo="Senha" descricao="Ao trocar a senha, você sai dos outros aparelhos conectados.">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <label htmlFor="senha-atual" className={label}>Senha atual</label>
          <Input
            id="senha-atual"
            type="password"
            autoComplete="current-password"
            required
            className={campo}
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nova-senha" className={label}>Nova senha</label>
          <Input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="nova-senha-ajuda"
            className={campo}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <p id="nova-senha-ajuda" className="mt-1.5 text-xs text-ink-600">Mínimo de 8 caracteres.</p>
        </div>
        <div>
          <label htmlFor="confirmar-nova-senha" className={label}>Confirmar nova senha</label>
          <Input
            id="confirmar-nova-senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={campo}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
          {erroConfirmacao && <p className="mt-1.5 text-xs text-destructive">{erroConfirmacao}</p>}
        </div>
        <BotaoSalvar salvando={salvar.isPending} className="justify-self-start">Alterar senha</BotaoSalvar>
      </form>
    </Secao>
  );
}

function SecaoNotificacoes({ perfil }: { perfil: Perfil }) {
  const queryClient = useQueryClient();
  const [diasAviso, setDiasAviso] = useState(perfil.diasAviso);
  const [avisoVencimentoAtivo, setAvisoVencimentoAtivo] = useState(perfil.avisoVencimentoAtivo);
  const [resumoSemanalAtivo, setResumoSemanalAtivo] = useState(perfil.resumoSemanalAtivo);
  const opcoes = OPCOES_DIAS.includes(perfil.diasAviso) ? OPCOES_DIAS : [...OPCOES_DIAS, perfil.diasAviso].sort((a, b) => a - b);

  const salvar = useMutation({
    mutationFn: salvarNotificacoes,
    onSuccess: (atualizado) => {
      queryClient.setQueryData(["perfil"], atualizado);
      toast.success("Preferências de notificação salvas.");
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    salvar.mutate({ diasAviso, avisoVencimentoAtivo, resumoSemanalAtivo });
  }

  return (
    <Secao titulo="Notificações" descricao="Escolha quando e como o BillWatch avisa você por e-mail.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Opcao
          id="aviso-vencimento"
          titulo="Aviso de vencimento"
          texto="Receba um e-mail antes de um boleto vencer."
          marcado={avisoVencimentoAtivo}
          onMudar={setAvisoVencimentoAtivo}
        />
        <div className="sm:max-w-60">
          <label htmlFor="dias-aviso" className={label}>Antecedência</label>
          <select
            id="dias-aviso"
            disabled={!avisoVencimentoAtivo}
            value={diasAviso}
            onChange={(e) => setDiasAviso(Number(e.target.value))}
            className={`${inputClass} disabled:opacity-50`}
          >
            {opcoes.map((dias) => (
              <option key={dias} value={dias}>
                {dias === 1 ? "1 dia antes" : `${dias} dias antes`}
              </option>
            ))}
          </select>
        </div>
        <Opcao
          id="resumo-semanal"
          titulo="Resumo semanal"
          texto="Toda segunda às 8h, um e-mail com os boletos da semana."
          marcado={resumoSemanalAtivo}
          onMudar={setResumoSemanalAtivo}
        />
        <BotaoSalvar salvando={salvar.isPending} className="self-start">Salvar preferências</BotaoSalvar>
      </form>
    </Secao>
  );
}

interface OpcaoProps {
  id: string;
  titulo: string;
  texto: string;
  marcado: boolean;
  onMudar: (marcado: boolean) => void;
}

function Opcao({ id, titulo, texto, marcado, onMudar }: OpcaoProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span id={`${id}-titulo`} className="block text-sm font-semibold">{titulo}</span>
        <span id={`${id}-texto`} className="block text-sm text-ink-600">{texto}</span>
      </div>
      <HaloSwitch
        id={id}
        checked={marcado}
        onCheckedChange={onMudar}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-texto`}
      />
    </div>
  );
}
