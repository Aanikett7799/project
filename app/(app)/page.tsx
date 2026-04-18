"use client";

import { useEffect, useMemo } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useAttendance } from "@/hooks/useAttendance";
import { useExpenses } from "@/hooks/useExpenses";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getBunkInfo, getAttendanceColor, formatCurrency, cn } from "@/lib/utils";
import {
  Brain, FileText, BarChart2, Wallet, CheckSquare,
  TrendingUp, AlertTriangle, Zap, Sun, Star,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function Dashboard() {
  const { notes, fetchNotes } = useNotes();
  const { subjects, fetchSubjects } = useAttendance();
  const { expenses, fetchExpenses } = useExpenses();
  const { tasks, fetchTasks } = useTasks();

  useEffect(() => {
    fetchNotes();
    fetchSubjects();
    fetchExpenses();
    fetchTasks();
  }, []);

  const today = format(new Date(), "EEEE, MMMM d");

  const avgAttendance = useMemo(() => {
    if (!subjects.length) return 0;
    return subjects.reduce((acc, s) => acc + (s.total ? (s.attended / s.total) * 100 : 0), 0) / subjects.length;
  }, [subjects]);

  const weeklyExpenses = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return expenses
      .filter((e) => new Date(e.date) >= weekAgo)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  }), [tasks]);

  const focusScore = useMemo(() => {
    const completedRatio = taskStats.total ? taskStats.done / taskStats.total : 0;
    const attendanceScore = avgAttendance / 100;
    return Math.round((completedRatio * 0.4 + attendanceScore * 0.6) * 100);
  }, [taskStats, avgAttendance]);

  const atRiskSubjects = subjects.filter((s) => {
    const { pct } = getBunkInfo(s.attended, s.total);
    return pct < 75 && s.total > 0;
  });

  const stats = [
    {
      title: "Avg. Attendance",
      value: `${avgAttendance.toFixed(0)}%`,
      icon: BarChart2,
      color: "text-lumina-green",
      bg: "bg-lumina-green/10",
      href: "/attendance",
      sub: `${subjects.length} subjects`,
    },
    {
      title: "Weekly Spend",
      value: formatCurrency(weeklyExpenses),
      icon: Wallet,
      color: "text-lumina-amber",
      bg: "bg-lumina-amber/10",
      href: "/expenses",
      sub: `${expenses.filter((e) => {
        const w = new Date(); w.setDate(w.getDate() - 7);
        return new Date(e.date) >= w;
      }).length} transactions`,
    },
    {
      title: "Tasks Progress",
      value: `${taskStats.done}/${taskStats.total}`,
      icon: CheckSquare,
      color: "text-lumina-purple",
      bg: "bg-lumina-purple/10",
      href: "/tasks",
      sub: `${taskStats.doing} in progress`,
    },
    {
      title: "Notes",
      value: String(notes.length),
      icon: FileText,
      color: "text-lumina-blue",
      bg: "bg-lumina-blue/10",
      href: "/notes",
      sub: "in second brain",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Sun className="w-4 h-4 text-lumina-amber" />
            {today}
          </div>
          <h1 className="text-3xl font-bold">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your academic intelligence overview.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold gradient-text">{focusScore}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
            <Zap className="w-3 h-3 text-lumina-amber" />
            Focus Score
          </div>
        </div>
      </div>

      {/* Alert for at-risk subjects */}
      {atRiskSubjects.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Attendance Alert</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {atRiskSubjects.map((s) => s.name).join(", ")} {atRiskSubjects.length === 1 ? "is" : "are"} below 75% — attend urgently!
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, color, bg, href, sub }) => (
          <Link key={title} href={href}>
            <Card className="hover:border-border hover:bg-card/80 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <TrendingUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-2xl font-bold mb-0.5">{value}</div>
                <div className="text-xs text-muted-foreground">{title}</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-lumina-green" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No subjects added yet
              </div>
            ) : (
              subjects.map((s) => {
                const { pct, safe } = getBunkInfo(s.attended, s.total);
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        {safe > 0 && (
                          <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                            {safe} bunk{safe > 1 ? "s" : ""} safe
                          </span>
                        )}
                        <span className={cn("font-bold text-xs", getAttendanceColor(pct))}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={pct}
                      className="h-1.5"
                      indicatorClassName={
                        pct >= 85 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500"
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {s.attended}/{s.total} classes
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Tasks Kanban Mini */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-lumina-purple" />
              Tasks Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No tasks yet
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span>{taskStats.total ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%</span>
                  </div>
                  <Progress
                    value={taskStats.total ? (taskStats.done / taskStats.total) * 100 : 0}
                    className="h-2"
                    indicatorClassName="bg-lumina-purple"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: "To Do", count: taskStats.todo, color: "text-muted-foreground", bg: "bg-muted/30" },
                    { label: "Doing", count: taskStats.doing, color: "text-lumina-amber", bg: "bg-amber-500/10" },
                    { label: "Done", count: taskStats.done, color: "text-lumina-green", bg: "bg-green-500/10" },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className={cn("rounded-lg p-3 text-center", bg)}>
                      <div className={cn("text-xl font-bold", color)}>{count}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
                {/* Recent tasks */}
                <div className="space-y-1 mt-2">
                  {tasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        t.status === "done" ? "bg-green-500" : t.status === "doing" ? "bg-amber-500" : "bg-muted-foreground"
                      )} />
                      <span className={cn("text-xs truncate", t.status === "done" && "line-through text-muted-foreground")}>
                        {t.title}
                      </span>
                      <Badge
                        variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "warning" : "outline"}
                        className="ml-auto text-[9px] py-0 px-1.5"
                      >
                        {t.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-lumina-purple/20 bg-lumina-purple/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-lumina-purple" />
            AI Insights
            <Badge variant="default" className="text-[10px]">Smart</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Star,
                color: "text-lumina-amber",
                title: "Study Tip",
                msg: notes.length > 0
                  ? `You have ${notes.length} notes in your second brain. Review them regularly for better retention.`
                  : "Start adding notes to build your second brain. Consistent note-taking improves learning by 40%.",
              },
              {
                icon: BarChart2,
                color: "text-lumina-green",
                title: "Attendance",
                msg: avgAttendance >= 85
                  ? `Excellent! Your ${avgAttendance.toFixed(0)}% attendance gives you room for occasional absences.`
                  : avgAttendance >= 75
                  ? `Your attendance at ${avgAttendance.toFixed(0)}% is safe but tight. Avoid unnecessary bunks.`
                  : `⚠️ Attendance at ${avgAttendance.toFixed(0)}% is below threshold. Attend all classes now!`,
              },
              {
                icon: Wallet,
                color: "text-lumina-cyan",
                title: "Spending",
                msg: weeklyExpenses > 2000
                  ? `You've spent ${formatCurrency(weeklyExpenses)} this week. Consider reviewing discretionary expenses.`
                  : weeklyExpenses > 0
                  ? `Weekly spending of ${formatCurrency(weeklyExpenses)} looks manageable. Keep it up!`
                  : "No expenses logged this week. Start tracking to get spending insights.",
              },
            ].map(({ icon: Icon, color, title, msg }) => (
              <div key={title} className="flex gap-3 p-3 rounded-lg bg-background/40">
                <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", color)} />
                <div>
                  <p className="text-xs font-semibold mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{msg}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
