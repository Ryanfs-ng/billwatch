import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, LogIn, LogOut, Plus, RefreshCw, Users } from "lucide-react";
import { buscarMeuGrupo, criarGrupo, entrarNoGrupo, gerarNovoCodigo, sairDoGrupo } from "@/api/grupos";
import { IconButton } from "@/components/IconButton";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { mensagemErro } from "@/lib/utils";
import type { Grupo as GrupoTipo } from "@/types";

export const consultaDoGrupo = { queryKey: ["grupo"], queryFn: buscarMeuGrupo };

function mensagemErroGrupo(erro: unknown): string {
  const status = isAxiosError(erro) ? erro.response?.status : undefined;
  if (status === 404) return "Código de convite inválido.";
  if (status === 409) return "Você já participa de um grupo.";
  return mensagemErro(erro);
}

function useRecarregarGrupo() {
  const queryClient = useQueryClient();
  return () =>
    ["grupo", "usuarios", "boletos"].forEach((chave) => queryClient.invalidateQueries({ queryKey: [chave] }));
}

export function Grupo() {
  const consulta = useQuery(consultaDoGrupo);

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[28px]">Grupo</h1>
      <p className="mt-1 text-sm text-ink-600">
        Quem participa do mesmo grupo vê e gerencia os boletos de todos os membros.
      </p>

      <div className="mt-6">
        {consulta.isPending ? (
          <div className="h-56 animate-pulse rounded-lg border bg-card shadow-xs" aria-label="Carregando grupo" />
        ) : consulta.isError ? (
          <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center shadow-xs">
            <p className="font-semibold">Não foi possível carregar o grupo.</p>
            <p className="mt-1 max-w-sm text-sm text-ink-600">{mensagemErro(consulta.error)}</p>
            <Button variant="outline" className="mt-5" onClick={() => consulta.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : consulta.data ? (
          <MeuGrupo grupo={consulta.data} />
        ) : (
          <SemGrupo />
        )}
      </div>
    </>
  );
}

function SemGrupo() {
  const recarregar = useRecarregarGrupo();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  const criar = useMutation({
    mutationFn: criarGrupo,
    onSuccess: (grupo) => (recarregar(), toast.success(`Grupo "${grupo.nome}" criado.`)),
    onError: (e) => toast.error(mensagemErroGrupo(e)),
  });

  const entrar = useMutation({
    mutationFn: entrarNoGrupo,
    onSuccess: (grupo) => (recarregar(), toast.success(`Você entrou no grupo "${grupo.nome}".`)),
    onError: (e) => toast.error(mensagemErroGrupo(e)),
  });

  function handleCriar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    criar.mutate(nome.trim());
  }

  function handleEntrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    entrar.mutate(codigo.trim());
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleCriar} className="flex flex-col rounded-lg border bg-card p-6 shadow-xs">
        <h2 className="font-display text-lg font-extrabold">Criar grupo</h2>
        <p className="mt-1 text-sm text-ink-600">Crie um grupo e convide quem divide as contas com você.</p>
        <label htmlFor="nome-grupo" className="mt-5 mb-1.5 text-[13px] font-semibold">
          Nome do grupo
        </label>
        <Input
          id="nome-grupo"
          required
          maxLength={100}
          placeholder="Ex.: Casa"
          className="h-11 border-border-strong"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Button type="submit" disabled={criar.isPending} className="mt-5 h-10 self-start">
          <Plus data-icon="inline-start" className="size-5" />
          {criar.isPending ? "Criando…" : "Criar grupo"}
        </Button>
      </form>

      <form onSubmit={handleEntrar} className="flex flex-col rounded-lg border bg-card p-6 shadow-xs">
        <h2 className="font-display text-lg font-extrabold">Entrar com código</h2>
        <p className="mt-1 text-sm text-ink-600">Peça o código de convite a alguém que já participa do grupo.</p>
        <label htmlFor="codigo-convite" className="mt-5 mb-1.5 text-[13px] font-semibold">
          Código de convite
        </label>
        <Input
          id="codigo-convite"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Ex.: 7K2QX9MB"
          className="h-11 border-border-strong font-mono uppercase placeholder:normal-case"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={entrar.isPending} className="mt-5 h-10 self-start">
          <LogIn data-icon="inline-start" className="size-5" />
          {entrar.isPending ? "Entrando…" : "Entrar no grupo"}
        </Button>
      </form>
    </div>
  );
}

