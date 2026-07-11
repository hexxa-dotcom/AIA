import { useTaskStore } from "@/store/useTaskStore";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useStudiesStore } from "@/store/useStudiesStore";

export const NATIVE_TOOLS = [
  {
    name: "create_task",
    description: "Cria uma nova tarefa no quadro do usuário. Retorna o ID da tarefa criada.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "O título da tarefa." },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "A prioridade da tarefa." },
      },
      required: ["title"],
    },
  },
  {
    name: "create_appointment",
    description: "Cria um novo compromisso na agenda do usuário.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título do compromisso." },
        date: { type: "number", description: "Timestamp (em milissegundos) da data/hora de início do compromisso." },
        type: { type: "string", enum: ["reuniao", "pessoal", "saude", "outro"], description: "O tipo de compromisso." },
        description: { type: "string", description: "Uma descrição opcional." },
      },
      required: ["title", "date", "type"],
    },
  },
  {
    name: "create_expense",
    description: "Cria uma despesa nas finanças do usuário.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome da despesa (ex: Conta de Luz)." },
        amount: { type: "number", description: "Valor em Reais (R$)." },
        dueDay: { type: "number", description: "Dia do vencimento (1 a 31)." },
        category: { type: "string", enum: ["personal", "casa", "familia"], description: "Categoria da despesa." },
        group: { type: "string", description: "Grupo ou tag para a despesa (ex: Moradia)." },
        tipo: { type: "string", enum: ["recorrente", "parcela", "unico"], description: "Se é uma despesa recorrente mensal, parcelada ou de pagamento único." },
        isCartao: { type: "boolean", description: "Se foi pago com cartão de crédito." },
      },
      required: ["name", "amount", "dueDay", "category", "group", "tipo", "isCartao"],
    },
  },
  {
    name: "add_study_item",
    description: "Adiciona um item de estudo (livro ou curso) na trilha de estudos do usuário.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título do livro ou curso." },
        type: { type: "string", enum: ["book", "course"], description: "Tipo de material de estudo." },
        authorOrProvider: { type: "string", description: "Autor (para livros) ou provedor/plataforma (para cursos)." },
        totalProgress: { type: "number", description: "Quantidade total de páginas ou aulas." },
      },
      required: ["title", "type", "totalProgress"],
    },
  }
];

export async function executeNativeTool(name: string, args: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case "create_task": {
        const id = useTaskStore.getState().createTask({
          title: args.title,
          priority: args.priority || "medium",
        });
        return `Tarefa criada com sucesso! ID: ${id}`;
      }
      
      case "create_appointment": {
        useAgendaStore.getState().add({
          title: args.title,
          date: Number(args.date),
          type: args.type,
          description: args.description || "",
        });
        return "Compromisso adicionado à agenda com sucesso!";
      }

      case "create_expense": {
        useFinanceStore.getState().add({
          name: args.name,
          amount: Number(args.amount),
          dueDay: Number(args.dueDay),
          category: args.category,
          group: args.group,
          tipo: args.tipo,
          isCartao: Boolean(args.isCartao),
          isActive: true,
        });
        return "Despesa registrada com sucesso!";
      }

      case "add_study_item": {
        useStudiesStore.getState().addItem({
          title: args.title,
          type: args.type,
          authorOrProvider: args.authorOrProvider,
          totalProgress: Number(args.totalProgress),
          currentProgress: 0,
          status: "to_do",
        });
        return "Item de estudo adicionado com sucesso!";
      }

      default:
        return `Erro: Ferramenta nativa "${name}" não implementada.`;
    }
  } catch (err: any) {
    return `Erro ao executar a ferramenta nativa ${name}: ${err.message}`;
  }
}
