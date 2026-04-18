import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/storage";
import { ChatMessage, Note } from "@/lib/types";
import { randomUUID } from "crypto";

const FILE = "chat-history.json";
const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function GET() {
  const history = readJSON<ChatMessage[]>(FILE, []);
  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, useNotes } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const history = readJSON<ChatMessage[]>(FILE, []);

  // Build context from notes if requested
  let contextPrompt = "";
  if (useNotes) {
    const notes = readJSON<Note[]>("notes.json", []);
    if (notes.length > 0) {
      const notesSummary = notes
        .slice(0, 5)
        .map((n) => `Title: ${n.title}\nContent: ${n.content}`)
        .join("\n\n---\n\n");
      contextPrompt = `You are Lumina AI, a helpful study assistant. Here are some of the student's notes for context:\n\n${notesSummary}\n\nUsing the context above when relevant, answer the following:\n\n`;
    }
  } else {
    contextPrompt = "You are Lumina AI, a helpful study assistant for students. Be concise and helpful. ";
  }

  const fullPrompt = contextPrompt + message;

  // Save user message
  const userMsg: ChatMessage = {
    id: randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  history.push(userMsg);

  try {
    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: fullPrompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama responded with ${ollamaRes.status}`);
    }

    const data = await ollamaRes.json();
    const aiContent = data.response || "Sorry, I couldn't generate a response.";

    const aiMsg: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: aiContent,
      timestamp: new Date().toISOString(),
    };
    history.push(aiMsg);
    writeJSON(FILE, history);

    return NextResponse.json({ message: aiMsg, history });
  } catch (error: unknown) {
    // Save error message
    const errMsg: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content:
        "⚠️ Could not connect to Ollama. Make sure Ollama is running (`ollama serve`) and the llama3 model is installed (`ollama pull llama3`).",
      timestamp: new Date().toISOString(),
    };
    history.push(errMsg);
    writeJSON(FILE, history);
    return NextResponse.json({ message: errMsg, history, error: String(error) });
  }
}

export async function DELETE() {
  writeJSON(FILE, []);
  return NextResponse.json({ success: true });
}