function MeuGrupo({ grupo }: { grupo: GrupoTipo }) {
  const { email } = useAuth();
  const recarregar = useRecarregarGrupo();
  const [confirmando, setConfirmando] = useState<"codigo" | "sair" | null>(null);

  const novoCodigo = useMutation({
    mutationFn: gerarNovoCodigo,
    onSuccess: () => (recarregar(), setConfirmando(null), toast.success("Novo código gerado. O anterior não funciona mais.")),
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const sair = useMutation({
    mutationFn: sairDoGrupo,
    onSuccess: () => (recarregar(), setConfirmando(null), toast.success(`Você saiu do grupo "${grupo.nome}".`)),
    onError: (e) => toast.error(mensagemErro(e)),
  });

  function copiarCodigo() {
    navigator.clipboard.writeText(grupo.codigoConvite).then(
      () => toast.success("Código copiado."),
      () => toast.error("Não foi possível copiar o código."),
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
          <Users className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-extrabold">{grupo.nome}</h2>
          <p className="text-sm text-ink-600">
            {grupo.membros.length} {grupo.membros.length === 1 ? "membro" : "membros"}
          </p>
        </div>
      </div>

      <div className="border-b p-6">
        <p className="text-[13px] font-semibold">Código de convite</p>
        <p className="mt-1 text-sm text-ink-600">Envie este código para quem você quer adicionar ao grupo.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex h-10 items-center gap-1 rounded-md border bg-surface-sunken pr-1 pl-3">
            <span className="font-mono text-lg font-bold tracking-[0.2em]">{grupo.codigoConvite}</span>
            <IconButton label="Copiar código" onClick={copiarCodigo} className="size-8">
              <Copy />
            </IconButton>
          </span>
          <Button variant="outline" className="h-10" onClick={() => setConfirmando("codigo")}>
            <RefreshCw data-icon="inline-start" className="size-4" />
            Gerar novo código
          </Button>
        </div>
      </div>

      <div className="p-6">
        <p className="text-[13px] font-semibold">Membros</p>
        <ul className="mt-2 divide-y">
          {grupo.membros.map((membro) => (
            <li key={membro.id} className="flex flex-col py-3">
              <span className="font-medium">
                {membro.nome}
                {membro.email === email && <span className="font-normal text-ink-600"> (você)</span>}
              </span>
              <span className="truncate text-sm text-ink-600">{membro.email}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          className="mt-4 h-10 text-atrasado hover:bg-atrasado-bg hover:text-atrasado"
          onClick={() => setConfirmando("sair")}
        >
          <LogOut data-icon="inline-start" className="size-4" />
          Sair do grupo
        </Button>
      </div>

      <Modal
        aberto={confirmando === "codigo"}
        onFechar={() => setConfirmando(null)}
        titulo="Gerar novo código?"
        descricao="O código atual deixa de funcionar. Quem ainda não entrou no grupo vai precisar do novo código."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmando(null)}>Cancelar</Button>
          <Button disabled={novoCodigo.isPending} onClick={() => novoCodigo.mutate()}>
            {novoCodigo.isPending ? "Gerando…" : "Gerar novo código"}
          </Button>
        </div>
      </Modal>

      <Modal
        aberto={confirmando === "sair"}
        onFechar={() => setConfirmando(null)}
        titulo="Sair do grupo?"
        descricao={`Seus boletos deixam de aparecer para os membros de "${grupo.nome}", e você deixa de ver os boletos deles. Para voltar, será preciso um código de convite.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmando(null)}>Cancelar</Button>
          <Button
            className="bg-atrasado text-white hover:bg-atrasado/90"
            disabled={sair.isPending}
            onClick={() => sair.mutate()}
          >
            {sair.isPending ? "Saindo…" : "Sair do grupo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
