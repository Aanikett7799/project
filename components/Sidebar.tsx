"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Brain, FileText, BarChart2, Wallet,
  Timer, Calendar, CheckSquare, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-lumina-purple" },
  { href: "/ai", label: "AI Assistant", icon: Brain, color: "text-lumina-cyan" },
  { href: "/notes", label: "Notes", icon: FileText, color: "text-lumina-blue" },
  { href: "/attendance", label: "Attendance", icon: BarChart2, color: "text-lumina-green" },
  { href: "/expenses", label: "Expenses", icon: Wallet, color: "text-lumina-amber" },
  { href: "/focus", label: "Focus Timer", icon: Timer, color: "text-lumina-pink" },
  { href: "/calendar", label: "Calendar", icon: Calendar, color: "text-lumina-blue" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, color: "text-lumina-purple" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lumina-purple to-lumina-blue flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-lumina-purple to-lumina-blue rounded-lg opacity-20 blur-sm" />
        </div>
        <div>
          <h1 className="text-base font-bold gradient-text">Lumina</h1>
          <p className="text-[10px] text-muted-foreground">Student OS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  active ? color : "text-muted-foreground group-hover:" + color.split("-")[2]
                )}
              />
              <span className="font-medium">{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lumina-purple/40 to-lumina-blue/40 flex items-center justify-center text-xs font-bold text-foreground">
            S
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Student</p>
            <p className="text-[10px] text-muted-foreground">Local Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
