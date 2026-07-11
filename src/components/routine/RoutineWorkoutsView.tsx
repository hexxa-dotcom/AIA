"use client";
import { useState } from "react";
import { useWorkoutStore, WorkoutPlan, Exercise } from "@/store/useWorkoutStore";
import { Plus, Dumbbell, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { genId } from "@/lib/id";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/Dialog";

export function RoutineWorkoutsView() {
  const plans = useWorkoutStore((s) => s.plans);
  const addPlan = useWorkoutStore((s) => s.addPlan);
  const updatePlan = useWorkoutStore((s) => s.updatePlan);
  const deletePlan = useWorkoutStore((s) => s.deletePlan);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Workout State
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  function handleAddPlan() {
    if (!newPlanName.trim()) return;
    addPlan({ title: newPlanName.trim() });
    setNewPlanName("");
    setIsAddingPlan(false);
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-bold text-lg">Seus Treinos</h2>
          <p className="text-xs text-muted">Gerencie seus treinos e exercícios</p>
        </div>
        <Button onClick={() => setIsAddingPlan(true)}>
          <Plus size={14} /> Novo Treino
        </Button>
      </div>

      {isAddingPlan && (
        <div className="p-4 bg-surface-2 rounded-2xl border border-ink/10 flex gap-2 mb-4">
          <Input 
            autoFocus
            value={newPlanName} 
            onChange={e => setNewPlanName(e.target.value)} 
            placeholder="Ex: Treino A - Peito e Tríceps" 
            className="flex-1"
          />
          <Button variant="light" onClick={() => setIsAddingPlan(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleAddPlan}>Salvar</Button>
        </div>
      )}

      {plans.length === 0 && !isAddingPlan ? (
        <div className="py-12 text-center bg-surface-2 rounded-3xl border border-dashed border-ink/20">
          <Dumbbell size={32} className="mx-auto text-ink/20 mb-3" />
          <p className="text-sm font-semibold text-muted">Nenhum treino cadastrado</p>
          <p className="text-xs text-ink/40 mt-1">Crie seu primeiro treino para adicionar exercícios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <WorkoutCard 
              key={plan.id} 
              plan={plan} 
              isExpanded={expandedId === plan.id}
              onToggle={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
              onUpdate={updatePlan}
              onDelete={deletePlan}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutCard({ 
  plan, 
  isExpanded, 
  onToggle, 
  onUpdate, 
  onDelete 
}: { 
  plan: WorkoutPlan; 
  isExpanded: boolean; 
  onToggle: () => void;
  onUpdate: (id: string, p: Partial<WorkoutPlan>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditingEx, setIsEditingEx] = useState<Exercise | null>(null);
  const [isAddingEx, setIsAddingEx] = useState(false);
  const [exForm, setExForm] = useState<Partial<Exercise>>({ name: "", sets: 3, reps: "10", weight: "" });

  const exercises = plan.exercises || [];

  function openNewEx() {
    setExForm({ name: "", sets: 3, reps: "10", weight: "" });
    setIsAddingEx(true);
    if (!isExpanded) onToggle();
  }

  function openEditEx(ex: Exercise) {
    setExForm(ex);
    setIsEditingEx(ex);
    if (!isExpanded) onToggle();
  }

  function saveExercise() {
    if (!exForm.name) return;
    
    let newExercises = [...exercises];
    if (isEditingEx) {
      newExercises = newExercises.map(e => e.id === isEditingEx.id ? { ...e, ...exForm } as Exercise : e);
    } else {
      newExercises.push({ id: genId(), ...exForm } as Exercise);
    }
    
    onUpdate(plan.id, { exercises: newExercises });
    setIsAddingEx(false);
    setIsEditingEx(null);
  }

  function deleteExercise(id: string) {
    if (!confirm("Remover este exercício?")) return;
    onUpdate(plan.id, { exercises: exercises.filter(e => e.id !== id) });
  }

  const isFormOpen = isAddingEx || isEditingEx !== null;

  return (
    <div className="glass rounded-3xl overflow-hidden border border-ink/10 flex flex-col">
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/5 transition"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink text-surface flex items-center justify-center">
            <Dumbbell size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{plan.title}</h3>
            <p className="text-[11px] text-muted">{exercises.length} exercício{exercises.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); if (confirm("Excluir este treino?")) onDelete(plan.id); }}
            className="p-2 text-muted hover:text-danger rounded-full transition"
          >
            <Trash2 size={14} />
          </button>
          <div className="text-muted">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-ink/5 mt-2 bg-surface/30">
          <div className="flex justify-between items-center mt-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Exercícios</h4>
            <Button variant="light" className="text-[10px] h-7 px-2 py-0" onClick={(e) => { e.stopPropagation(); openNewEx(); }}>
              + Adicionar
            </Button>
          </div>

          <div className="space-y-2 mb-2">
            {exercises.map((ex, i) => (
              <div key={ex.id} className="p-3 bg-white rounded-2xl border border-ink/5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface-2 text-muted flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{ex.name}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {ex.sets}x {ex.reps} {ex.weight ? ` • ${ex.weight}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditEx(ex)} className="p-1.5 text-muted hover:text-ink">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteExercise(ex.id)} className="p-1.5 text-muted hover:text-danger">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            
            {exercises.length === 0 && !isFormOpen && (
              <p className="text-xs text-muted text-center py-4">Nenhum exercício adicionado.</p>
            )}
          </div>
        </div>
      )}

      {/* Editor Modal for Exercises */}
      <Dialog open={isFormOpen} onOpenChange={(v) => !v && (setIsAddingEx(false), setIsEditingEx(null))}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>{isEditingEx ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
            <div className="space-y-4 mt-5">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Nome do Exercício</label>
                <Input value={exForm.name} onChange={e => setExForm({...exForm, name: e.target.value})} placeholder="Ex: Supino Reto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Séries</label>
                  <Input type="number" value={exForm.sets?.toString()} onChange={e => setExForm({...exForm, sets: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Repetições</label>
                  <Input value={exForm.reps} onChange={e => setExForm({...exForm, reps: e.target.value})} placeholder="Ex: 10-12" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Carga / Observação</label>
                <Input value={exForm.weight} onChange={e => setExForm({...exForm, weight: e.target.value})} placeholder="Ex: 20kg cada lado" />
              </div>
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={saveExercise}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
