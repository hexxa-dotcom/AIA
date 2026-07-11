import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadState } from "@/lib/mcp-state";

function createServer() {
  const server = new Server(
    { name: "hexxa", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_tasks",
        description:
          "Lista todas as tarefas do AIA OS com status, prioridade e prazo.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["all", "pending", "done", "overdue"],
              description: "Filtrar por status (padrão: all)",
            },
          },
        },
      },
      {
        name: "get_expenses",
        description:
          "Lista as despesas recorrentes do mês atual com valores e status de pagamento.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["all", "personal", "casa", "familia"],
              description: "Filtrar por categoria (padrão: all)",
            },
          },
        },
      },
      {
        name: "get_summary",
        description:
          "Retorna um resumo completo: tarefas pendentes/vencidas, total de despesas e progresso de gamificação.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_overdue_tasks",
        description:
          "Lista apenas as tarefas vencidas (prazo expirado e não concluídas).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_unpaid_expenses",
        description: "Lista as despesas do mês ainda não pagas.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const state = loadState();

    if (!state) {
      return {
        content: [
          {
            type: "text",
            text: "Nenhum dado sincronizado ainda. Abra o AIA OS no navegador para que os dados sejam enviados automaticamente.",
          },
        ],
      };
    }

    const now = new Date();
    const { name, arguments: args } = req.params;

    if (name === "get_tasks") {
      const filter = (args as any)?.status ?? "all";
      let tasks = state.tasks;

      if (filter === "pending") tasks = tasks.filter((t) => !t.completedAt);
      else if (filter === "done") tasks = tasks.filter((t) => !!t.completedAt);
      else if (filter === "overdue")
        tasks = tasks.filter(
          (t) => !t.completedAt && t.dueDate && t.dueDate < now.getTime(),
        );

      const text =
        tasks.length === 0
          ? "Nenhuma tarefa encontrada."
          : tasks
              .map((t) => {
                const due = t.dueDate
                  ? new Date(t.dueDate).toLocaleDateString("pt-BR")
                  : null;
                const overdue =
                  !t.completedAt && t.dueDate && t.dueDate < now.getTime();
                return `• [${t.status}] ${t.title} — prioridade: ${t.priority}${due ? ` | prazo: ${due}${overdue ? " — VENCIDA" : ""}` : ""}${t.tags?.length ? ` | tags: ${t.tags.join(", ")}` : ""}`;
              })
              .join("\n");

      return {
        content: [
          { type: "text", text: `Tarefas (${tasks.length}):\n\n${text}` },
        ],
      };
    }

    if (name === "get_expenses") {
      const cat = (args as any)?.category ?? "all";
      let expenses = state.expenses;
      if (cat !== "all") expenses = expenses.filter((e) => e.category === cat);

      const fmt = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const total = expenses.reduce((a, e) => a + e.amount, 0);
      const paid = expenses
        .filter((e) => e.paidThisMonth)
        .reduce((a, e) => a + e.amount, 0);

      const text = expenses
        .map(
          (e) =>
            `• ${e.paidThisMonth ? "[pago]" : "[pendente]"} ${e.name} — ${fmt(e.amount)} | dia ${e.dueDay} | ${e.category}${e.isCartao ? ` (cartão ${e.cartaoNome})` : ""}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Despesas (${expenses.length}): Total ${fmt(total)} | Pago ${fmt(paid)} | Pendente ${fmt(total - paid)}\n\n${text || "Nenhuma despesa."}`,
          },
        ],
      };
    }

    if (name === "get_summary") {
      const tasks = state.tasks;
      const pending = tasks.filter((t) => !t.completedAt).length;
      const done = tasks.filter((t) => !!t.completedAt).length;
      const overdue = tasks.filter(
        (t) => !t.completedAt && t.dueDate && t.dueDate < now.getTime(),
      ).length;

      const expenses = state.expenses;
      const fmt = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
      const paidExp = expenses
        .filter((e) => e.paidThisMonth)
        .reduce((a, e) => a + e.amount, 0);
      const unpaid = expenses.filter((e) => !e.paidThisMonth).length;

      const g = state.game;

      return {
        content: [
          {
            type: "text",
            text: `Resumo AIA OS — ${now.toLocaleDateString("pt-BR")}

 TAREFAS
• Pendentes: ${pending} | Concluídas: ${done} | Vencidas: ${overdue}

 FINANÇAS (${now.toLocaleString("pt-BR", { month: "long" })})
• Total: ${fmt(totalExp)} | Pago: ${fmt(paidExp)} | Pendente: ${fmt(totalExp - paidExp)}
• Contas não pagas: ${unpaid}

 GAMIFICAÇÃO
• Nível ${g.level} | ${g.xp} XP | Streak: ${g.streakDays} dias | Hoje: +${g.todayXp} XP

 Sincronizado em: ${state.syncedAt}`,
          },
        ],
      };
    }

    if (name === "get_overdue_tasks") {
      const overdue = state.tasks.filter(
        (t) => !t.completedAt && t.dueDate && t.dueDate < now.getTime(),
      );
      if (overdue.length === 0)
        return { content: [{ type: "text", text: "Nenhuma tarefa vencida." }] };

      const text = overdue
        .map(
          (t) =>
            `• ${t.title} — venceu em ${new Date(t.dueDate!).toLocaleDateString("pt-BR")} | prioridade: ${t.priority}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Tarefas vencidas (${overdue.length}):\n\n${text}`,
          },
        ],
      };
    }

    if (name === "get_unpaid_expenses") {
      const unpaid = state.expenses.filter((e) => !e.paidThisMonth);
      if (unpaid.length === 0)
        return {
          content: [
            { type: "text", text: "Todas as despesas do mês estão pagas!" },
          ],
        };

      const fmt = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const total = unpaid.reduce((a, e) => a + e.amount, 0);
      const text = unpaid
        .sort((a, b) => a.dueDay - b.dueDay)
        .map(
          (e) =>
            `• ${e.name} — ${fmt(e.amount)} | dia ${e.dueDay}${e.isCartao ? ` (cartão ${e.cartaoNome})` : ""}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Despesas não pagas: ${fmt(total)} total\n\n${text}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Ferramenta desconhecida: ${name}` }],
    };
  });

  return server;
}

export async function POST(req: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function DELETE(req: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}
