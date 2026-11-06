# BillWatch

Gestão de boletos para uso familiar: cadastre as contas da casa, anexe o boleto, acompanhe vencimentos e receba avisos por e-mail antes de vencer.

## Funcionalidades

- **Contas**: cadastro com confirmação por e-mail, login com senha ou com Google, redefinição de senha, troca de e-mail confirmada pelo novo endereço.
- **Boletos**: cadastro com anexo (PDF, JPG ou PNG) e pré-visualização, responsável, marcar como pago, busca e filtros por status e vencimento.
- **Boletos recorrentes**: o boleto do mês seguinte é criado automaticamente; edições podem ser aplicadas aos próximos meses.
- **Grupo familiar**: código de convite para dividir as contas da casa; abas "Meus" e "Todos".
- **Dashboard**: totais em aberto e pagos, gráfico mensal por situação e próximos vencimentos.
- **Calendário** mensal com os vencimentos.
- **Avisos**: sino com atrasados e a vencer; e-mail diário de vencimento e resumo semanal (configuráveis por usuário).
- **Segurança**: JWT, rate limit por IP e por conta, sessões encerradas ao trocar senha ou e-mail.

## Stack

- **Backend**: Java 21, Spring Boot 3 (Web, Data JPA, Security, Mail, OAuth2 JOSE), PostgreSQL, Flyway, JWT (jjwt), Bucket4j, Maven.
- **Frontend**: React 19 + TypeScript + Vite, TanStack Query, React Router, Tailwind CSS v4, shadcn/ui, Base UI, Motion.
- **Testes**: JUnit + Mockito (backend), Vitest + Testing Library (frontend).

```
backend/    # API REST em Spring Boot
frontend/   # SPA em React + TypeScript
docker-compose.yml
```

---

## Rodando localmente

### Com Docker Compose

```bash
cp .env.example .env   # preencha POSTGRES_PASSWORD e JWT_SECRET
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Mailpit (caixa de e-mails de teste): http://localhost:8025

### Sem Docker

1. **PostgreSQL** rodando localmente (padrão: porta `5434`, banco `billwatch`). O Flyway cria o schema `billwatch` e as tabelas ao subir o backend.
2. **Mailpit**, para receber os e-mails de confirmação e aviso: baixe o executável em https://github.com/axllent/mailpit/releases e rode-o. SMTP em `localhost:1025`, caixa em http://localhost:8025. Sem ele, cadastro e troca de e-mail falham.
3. **Backend** (defina ao menos `JWT_SECRET` e `DB_PASSWORD`):

   ```bash
   cd backend
   mvn spring-boot:run
   ```

4. **Frontend** em http://localhost:5173:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Testes

```bash
cd frontend && npx tsc -b && npx vitest run
```

```bash
cd backend && mvn test
```

`BillwatchApplicationTests` sobe o contexto completo e precisa de um PostgreSQL acessível.

Testes end-to-end (Playwright, usando o Chrome instalado). Eles geram um build de produção do frontend, servem na porta 5180 e simulam a API, então não precisam do backend. Cobrem login, cadastro e confirmação de e-mail, o ciclo de um boleto (criar, editar, pagar, excluir), filtros e navegação:

```bash
cd frontend && npm run test:e2e
```

O relatório HTML fica em `frontend/playwright-report/` (`npx playwright show-report`).

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push na `main` e em pull requests: testes do backend com um PostgreSQL de serviço, e lint, build, Vitest e Playwright no frontend.

---

## Variáveis de ambiente

### Backend

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `JWT_SECRET` | sim | — | Chave HS256 em base64. Gere com `openssl rand -base64 48` |
| `DB_URL` | não | `jdbc:postgresql://DB_HOST:DB_PORT/billwatch?currentSchema=billwatch` | URL JDBC completa; quando definida, substitui `DB_HOST`/`DB_PORT` |
| `DB_HOST` / `DB_PORT` | não | `localhost` / `5434` | Endereço do PostgreSQL |
| `DB_USER` / `DB_PASSWORD` | `DB_PASSWORD` sim | `postgres` / — | Credenciais do banco |
| `PORT` | não | `8080` | Porta HTTP (as hospedagens costumam injetar) |
| `APP_URL_FRONTEND` | em produção | `http://localhost:5173` | Endereço público do frontend, usado nos links dos e-mails |
| `CORS_ORIGINS` | em produção | `http://localhost:5173,http://localhost:3000` | Origens liberadas no CORS, separadas por vírgula |
| `MAIL_HOST` / `MAIL_PORT` | em produção | `localhost` / `1025` | Servidor SMTP |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | em produção | vazio | Login do SMTP |
| `MAIL_SMTP_AUTH` / `MAIL_STARTTLS` | em produção | `false` / `false` | Autenticação e TLS do SMTP |
| `MAIL_FROM` | em produção | `BillWatch <nao-responda@billwatch.local>` | Remetente dos e-mails |
| `GOOGLE_CLIENT_ID` | não | vazio | Client ID do login com Google; vazio desliga |
| `FORWARD_HEADERS_STRATEGY` | não | `none` | Use `native` atrás de proxy (veja abaixo) |
| `BOLETOS_AVISO_CRON` / `BOLETOS_RESUMO_CRON` / `BOLETOS_RECORRENCIA_CRON` | não | 8h diário / 8h segunda / 6h diário | Horários dos jobs (fuso de São Paulo) |

