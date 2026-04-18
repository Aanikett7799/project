"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTime, cn } from "@/lib/utils";
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { FocusSession } from "@/lib/types";

const MODES = [
  { key: "focus", label: "Focus", duration: 25 * 60, color: "text-lumina-purple", bg: "bg-lumina-purple/10", icon: Brain },
  { key: "short", label: "Short Break", duration: 5 * 60, color: "text-lumina-cyan", bg: "bg-lumina-cyan/10", icon: Coffee },
  { key: "long", label: "Long Break", duration: 15 * 60, color: "text-lumina-green", bg: "bg-lumina-green/10", icon: Coffee },
];

export default function FocusPage() {
  const [modeKey, setModeKey] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const mode = MODES.find((m) => m.key === modeKey)!;

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/focus");
      const data = await res.json();
      setSessions(data);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const logSession = useCallback(async (duration: number, type: string) => {
    try {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, type }),
      });
      fetchSessions();
    } catch {}
  }, []);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            const elapsed = mode.duration;
            logSession(elapsed, modeKey === "focus" ? "focus" : "break");
            toast.success(modeKey === "focus" ? "🎉 Focus session complete!" : "☕ Break complete!");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, modeKey, mode.duration, logSession]);

  const switchMode = (key: string) => {
    setRunning(false);
    setModeKey(key);
    const m = MODES.find((m) => m.key === key)!;
    setTimeLeft(m.duration);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(mode.duration);
  };

  const pct = ((mode.duration - timeLeft) / mode.duration) * 100;
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (pct / 100) * circumference;

  const todaySessions = sessions.filter((s) => {
    const today = new Date();
    const d = new Date(s.completedAt);
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  });

  const totalFocusMin = sessions
    .filter((s) => s.type === "focus")
    .reduce((acc, s) => acc + s.duration / 60, 0);

  const focusScore = Math.min(100, Math.round((todaySessions.filter((s) => s.type === "focus").length / 8) * 100));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Timer className="w-6 h-6 text-lumina-pink" />
          Focus Timer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Pomodoro technique for deep work</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              {/* Mode tabs */}
              <div className="flex gap-2 mb-8 justify-center">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => switchMode(m.key)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                      modeKey === m.key
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Circular timer */}
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <svg width="220" height="220" className="-rotate-90">
                    {/* Track */}
                    <circle
                      cx="110" cy="110" r="90"
                      fill="none"
                      stroke="hsl(216 34% 17%)"
                      strokeWidth="8"
                    />
                    {/* Progress */}
                    <circle
                      cx="110" cy="110" r="90"
                      fill="none"
                      stroke={modeKey === "focus" ? "#a855f7" : modeKey === "short" ? "#06b6d4" : "#22c55e"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold tracking-tight font-outfit">
                      {formatTime(timeLeft)}
                    </span>
                    <span className={cn("text-sm font-medium mt-1", mode.color)}>{mode.label}</span>
                    {running && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-muted-foreground">Running</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={reset}
                    className="w-11 h-11 rounded-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setRunning((r) => !r)}
                    className={cn(
                      "w-32 h-12 rounded-full text-base font-semibold gap-2",
                      running
                        ? "bg-secondary hover:bg-secondary/80"
                        : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                    )}
                  >
                    {running ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Start</>}
                  </Button>
                  <div className="w-11 h-11" /> {/* Spacer */}
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 p-4 rounded-xl bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground">
                  {modeKey === "focus"
                    ? "📵 Put your phone away. Close distracting tabs. Focus for 25 minutes."
                    : "🚶 Stand up, stretch, grab water. Rest your eyes from the screen."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {/* Score */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-lumina-purple/10">
                  <Zap className="w-4 h-4 text-lumina-purple" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Focus Score</div>
                  <div className="text-2xl font-bold gradient-text">{focusScore}/100</div>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lumina-purple to-lumina-blue transition-all duration-700"
                  style={{ width: `${focusScore}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {focusScore >= 80 ? "🔥 Excellent focus today!" :
                  focusScore >= 50 ? "💪 Keep going!" :
                    "Start a session to build your score"}
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Today's Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Sessions Done",
                  value: todaySessions.filter((s) => s.type === "focus").length,
                  icon: CheckCircle2,
                  color: "text-green-400",
                },
                {
                  label: "Focus Time",
                  value: `${Math.round(todaySessions.filter((s) => s.type === "focus").reduce((a, s) => a + s.duration, 0) / 60)}m`,
                  icon: Timer,
                  color: "text-lumina-purple",
                },
                {
                  label: "Break Time",
                  value: `${Math.round(todaySessions.filter((s) => s.type === "break").reduce((a, s) => a + s.duration, 0) / 60)}m`,
                  icon: Coffee,
                  color: "text-lumina-cyan",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3.5 h-3.5", color)} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <span className={cn("text-sm font-bold", color)}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* All-time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">All Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Sessions", value: sessions.filter((s) => s.type === "focus").length },
                { label: "Total Focus Time", value: `${Math.round(totalFocusMin)}m` },
                { label: "Avg per Day", value: `${Math.round(totalFocusMin / Math.max(1, 7))}m` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
