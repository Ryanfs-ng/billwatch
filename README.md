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

## Produção atrás de proxy

O rate limit (`@LimiteTentativas`) separa as tentativas por IP. Atrás de um proxy reverso ou balanceador, o backend enxerga o IP do proxy para todo mundo, e o limite vira global: poucas tentativas de qualquer pessoa bloqueiam o login de todos.

Para corrigir, defina `FORWARD_HEADERS_STRATEGY=native`. O Tomcat passa a usar o IP do cabeçalho `X-Forwarded-For`, mas só quando a requisição chega de um proxy da rede privada (10.x, 172.16–31.x, 192.168.x, 127.x); de qualquer outro endereço o cabeçalho é ignorado.

Ligue apenas quando:

- existe um proxy na frente que preenche o `X-Forwarded-For`;
- a porta do backend **não** está exposta diretamente para os clientes.

Com o backend exposto (como no `docker-compose.yml` local, que publica a porta 8080), um cliente poderia enviar o próprio `X-Forwarded-For` e ganhar um IP novo a cada requisição, burlando o limite. Se o proxy não estiver numa rede privada, informe os IPs dele em `SERVER_TOMCAT_REMOTEIP_INTERNALPROXIES` (expressão regular).

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