### Frontend (lidas no build)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Endereço do backend |
| `VITE_GOOGLE_CLIENT_ID` | vazio | Mesmo Client ID do backend; vazio esconde o botão do Google |

Em desenvolvimento, coloque as variáveis do frontend em `frontend/.env.local` (ignorado pelo git).

---

## Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e configure a **tela de consentimento OAuth** (tipo Externo). Enquanto estiver em modo de teste, só os e-mails cadastrados em "Usuários de teste" conseguem entrar.
2. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, escolha **Aplicativo da Web** e adicione em **Origens JavaScript autorizadas** os endereços do frontend (`http://localhost:5173`, `http://localhost` e o domínio de produção). Não é preciso URI de redirecionamento nem client secret.
3. Use o ID gerado em `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend).

O backend valida o ID token do Google (assinatura, emissor, `aud` e expiração) e só aceita e-mails verificados pelo Google.

---

## Deploy

Arquitetura gratuita:

| Parte | Onde | Observação |
|---|---|---|
| Frontend | **Vercel** | Site estático do Vite; `frontend/vercel.json` redireciona as rotas para o `index.html` |
| Backend | **Render** (free web service, Docker) | Dorme após 15 min sem tráfego; um ping externo o mantém acordado |
| PostgreSQL | **Neon** (plano Free) | 1 GB por projeto; os anexos e fotos de perfil também ficam no banco (tabela `arquivos`) |
| E-mail | **Brevo** (SMTP na porta **2525**) | O Render grátis bloqueia as portas SMTP 25, 465 e 587 |
| Ping | **cron-job.org** (grátis) | Chama `/saude` a cada 10 min para o backend não dormir e os jobs agendados rodarem |

Por que não o Vercel para o backend: ele roda funções serverless de curta duração, sem processo contínuo para os jobs agendados.

### 1. Banco (Neon)

1. Crie um projeto em https://neon.tech (região mais próxima, ex.: São Paulo se disponível).
2. Em **Connect**, copie a connection string **direta** (sem `-pooler` no host), no formato `postgresql://usuario:senha@host/banco?sslmode=require`.
3. Converta para as variáveis do backend:

   ```
   DB_URL=jdbc:postgresql://<host>/<banco>?sslmode=require&currentSchema=billwatch
   DB_USER=<usuario>
   DB_PASSWORD=<senha>
   ```

   O Flyway cria o schema `billwatch` e as tabelas no primeiro deploy.

O plano Free do Neon tem 100 horas de computação por mês e suspende o banco quando ninguém o usa. Por isso o ping do item 4 chama `/saude`, que **não consulta o banco**: o backend fica acordado sem gastar a cota do Neon.

### 2. Backend (Render)

1. Em https://render.com, **New → Web Service**, conecte o repositório e escolha:
   - **Root Directory**: `backend`
   - **Language/Runtime**: Docker (o `Dockerfile` é detectado)
   - **Instance Type**: Free
   - **Health Check Path**: `/saude`
2. Variáveis de ambiente (além das do Neon):

   ```
   JWT_SECRET=<openssl rand -base64 48>
   APP_URL_FRONTEND=https://<seu-app>.vercel.app
   CORS_ORIGINS=https://<seu-app>.vercel.app
   GOOGLE_CLIENT_ID=<client id>
   FORWARD_HEADERS_STRATEGY=native
   ```

   O Render injeta `PORT`, que o backend já usa. O `Dockerfile` limita a memória da JVM (`JAVA_TOOL_OPTIONS`) para caber nos 512 MB do plano grátis.
3. O endereço do serviço (`https://<nome>.onrender.com`) será o `VITE_API_URL` do frontend.

### 3. E-mail (Brevo)

