# Billwatch

Sistema de gestão de boletos para uso familiar: cadastro manual de boletos (com anexo de foto/PDF), dashboard com agregados de vencimento e notificação por e-mail quando um boleto está próximo do vencimento.

> Status: estrutura inicial do projeto. Regras de negócio, autenticação e telas ainda serão implementadas.

## Stack

- **Backend**: Java 21, Spring Boot 3 (Web, Data JPA, Security, Mail), PostgreSQL, JWT (jjwt), Maven.
- **Frontend**: React + TypeScript + Vite, TanStack Query, React Router, Axios, Tailwind CSS v4 + shadcn/ui.
- **Infra**: Docker Compose (db, backend, frontend, mailpit).
- **Testes**: JUnit + Mockito + Testcontainers (backend), Vitest + Testing Library (frontend).

## Estrutura do repositório

```
backend/    # API REST em Spring Boot
frontend/   # SPA em React + TypeScript
docker-compose.yml
```

## Rodando localmente

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Mailpit (visualização de e-mails): http://localhost:8025

## Desenvolvimento

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## UI: Tailwind e shadcn/ui

O frontend usa **Tailwind CSS v4** (plugin `@tailwindcss/vite`, sem `tailwind.config`) e **shadcn/ui**.

- O Tailwind é carregado por `@import "tailwindcss"` no topo de `frontend/src/index.css`. Ele inclui um reset de CSS (preflight) que pode alterar o visual de estilos antigos.
- Alias `@/` aponta para `frontend/src` (configurado em `vite.config.ts`, `tsconfig.json` e `tsconfig.app.json`). O `baseUrl` não é usado porque o TypeScript 6 o rejeita.
- `frontend/components.json` é a configuração do shadcn. Os componentes ficam em `src/components/ui/` (hoje só o `button`) e o helper `cn()` em `src/lib/utils.ts`. As variáveis de tema foram adicionadas ao `index.css`.
- Adicionar componentes:

```bash
cd frontend
npx shadcn@latest add dialog
```

### Shadcn MCP (Claude Code)

`frontend/.mcp.json` registra o servidor MCP do shadcn (`npx shadcn@latest mcp`), que permite ao Claude Code buscar e instalar componentes. Vale apenas para sessões abertas em `frontend/`; para valer no projeto todo, mova o arquivo para a raiz. Foi criado com:

```bash
cd frontend
npx shadcn@latest mcp init --client claude
```
