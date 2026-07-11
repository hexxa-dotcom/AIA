"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
}

export interface CanvasStroke {
  id: string;
  pts: number[];
  color: string;
  w: number;
}

interface CanvasState {
  nodes: CanvasNode[];
  strokes: CanvasStroke[];
  addNode: (node: Omit<CanvasNode, "id">) => string;
  updateNode: (id: string, patch: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  addStroke: (stroke: Omit<CanvasStroke, "id">) => void;
  clearAll: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      nodes: [],
      strokes: [],

      addNode: (node) => {
        const id = nanoid();
        set((s) => ({ nodes: [...s.nodes, { ...node, id }] }));
        return id;
      },

      updateNode: (id, patch) =>
        set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

      deleteNode: (id) =>
        set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),

      addStroke: (stroke) =>
        set((s) => ({ strokes: [...s.strokes, { ...stroke, id: nanoid() }] })),

      clearAll: () => set({ nodes: [], strokes: [] }),
    }),
    { name: "aia-canvas" },
  ),
);
