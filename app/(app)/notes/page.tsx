"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import { Note } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Trash2, Edit2, Brain, FileText, Tag, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function NotesPage() {
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote } = useNotes();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  useEffect(() => { fetchNotes(); }, []);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    await createNote({ title: form.title, content: form.content, tags });
    setForm({ title: "", content: "", tags: "" });
    setShowNew(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    await updateNote({ id: selected.id, title: form.title, content: form.content, tags });
    setEditing(false);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    if (selected?.id === id) setSelected(null);
  };

  const startEdit = (note: Note) => {
    setSelected(note);
    setForm({ title: note.title, content: note.content, tags: note.tags.join(", ") });
    setEditing(true);
  };

  const askAI = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Summarize and give me key insights from this note titled "${selected.title}":\n\n${selected.content}`,
          useNotes: false,
        }),
      });
      const data = await res.json();
      setAiResponse(data.message?.content || "No response");
    } catch {
      setAiResponse("Failed to connect to AI. Make sure Ollama is running.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-lumina-blue" />
            Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your second brain — {notes.length} notes</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{search ? "No notes found" : "No notes yet"}</p>
          <p className="text-sm mt-1">{search ? "Try a different search" : "Create your first note"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className={cn(
                "cursor-pointer hover:border-border transition-all duration-200 group",
                selected?.id === note.id && "border-primary/50 bg-primary/5"
              )}
              onClick={() => { setSelected(note); setEditing(false); setAiResponse(""); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold line-clamp-1">{note.title}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(note); }}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{note.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {note.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">
                      <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(note.updatedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Detail / Edit panel */}
      {selected && !editing && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selected.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(selected.updatedAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(selected)} className="gap-1.5">
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={askAI}
                  disabled={aiLoading}
                  className="gap-1.5 border-lumina-purple/30 text-lumina-purple hover:bg-lumina-purple/10"
                >
                  <Brain className="w-3 h-3" />
                  {aiLoading ? "Thinking..." : "Ask AI"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>
            </ScrollArea>
            {selected.tags.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {selected.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            )}
            {aiResponse && (
              <div className="mt-4 p-4 rounded-xl border border-lumina-purple/20 bg-lumina-purple/5">
                <p className="text-xs font-semibold text-lumina-purple mb-2 flex items-center gap-1.5">
                  <Brain className="w-3 h-3" /> AI Insights
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              placeholder="Content (Markdown supported)"
              className="min-h-[200px]"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <Input
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Note dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              placeholder="Content (Markdown supported)"
              className="min-h-[200px]"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <Input
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
