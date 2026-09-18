# Billwatch

Sistema de gestão de boletos para uso familiar: cadastro manual de boletos (com anexo de foto/PDF), dashboard com agregados de vencimento e notificação por e-mail quando um boleto está próximo do vencimento.

> Status: estrutura inicial do projeto. Regras de negócio, autenticação e telas ainda serão implementadas.

## Stack

- **Backend**: Java 21, Spring Boot 3 (Web, Data JPA, Security, Mail), PostgreSQL, JWT (jjwt), Maven.
- **Frontend**: React + TypeScript + Vite, TanStack Query, React Router, Axios.
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
