export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  attended: number;
  total: number;
  color: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "good" | "bad" | "neutral";
  date: string;
}

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "event" | "task" | "reminder";
  color?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface FocusSession {
  id: string;
  duration: number;
  type: "focus" | "break";
  completedAt: string;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Books",
  "Stationery",
  "Entertainment",
  "Health",
  "Clothing",
  "Subscription",
  "Other",
];

export const EXPENSE_TYPE_MAP: Record<string, "good" | "bad" | "neutral"> = {
  Books: "good",
  Stationery: "good",
  Health: "good",
  Food: "neutral",
  Transport: "neutral",
  Entertainment: "bad",
  Clothing: "bad",
  Subscription: "neutral",
  Other: "neutral",
};

export const SUBJECT_COLORS = [
  "#a855f7",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
];
