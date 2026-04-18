"use client";

import { useEffect, useState, useMemo } from "react";
import { useCalendar } from "@/hooks/useCalendar";
import { useTasks } from "@/hooks/useTasks";
import { CalendarEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EVENT_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function CalendarPage() {
  const { events, loading, fetchEvents, addEvent, deleteEvent } = useCalendar();
  const { tasks, fetchTasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "event",
    color: EVENT_COLORS[0],
    description: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchTasks();
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    await addEvent({
  ...form,
  type: form.type as "event" | "task" | "reminder"
});
    setForm({ title: "", date: format(new Date(), "yyyy-MM-dd"), type: "event", color: EVENT_COLORS[0], description: "" });
    setShowAdd(false);
  };

  const openAddForDay = (day: Date) => {
    setSelectedDay(day);
    setForm((f) => ({ ...f, date: format(day, "yyyy-MM-dd") }));
    setShowAdd(true);
  };

  // Build calendar days
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const days = view === "month" ? monthDays : weekDays;

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const calEvents = events.filter((e) => e.date.startsWith(dayStr));
    const taskEvents = tasks
      .filter((t) => t.dueDate && t.dueDate.startsWith(dayStr))
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.dueDate!,
        type: "task" as const,
        color: "#a855f7",
      }));
    return [...calEvents, ...taskEvents];
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-lumina-blue" />
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Events, tasks & reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  view === v ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              {view === "month"
                ? format(currentDate, "MMMM yyyy")
                : `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8"
                onClick={() =>
                  setCurrentDate((d) => (view === "month" ? subMonths(d, 1) : new Date(d.setDate(d.getDate() - 7))))
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8"
                onClick={() =>
                  setCurrentDate((d) => (view === "month" ? addMonths(d, 1) : new Date(d.setDate(d.getDate() + 7))))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const todayDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date("invalid")) ? null : day)}
                  className={cn(
                    "min-h-[80px] p-1.5 cursor-pointer transition-colors",
                    "bg-card hover:bg-secondary/30",
                    !isCurrentMonth && "opacity-40",
                    isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1 mx-auto",
                    todayDay && "bg-primary text-white",
                    !todayDay && "text-foreground"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] truncate px-1 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="mt-4 p-4 rounded-xl border border-border/50 bg-secondary/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  {format(selectedDay, "EEEE, MMMM d")}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAddForDay(selectedDay)}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events. Click Add to create one.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 group">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      <span className="text-sm flex-1">{ev.title}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{ev.type}</Badge>
                      {events.find((e) => e.id === ev.id) && (
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Color</label>
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      form.color === c && "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
