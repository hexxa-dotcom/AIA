# AIA

Gerenciador de tarefas gamificado com Kanban, rotina diária, timer e calendário. Construído com Next.js 15 + Tailwind CSS v4 + Zustand.

## Funcionalidades

- **Kanban com drag-and-drop** — 4 colunas (Backlog / Hoje / Em andamento / Concluído), reordenação e movimentação fluida
- **Tarefas com subtarefas** — quebra a tarefa em partes, checklist com barra de progresso visual
- **Gamificação** — XP por subtarefa/tarefa concluída, sistema de nível, streak diário, badges, confete ao completar
- **Timer/cronômetro** — play/pause/stop por tarefa, somatório de tempo focado por tarefa
- **Rotina do dia** — timeline horária com blocos fixos (acordar, almoço, foco) recorrentes diários/semanais
- **Calendário mensal** — visão de tarefas com prazo
- **Conquistas** — galeria de badges com histórico de XP
- **Persistência local** — todos os dados ficam no navegador via localStorage (zero setup)

## Como rodar

```bash
cd aia-tasks
npm install
npm run dev
```

Abra http://localhost:3000.

Dados de exemplo são carregados na primeira abertura para você ver tudo funcionando.

## Roadmap de ativação (opcionais)

Tudo abaixo é opcional — o sistema já funciona 100% sem nenhum desses. Cada um adiciona uma capacidade.

### ☁️ Supabase (sync entre dispositivos + multi-usuário)

1. Crie conta gratuita em https://supabase.com
2. Crie um novo projeto
3. Vá em SQL Editor e cole o conteúdo de `supabase/schema.sql`
4. Copie `Project URL` + `anon key` em Settings → API
5. Crie `.env.local` baseado em `.env.example`:
   ```
   NEXT_PUBLIC_PERSISTENCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
6. `npm install @supabase/supabase-js`
7. Substitua o stub em `src/lib/adapters/supabase.ts` por chamadas reais
8. Reinicie o dev server

### 📧 Resend (email de vencimento e atribuição)

1. Crie conta em https://resend.com
2. Verifique um domínio (ou use o sandbox para testes)
3. Gere uma API key
4. Coloque em `.env.local`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=tarefas@seudominio.com
   ```
5. `npm install resend`
6. Descomente a integração em `src/app/api/email/send/route.ts`
7. Configure cron (Vercel Cron, GitHub Actions ou similar) para chamar `/api/cron/due` periodicamente

### 📅 Google Calendar (sync bidirecional)

1. Acesse https://console.cloud.google.com
2. Crie um projeto
3. Habilite a Google Calendar API
4. Crie OAuth Client ID (tipo Web Application)
5. Adicione redirect: `http://localhost:3000/api/google/callback`
6. Coloque no `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
7. Faça login em Ajustes → Google Calendar e autorize

## Stack

- **Next.js 15** com App Router + Turbopack
- **TypeScript** estrito
- **Tailwind CSS v4** com tema customizado (paleta HEXX sage/lime/ink)
- **Zustand** com middleware persist (localStorage)
- **@dnd-kit** para drag-and-drop
- **Framer Motion** para animações
- **Radix UI** para Dialog acessível
- **canvas-confetti** para celebrações visuais
- **Lucide** para ícones

## Estrutura

```
aia-tasks/
├── src/
│   ├── app/                # Páginas (Next App Router)
│   │   ├── page.tsx        # Kanban
│   │   ├── rotina/         # Timeline horária
│   │   ├── calendario/     # Visão mensal
│   │   ├── conquistas/     # Badges e XP
│   │   ├── ajustes/        # Integrações
│   │   └── api/            # Routes serverless
│   ├── components/
│   │   ├── kanban/         # Board, Column, TaskCard
│   │   ├── task/           # Modal, Timer, Subtasks
│   │   ├── routine/        # Timeline e editor
│   │   ├── gamification/   # XPBar, Confetti
│   │   ├── layout/         # Sidebar, Topbar, AppShell
│   │   └── ui/             # Botões, Dialog, Input
│   ├── store/              # Zustand stores
│   └── lib/
│       ├── types.ts        # Tipos TypeScript
│       ├── xp.ts           # Regras de gamificação
│       ├── seed.ts         # Dados iniciais
│       └── adapters/       # localStorage / Supabase
└── supabase/
    └── schema.sql          # Schema pronto para Postgres
```

## Atalhos no Kanban

- Clique no `+` em qualquer coluna para criar tarefa rápida
- Arraste tarefas entre colunas
- Hover na tarefa → botão `▶` inicia o timer instantaneamente
- Clique na tarefa para abrir o detalhe com subtarefas, timer e propriedades
- Enter cria; Escape cancela
