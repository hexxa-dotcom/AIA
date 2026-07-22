"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

import { motion } from "framer-motion";

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function SortableWidget({ id, children, className = "", index = 0 }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className} ${isDragging ? "shadow-2xl scale-[1.02]" : ""}`}
    >
      {/* Drag Handle - aparece no hover do card */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-50 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-surface-2/80 hover:bg-surface-2 backdrop-blur-md rounded-xl text-muted hover:text-ink shadow-sm"
        title="Arraste para reordenar"
      >
        <GripHorizontal size={14} />
      </div>
      
      {/* Widget Content Animado */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.2, 1, 0.2, 1] }}
        className={`h-full ${isDragging ? "pointer-events-none" : ""}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
