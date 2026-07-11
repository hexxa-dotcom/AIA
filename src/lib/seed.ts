import { genId as nanoid } from "@/lib/id";
import type { Board, RoutineBlock, Task } from "./types";

export function makeSeedData(): {
  board: Board;
  tasks: Task[];
  routines: RoutineBlock[];
} {
  const now = Date.now();
  const boardId = nanoid();
  const board: Board = {
    id: boardId,
    name: "Meu dia",
    emoji: "",
    createdAt: now,
  };

  const tasks: Task[] = [
    {
      id: nanoid(),
      boardId,
      column: "today",
      order: 0,
      title: "Configurar o AIA OS",
      description: "Personalizar colunas e criar primeiras tarefas reais",
      priority: "medium",
      dueDate: now + 1000 * 60 * 60 * 24,
      tags: ["setup"],
      subtasks: [
        {
          id: nanoid(),
          title: "Explorar o Kanban",
          done: true,
          createdAt: now,
          doneAt: now,
        },
        {
          id: nanoid(),
          title: "Criar 3 tarefas reais",
          done: false,
          createdAt: now,
        },
        {
          id: nanoid(),
          title: "Definir minha rotina",
          done: false,
          createdAt: now,
        },
      ],
      assignees: [],
      createdAt: now,
      updatedAt: now,
      totalTimeSec: 0,
    },
    {
      id: nanoid(),
      boardId,
      column: "backlog",
      order: 0,
      title: "Planejar a semana",
      description: "Listar metas semanais e dividir em tarefas diárias",
      priority: "high",
      tags: ["planejamento"],
      subtasks: [],
      assignees: [],
      createdAt: now,
      updatedAt: now,
      totalTimeSec: 0,
    },
    {
      id: nanoid(),
      boardId,
      column: "doing",
      order: 0,
      title: "Revisar pipeline de clientes",
      description: "Olhar entradas do mês e priorizar follow-ups",
      priority: "urgent",
      dueDate: now + 1000 * 60 * 60 * 6,
      tags: ["trabalho"],
      subtasks: [
        {
          id: nanoid(),
          title: "Listar contratos pendentes",
          done: false,
          createdAt: now,
        },
        {
          id: nanoid(),
          title: "Enviar emails de retomada",
          done: false,
          createdAt: now,
        },
      ],
      assignees: [],
      createdAt: now,
      updatedAt: now,
      totalTimeSec: 1800,
    },
    {
      id: nanoid(),
      boardId,
      column: "done",
      order: 0,
      title: "Anotações da reunião de segunda",
      description: "Síntese do que foi discutido",
      priority: "low",
      tags: [],
      subtasks: [
        {
          id: nanoid(),
          title: "Rascunhar tópicos",
          done: true,
          createdAt: now,
          doneAt: now,
        },
        {
          id: nanoid(),
          title: "Compartilhar com time",
          done: true,
          createdAt: now,
          doneAt: now,
        },
      ],
      assignees: [],
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      totalTimeSec: 900,
    },
  ];

  const routines: RoutineBlock[] = [
    {
      id: nanoid(),
      title: "Acordar e alongar",
      emoji: "",
      startMinute: 6 * 60,
      endMinute: 6 * 60 + 30,
      recurrence: "daily",
      color: "#4a4a48",
      isFlexible: false,
    },
    {
      id: nanoid(),
      title: "Foco profundo",
      emoji: "",
      startMinute: 8 * 60,
      endMinute: 11 * 60,
      recurrence: "weekdays",
      color: "#f5f5f3",
      isFlexible: false,
    },
    {
      id: nanoid(),
      title: "Almoço",
      emoji: "",
      startMinute: 12 * 60,
      endMinute: 13 * 60,
      recurrence: "daily",
      color: "#d6d6d2",
      isFlexible: false,
    },
    {
      id: nanoid(),
      title: "Reuniões e e-mails",
      emoji: "",
      startMinute: 14 * 60,
      endMinute: 16 * 60,
      recurrence: "weekdays",
      color: "#8c8c88",
      isFlexible: true,
    },
    {
      id: nanoid(),
      title: "Exercício",
      emoji: "",
      startMinute: 18 * 60,
      endMinute: 19 * 60,
      recurrence: "weekdays",
      color: "#1a1a1a",
      isFlexible: false,
    },
    {
      id: nanoid(),
      title: "Wind down",
      emoji: "",
      startMinute: 22 * 60,
      endMinute: 23 * 60,
      recurrence: "daily",
      color: "#6e6e6a",
      isFlexible: false,
    },
  ];

  return { board, tasks, routines };
}