1. Crie a conta e, em **Senders, Domains & Dedicated IPs**, verifique o remetente. Com um domínio próprio, verifique o domínio (registros DKIM e SPF no DNS): os e-mails têm muito menos chance de cair no spam.
2. Em **SMTP & API → SMTP**, gere uma **SMTP key**.
3. Variáveis do backend:

   ```
   MAIL_HOST=smtp-relay.brevo.com
   MAIL_PORT=2525
   MAIL_USERNAME=<login SMTP exibido no Brevo>
   MAIL_PASSWORD=<SMTP key>
   MAIL_SMTP_AUTH=true
   MAIL_STARTTLS=true
   MAIL_FROM=BillWatch <remetente-verificado@seudominio.com>
   ```

   Use a porta **2525**: o Render grátis bloqueia 25, 465 e 587. O endereço de `MAIL_FROM` precisa ser um remetente ou domínio verificado no Brevo.

### 4. Ping (cron-job.org)

1. Crie uma conta em https://cron-job.org.
2. Novo cron job: URL `https://<nome>.onrender.com/saude`, a cada **10 minutos**.

As 750 horas grátis por mês do Render cobrem um serviço ligado o mês inteiro. Sem o ping, o backend dorme e os e-mails de aviso (8h) e a geração de recorrentes (6h) só acontecem quando alguém abre o app.

### 5. Frontend (Vercel)

1. Importe o repositório com **Root Directory** `frontend` (o Vercel detecta o Vite: build `npm run build`, saída `dist`).
2. Variáveis de ambiente:

   ```
   VITE_API_URL=https://<nome>.onrender.com
   VITE_GOOGLE_CLIENT_ID=<client id>
   ```

3. Depois do primeiro deploy, confira se `APP_URL_FRONTEND` e `CORS_ORIGINS` no Render batem com o domínio final do Vercel. Os deploys de *preview* do Vercel usam outros domínios e ficam bloqueados pelo CORS, a menos que sejam incluídos em `CORS_ORIGINS`.
4. Adicione o domínio do Vercel nas **Origens JavaScript autorizadas** do Google.

### Checklist pós-deploy

- [ ] `https://<nome>.onrender.com/saude` responde `ok`.
- [ ] Logs do Render mostram o Flyway aplicando as migrations no Neon.
- [ ] Cadastro envia o e-mail de confirmação pelo Brevo e o link abre o frontend.
- [ ] Login com senha e com Google.
- [ ] Anexo enviado continua abrindo depois de um novo deploy do backend.
- [ ] Links diretos (ex.: `/boletos`) abrem sem 404 no Vercel.

### Produção atrás de proxy

O rate limit separa as tentativas por IP. Atrás de um proxy reverso ou balanceador (caso do Render), o backend enxerga o IP do proxy para todo mundo, e o limite vira global: poucas tentativas de qualquer pessoa bloqueiam o login de todos.

Para corrigir, defina `FORWARD_HEADERS_STRATEGY=native`. O Tomcat passa a usar o IP do cabeçalho `X-Forwarded-For`, mas só quando a requisição chega de um proxy da rede privada (10.x, 172.16–31.x, 192.168.x, 127.x); de qualquer outro endereço o cabeçalho é ignorado.

Ligue apenas quando:

- existe um proxy na frente que preenche o `X-Forwarded-For`;
- a porta do backend **não** está exposta diretamente para os clientes.

Com o backend exposto (como no `docker-compose.yml` local, que publica a porta 8080), um cliente poderia enviar o próprio `X-Forwarded-For` e ganhar um IP novo a cada requisição, burlando o limite. Se o proxy não estiver numa rede privada, informe os IPs dele em `SERVER_TOMCAT_REMOTEIP_INTERNALPROXIES` (expressão regular).

O rate limit fica em memória: vale para **uma instância** do backend. Para rodar várias instâncias, troque o armazenamento por Redis.

---

## UI: Tailwind e shadcn/ui

O frontend usa **Tailwind CSS v4** (plugin `@tailwindcss/vite`, sem `tailwind.config`) e **shadcn/ui**.

- O Tailwind é carregado por `@import "tailwindcss"` em `frontend/src/index.css`, junto dos tokens de cor do tema claro e escuro.
- Alias `@/` aponta para `frontend/src` (configurado em `vite.config.ts`, `tsconfig.json` e `tsconfig.app.json`).
- `frontend/components.json` configura o shadcn e os registries extras (`@animate-ui`, `@cult-ui`). Componentes base ficam em `src/components/ui/`; os do app, em `src/components/`.
- Popovers e selects usados dentro do `Modal` (que é um `<dialog>` nativo) precisam do contexto `PortalDoModal` para abrir por cima dele.

```bash
cd frontend
npx shadcn@latest add dialog
```
