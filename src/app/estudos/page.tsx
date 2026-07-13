"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { BookOpen, GraduationCap, BrainCircuit, CalendarDays, Plus, Library, X, Pencil, Clock, ExternalLink } from "lucide-react";
import { useStudiesStore } from "@/store/useStudiesStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { genId } from "@/lib/id";

type Tab = "estudos" | "biblioteca";

// ── Utils ───────────────────────────────────────────────────────────────────

function fmtDate(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── Components ──────────────────────────────────────────────────────────────

function EstudosTab() {
  const items = useStudiesStore((s) => s.items);
  const addItem = useStudiesStore((s) => s.addItem);
  const updateItem = useStudiesStore((s) => s.updateItem);
  const deleteItem = useStudiesStore((s) => s.deleteItem);
  const addRoutineBlock = useRoutineStore((s) => s.addBlock);

  const courses = items.filter((i) => i.type === "course" || i.type === "subject");
  const exams = items.filter((i) => i.type === "exam").sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // State for Course/Subject Editor
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [courseUrl, setCourseUrl] = useState("");
  const [courseCurrent, setCourseCurrent] = useState(0);
  const [courseTotal, setCourseTotal] = useState(0);

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");

  // State for Exam Editor
  const [examOpen, setExamOpen] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examDate, setExamDate] = useState("");

  // State for Routine Scheduler
  const [routineOpen, setRoutineOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<{ id: string, title: string } | null>(null);
  const [schedDays, setSchedDays] = useState<number[]>([]);
  const [schedStart, setSchedStart] = useState("19:00");
  const [schedEnd, setSchedEnd] = useState("20:00");

  // Handlers: Courses
  function openCourseNew() {
    setCourseId(null); setCourseTitle(""); setCourseProvider(""); setCourseUrl("");
    setCourseCurrent(0); setCourseTotal(0); setCourseOpen(true);
  }
  function openCourseEdit(id: string) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setCourseId(id); setCourseTitle(it.title); setCourseProvider(it.authorOrProvider || "");
    setCourseUrl(it.url || "");
    setCourseCurrent(it.currentProgress); setCourseTotal(it.totalProgress); setCourseOpen(true);
  }
  function saveCourse() {
    if (!courseTitle) return;
    if (courseId) {
      updateItem(courseId, { title: courseTitle, authorOrProvider: courseProvider, currentProgress: courseCurrent, totalProgress: courseTotal, url: courseUrl });
    } else {
      addItem({ type: "course", title: courseTitle, authorOrProvider: courseProvider, currentProgress: courseCurrent, totalProgress: courseTotal, status: "doing", url: courseUrl });
    }
    setCourseOpen(false);
  }

  function handleNotesUpdate(val: string) {
    if (selectedCourseId) {
      updateItem(selectedCourseId, { notes: val });
    }
  }

  function addMaterial() {
    if (!selectedCourse || !newMaterialName || !newMaterialUrl) return;
    const mats = selectedCourse.materials || [];
    updateItem(selectedCourse.id, { materials: [...mats, { id: genId(), name: newMaterialName, url: newMaterialUrl }] });
    setNewMaterialName("");
    setNewMaterialUrl("");
  }

  function removeMaterial(id: string) {
    if (!selectedCourse || !selectedCourse.materials) return;
    updateItem(selectedCourse.id, { materials: selectedCourse.materials.filter(m => m.id !== id) });
  }

  // Handlers: Exams
  function openExamNew() {
    setExamId(null); setExamTitle(""); setExamDesc(""); setExamDate(""); setExamOpen(true);
  }
  function openExamEdit(id: string) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setExamId(id); setExamTitle(it.title); setExamDesc(it.authorOrProvider || "");
    if (it.dueDate) {
      const d = new Date(it.dueDate);
      setExamDate(d.toISOString().slice(0, 10));
    }
    setExamOpen(true);
  }
  function saveExam() {
    if (!examTitle) return;
    const ts = examDate ? new Date(examDate + "T12:00:00").getTime() : undefined;
    if (examId) {
      updateItem(examId, { title: examTitle, authorOrProvider: examDesc, dueDate: ts });
    } else {
      addItem({ type: "exam", title: examTitle, authorOrProvider: examDesc, currentProgress: 0, totalProgress: 0, status: "to_do", dueDate: ts });
    }
    setExamOpen(false);
  }

  // Handlers: Routine
  function openRoutineMenu(id: string, title: string) {
    setScheduleItem({ id, title });
    setSchedDays([]);
    setSchedStart("19:00");
    setSchedEnd("20:00");
    setRoutineOpen(true);
  }
  function saveRoutine() {
    if (!scheduleItem || schedDays.length === 0) return;
    const [hS, mS] = schedStart.split(":").map(Number);
    const [hE, mE] = schedEnd.split(":").map(Number);
    addRoutineBlock({
      title: "Estudo: " + scheduleItem.title,
      startMinute: hS * 60 + mS,
      endMinute: hE * 60 + mE,
      recurrence: "custom",
      weekdays: schedDays,
      color: "var(--color-info)",
      isFlexible: false,
      activityType: "study",
      linkedId: scheduleItem.id,
    });
    setRoutineOpen(false);
  }
  function toggleDay(d: number) {
    setSchedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cursos e Trilhas */}
      <div className="glass rounded-3xl p-5 border flex flex-col" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink text-surface flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base">Cursos e Matérias</h2>
              <p className="text-[11px] text-muted">Acompanhe seu progresso</p>
            </div>
          </div>
          <button onClick={openCourseNew} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-ink hover:text-white transition border" style={{ borderColor: "var(--flat-border)" }}>
            <Plus size={14} />
          </button>
        </div>
        
        <div className="space-y-3 flex-1">
          {courses.length === 0 ? (
            <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center opacity-50">
              <p className="text-xs font-bold mb-1">Nenhum curso cadastrado</p>
              <p className="text-[10px]">Adicione matérias para acompanhar</p>
            </div>
          ) : (
            courses.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCourseId(c.id)}
                className={cn(
                  "p-3 rounded-2xl flex flex-col gap-2 border group relative cursor-pointer transition-all",
                  selectedCourseId === c.id ? "bg-ink text-white border-transparent" : "bg-surface-2 hover:bg-black/5"
                )} 
                style={selectedCourseId !== c.id ? { borderColor: "var(--flat-border)" } : {}}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openRoutineMenu(c.id, c.title); }} title="Agendar na Rotina" className="p-1.5 bg-white rounded-lg hover:text-info text-muted shadow-sm border border-flat">
                    <Clock size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openCourseEdit(c.id); }} className="p-1.5 bg-white rounded-lg hover:text-ink text-muted shadow-sm border border-flat">
                    <Pencil size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteItem(c.id); if (selectedCourseId === c.id) setSelectedCourseId(null); }} className="p-1.5 bg-white rounded-lg hover:text-danger text-muted shadow-sm border border-flat">
                    <X size={12} />
                  </button>
                </div>
                
                <div className="pr-16">
                  <p className="text-sm font-semibold leading-tight">{c.title}</p>
                  {c.authorOrProvider && <p className={cn("text-[10px] mt-0.5", selectedCourseId === c.id ? "text-white/70" : "text-muted")}>{c.authorOrProvider}</p>}
                </div>
                
                {c.totalProgress > 0 && (
                  <div className="mt-1">
                    <div className={cn("flex justify-between text-[10px] mb-1 font-semibold", selectedCourseId === c.id ? "text-white/70" : "text-muted")}>
                      <span>{c.currentProgress} / {c.totalProgress}</span>
                      <span>{Math.round((c.currentProgress / c.totalProgress) * 100)}%</span>
                    </div>
                    <div className={cn("h-1.5 rounded-full overflow-hidden", selectedCourseId === c.id ? "bg-white/20" : "bg-ink/10")}>
                      <div className={cn("h-full rounded-full transition-all", selectedCourseId === c.id ? "bg-white" : "bg-ink")} style={{ width: `${Math.min(100, (c.currentProgress / c.totalProgress) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entregas e Provas (Right Column) */}
      <div className="glass rounded-3xl p-5 border flex flex-col" style={{ borderColor: "var(--flat-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-info/20 text-info flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base">Entregas e Provas</h2>
              <p className="text-[11px] text-muted">Cronograma de avaliações</p>
            </div>
          </div>
          <button onClick={openExamNew} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-ink hover:text-white transition border" style={{ borderColor: "var(--flat-border)" }}>
            <Plus size={14} />
          </button>
        </div>
        
        <div className="space-y-3 flex-1 overflow-y-auto">
          {exams.length === 0 ? (
            <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center opacity-50">
              <p className="text-xs font-bold mb-1">Nenhuma entrega agendada</p>
              <p className="text-[10px]">Adicione provas para acompanhar</p>
            </div>
          ) : (
            exams.map((e) => {
              const d = e.dueDate ? new Date(e.dueDate) : new Date();
              const isPast = d.getTime() < Date.now() - 86400000;
              const isSoon = d.getTime() < Date.now() + 86400000 * 7 && !isPast;
              return (
                <div key={e.id} className="bg-surface-2 p-3 rounded-2xl border relative group" style={{ borderColor: "var(--flat-border)" }}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => openExamEdit(e.id)} className="p-1.5 bg-white rounded-lg hover:text-ink text-muted shadow-sm border border-flat">
                      <Pencil size={10} />
                    </button>
                    <button onClick={() => deleteItem(e.id)} className="p-1.5 bg-white rounded-lg hover:text-danger text-muted shadow-sm border border-flat">
                      <X size={10} />
                    </button>
                  </div>
                  
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isPast ? "text-muted" : isSoon ? "text-danger" : "text-info")}>
                    {fmtDate(e.dueDate)}
                  </p>
                  <p className="text-sm font-bold leading-tight mb-1 pr-10">{e.title}</p>
                  {e.authorOrProvider && <p className="text-[11px] text-muted">{e.authorOrProvider}</p>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detalhes da Matéria (Bottom Width Full) */}
      <div className="glass rounded-3xl p-5 border md:col-span-2 flex flex-col min-h-[500px]" style={{ borderColor: "var(--flat-border)" }}>
        {!selectedCourse ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <BookOpen size={32} className="mb-3" />
            <p className="text-sm font-bold">Nenhuma matéria selecionada</p>
            <p className="text-xs mt-1">Clique em um curso acima para ver detalhes, materiais e anotações.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-6">
            {/* Cabecalho e Aula */}
            <div className="flex items-start justify-between bg-surface-2 p-4 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
              <div>
                <h2 className="font-bold text-xl leading-tight text-ink">{selectedCourse.title}</h2>
                {selectedCourse.authorOrProvider && <p className="text-xs text-muted mt-0.5">{selectedCourse.authorOrProvider}</p>}
              </div>
              {selectedCourse.url ? (
                <a href={selectedCourse.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-info text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-sm">
                  <ExternalLink size={14} /> Acessar Aula
                </a>
              ) : (
                <div className="text-xs text-muted font-medium bg-surface px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--flat-border)" }}>
                  Nenhum link de aula configurado
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
              {/* Sidebar de Materiais */}
              <div className="md:col-span-1 flex flex-col">
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted mb-3 flex items-center gap-2">
                  Materiais de Apoio
                </label>
                
                <div className="flex flex-col gap-2 mb-4">
                  {(selectedCourse.materials || []).map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-surface-2 p-2 rounded-xl border group" style={{ borderColor: "var(--flat-border)" }}>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline text-info truncate pr-2 flex-1">
                        {m.name}
                      </a>
                      <button onClick={() => removeMaterial(m.id)} className="text-muted hover:text-danger p-1 rounded-md opacity-0 group-hover:opacity-100 transition">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {(!selectedCourse.materials || selectedCourse.materials.length === 0) && (
                    <p className="text-[10px] text-muted italic">Nenhum material adicionado.</p>
                  )}
                </div>

                <div className="bg-surface-2 p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: "var(--flat-border)" }}>
                  <p className="text-[10px] font-bold">Adicionar Link de Material</p>
                  <Input className="h-7 text-xs px-2" value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder="Nome (ex: PDF Cap 1)" />
                  <Input className="h-7 text-xs px-2" value={newMaterialUrl} onChange={e => setNewMaterialUrl(e.target.value)} placeholder="URL do arquivo..." />
                  <Button variant="primary" className="h-7 text-[10px] mt-1" onClick={addMaterial}>Adicionar</Button>
                </div>
              </div>

              {/* Caderno de Anotações */}
              <div className="md:col-span-3 flex flex-col">
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted mb-3 flex items-center gap-2">
                  Caderno de Anotações
                </label>
                <div className="flex-1">
                  <RichTextEditor 
                    value={selectedCourse.notes || ""}
                    onChange={handleNotesUpdate}
                    placeholder="Comece suas anotações aqui..."
                    className="h-full bg-surface-2 rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Course/Subject */}
      <Dialog open={courseOpen} onOpenChange={(v) => !v && setCourseOpen(false)}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>{courseId ? "Editar Matéria" : "Nova Matéria"}</DialogTitle>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Título</label>
                <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Ex: Cálculo 1" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Instituição / Detalhes</label>
                <Input value={courseProvider} onChange={(e) => setCourseProvider(e.target.value)} placeholder="Ex: Faculdade X" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Link de Acesso (URL)</label>
                <Input value={courseUrl} onChange={(e) => setCourseUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Aulas Feitas</label>
                  <Input type="number" min="0" value={courseCurrent} onChange={(e) => setCourseCurrent(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Total de Aulas</label>
                  <Input type="number" min="0" value={courseTotal} onChange={(e) => setCourseTotal(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={saveCourse}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Exam/Deliverable */}
      <Dialog open={examOpen} onOpenChange={(v) => !v && setExamOpen(false)}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>{examId ? "Editar Entrega" : "Nova Entrega/Prova"}</DialogTitle>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Título</label>
                <Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Ex: Prova de Matemática" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Matéria (Opcional)</label>
                <Input value={examDesc} onChange={(e) => setExamDesc(e.target.value)} placeholder="Ex: Matemática Aplicada" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Data</label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={saveExam}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routine Scheduler */}
      <Dialog open={routineOpen} onOpenChange={(v) => !v && setRoutineOpen(false)}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>Agendar na Rotina</DialogTitle>
            <p className="text-xs text-muted mt-1 mb-4">Adicione blocos de estudo para "{scheduleItem?.title}" na sua aba Rotina.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-2">Dias da Semana</label>
                <div className="flex gap-1.5 justify-between">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((l, i) => (
                    <button
                      key={i} onClick={() => toggleDay(i)}
                      className={cn(
                        "w-9 h-9 rounded-full text-xs font-bold transition",
                        schedDays.includes(i) ? "bg-info text-white" : "bg-surface-2 text-muted hover:bg-black/5"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Início</label>
                  <Input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Fim</label>
                  <Input type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={saveRoutine}>Adicionar à Rotina</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Biblioteca Tab ────────────────────────────────────────────────────────────

function BibliotecaTab() {
  const items = useStudiesStore((s) => s.items).filter(i => i.type === "book");
  const addItem = useStudiesStore((s) => s.addItem);
  const updateItem = useStudiesStore((s) => s.updateItem);
  const deleteItem = useStudiesStore((s) => s.deleteItem);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"to_do" | "doing" | "done">("to_do");
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);

  function openNew() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setStatus("to_do");
    setTotal(0);
    setCurrent(0);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    setEditingId(id);
    setTitle(it.title);
    setAuthor(it.authorOrProvider || "");
    setStatus(it.status);
    setTotal(it.totalProgress);
    setCurrent(it.currentProgress);
    setEditorOpen(true);
  }

  function handleSave() {
    if (!title) return;
    if (editingId) {
      updateItem(editingId, {
        title,
        authorOrProvider: author,
        status,
        totalProgress: total,
        currentProgress: current
      });
    } else {
      addItem({
        type: "book",
        title,
        authorOrProvider: author,
        status,
        totalProgress: total,
        currentProgress: current
      });
    }
    setEditorOpen(false);
  }

  const todo = items.filter(i => i.status === "to_do");
  const doing = items.filter(i => i.status === "doing");
  const done = items.filter(i => i.status === "done");

  const Section = ({ title, data, showProgress }: { title: string, data: typeof items, showProgress?: boolean }) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          {title} <span className="bg-ink/10 text-ink/70 px-2 py-0.5 rounded-full text-[10px]">{data.length}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.map((book) => (
            <div key={book.id} className="p-3 bg-surface-2 rounded-2xl group relative border" style={{ borderColor: "var(--flat-border)" }}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openEdit(book.id)} className="p-1.5 bg-white rounded-lg hover:text-ink text-muted shadow-sm border border-flat">
                  <Pencil size={12} />
                </button>
                <button onClick={() => deleteItem(book.id)} className="p-1.5 bg-white rounded-lg hover:text-danger text-muted shadow-sm border border-flat">
                  <X size={12} />
                </button>
              </div>

              <div className="w-10 h-10 rounded-xl bg-surface mb-3 grid place-items-center text-muted shadow-sm border border-flat">
                <BookOpen size={16} />
              </div>
              <h4 className="font-bold text-sm leading-tight pr-12">{book.title}</h4>
              {book.authorOrProvider && <p className="text-[11px] text-muted mt-0.5">{book.authorOrProvider}</p>}
              
              {showProgress && book.totalProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-muted mb-1">
                    <span>{book.currentProgress} / {book.totalProgress} pág</span>
                    <span>{Math.round((book.currentProgress / book.totalProgress) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${Math.min(100, (book.currentProgress / book.totalProgress) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 border" style={{ borderColor: "var(--flat-border)" }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-lg">Biblioteca</h2>
          <p className="text-xs text-muted">Controle de leitura de livros</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={14} /> Novo Livro
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen size={32} className="mx-auto text-ink/20 mb-3" />
          <p className="text-sm font-semibold text-muted">Sua biblioteca está vazia</p>
          <p className="text-xs text-ink/40 mt-1">Adicione o primeiro livro que deseja ler.</p>
        </div>
      ) : (
        <>
          <Section title="Lendo Agora" data={doing} showProgress />
          <Section title="Para Ler" data={todo} />
          <Section title="Concluídos" data={done} />
        </>
      )}

      <Dialog open={editorOpen} onOpenChange={(v) => !v && setEditorOpen(false)}>
        <DialogContent size="sm">
          <div className="p-6">
            <DialogTitle>{editingId ? "Editar Livro" : "Adicionar Livro"}</DialogTitle>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Hábitos Atômicos" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Autor</label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex: James Clear" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Status</label>
                <select 
                  className="w-full bg-surface-2 border border-ink/5 rounded-xl px-3 py-2 text-sm outline-none"
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="to_do">Para Ler</option>
                  <option value="doing">Lendo</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Página Atual</label>
                  <Input type="number" min="0" value={current} onChange={(e) => setCurrent(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Total de Páginas</label>
                  <Input type="number" min="0" value={total} onChange={(e) => setTotal(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <DialogClose asChild><Button variant="light" className="flex-1">Cancelar</Button></DialogClose>
                <Button variant="primary" className="flex-1" onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function EstudosPage() {
  const [tab, setTab] = useState<Tab>("estudos");

  const tabs: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: "estudos", label: "Estudos", Icon: GraduationCap },
    { id: "biblioteca", label: "Biblioteca", Icon: Library },
  ];

  return (
    <AppShell>
      <Topbar title="Estudos" subtitle="Gerenciamento de aprendizado e revisões" variant="full" />
      
      <div className="flex gap-1 mb-4 bg-white rounded-full p-1.5 w-fit shadow-sm border mt-2" style={{ borderColor: "var(--flat-border)" }}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
              tab === id ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink")}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "estudos" && <EstudosTab />}
      {tab === "biblioteca" && <BibliotecaTab />}
    </AppShell>
  );
}
