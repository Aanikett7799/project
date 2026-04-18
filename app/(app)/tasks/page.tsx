"use client";

import { useEffect, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus, Trash2, CheckSquare, Circle, ArrowRight, Calendar, Flag,
} from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { key: TaskStatus; label: string; color: string; bg: string; dot: string }[] = [
  { key: "todo", label: "To Do", color: "text-muted-foreground", bg: "bg-secondary/30", dot: "bg-muted-foreground" },
  { key: "doing", label: "In Progress", color: "text-lumina-amber", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  { key: "done", label: "Done", color: "text-lumina-green", bg: "bg-green-500/10", dot: "bg-green-500" },
];

const PRIORITY_COLORS = {
  low: "text-muted-foreground",
  medium: "text-lumina-amber",
  high: "text-red-400",
};

const PRIORITY_BG = {
  low: "bg-muted/20 text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-red-500/15 text-red-400",
};

export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, moveTask } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  useEffect(() => { fetchTasks(); }, []);

  const openNew = () => {
    setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
    setShowNew(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    await createTask(form);
    setShowNew(false);
  };

  const handleUpdate = async () => {
    if (!editTask) return;
    if (!form.title.trim()) { toast.error("Title required"); return; }
    await updateTask({ id: editTask.id, ...form });
    setEditTask(null);
  };

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === "todo") return "doing";
    if (current === "doing") return "done";
    return "todo";
  };

  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-lumina-purple" />
            Task Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks.filter((t) => t.status === "done").length}/{tasks.length} tasks completed
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="h-60 animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, color, bg, dot }) => {
            const colTasks = grouped[key];
            return (
              <div key={key}>
                {/* Column header */}
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg mb-3", bg)}>
                  <div className={cn("w-2 h-2 rounded-full", dot)} />
                  <span className={cn("text-sm font-semibold", color)}>{label}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-background/40 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2 min-h-[120px]">
                  {colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-border/30 rounded-xl h-20 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground/50">No tasks</p>
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-pointer hover:border-border/80 transition-all duration-150 group",
                        task.status === "done" && "opacity-60"
                      )}
                      onClick={() => openEdit(task)}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-start gap-2 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTask(task.id, getNextStatus(task.status));
                            }}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {task.status === "done" ? (
                              <CheckSquare className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <p className={cn(
                            "text-sm font-medium leading-snug flex-1",
                            task.status === "done" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 ml-6">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 ml-6 flex-wrap">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", PRIORITY_BG[task.priority])}>
                            <Flag className="w-2.5 h-2.5 inline mr-0.5" />
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.status !== "done" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(task.id, getNextStatus(task.status)); }}
                              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                            >
                              Move <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Task Dialog */}
      {[
        { open: showNew, onClose: () => setShowNew(false), onSave: handleCreate, title: "New Task" },
        { open: !!editTask, onClose: () => setEditTask(null), onSave: handleUpdate, title: "Edit Task" },
      ].map(({ open, onClose, onSave, title }) => (
        <Dialog key={title} open={open} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                  <Select
                    value={form.priority}
                    onValueChange={(v: "low" | "medium" | "high") => setForm((f) => ({ ...f, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                  <Select
                    value={form.status}
                    onValueChange={(v: TaskStatus) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="doing">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Due Date (optional)</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={onSave}>{title === "New Task" ? "Create" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
