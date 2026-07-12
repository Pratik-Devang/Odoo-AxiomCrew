"use client";

import { useState, type FormEvent } from "react";
import { Bot, CheckCircle2, Loader2, Send, Wand2 } from "lucide-react";

type AssistantResponse = {
  title: string;
  answer: string;
  lines?: string[];
  action?: "answer" | "created_booking" | "created_allocation";
  error?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AssistantResponse;
};

const promptChips = [
  "Who has Security Patrol Tablet?",
  "Who has HR Badge Scanner?",
  "Show assets due for maintenance next week",
  "Generate maintenance summary",
  "Show overdue assets",
  "Find all idle projectors",
  "Book HR Interview Room tomorrow at 2 PM",
  "Allocate a laptop to Chloe Park",
];

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "Ask me about assets, holders, maintenance, overdue returns, or bookings.",
  result: {
    title: "AssistFlow",
    answer: "Type a sentence and I'll query AssetFlow's live database for you. If a request is unclear, I'll ask for details instead of guessing.",
    lines: [
      "Example: Who has Security Patrol Tablet?",
      "Example: Generate maintenance summary",
      "Example: Book HR Interview Room tomorrow at 2 PM",
    ],
  },
};

export default function AssistFlowPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAssistant(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setError("");
    setPrompt("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: trimmed }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = (await response.json()) as AssistantResponse;
      if (!response.ok) throw new Error(data.error ?? "AssistFlow request failed");

      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", content: data.answer, result: data },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reach AssistFlow");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(prompt);
  }

  function clearChat() {
    setMessages([welcomeMessage]);
    setError("");
    setPrompt("");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border-2 border-ink bg-surface p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-ink/10 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet_bg text-signal">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">AssistFlow</h2>
              <p className="text-xs text-ink3">Rule-based demo copilot wired to Prisma data</p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="ml-auto rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink3 transition hover:border-signal hover:text-signal"
            >
              Clear chat
            </button>
          </div>

          <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[82%] rounded-2xl bg-signal px-4 py-3 text-sm font-medium text-white"
                      : "max-w-[88%] rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-sm text-ink"
                  }
                >
                  {message.role === "user" ? message.content : <AssistantCard result={message.result} fallback={message.content} />}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-sm text-ink3">
                  <Loader2 size={15} className="animate-spin" /> Checking AssetFlow data...
                </div>
              </div>
            ) : null}
          </div>

          {error ? <div className="mt-4 border-2 border-danger bg-danger_bg px-3 py-2 text-sm font-semibold text-danger">{error}</div> : null}

          <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-ink/10 pt-4">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about assets, bookings, maintenance, or allocations..."
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-signal"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white transition hover:bg-signal2 disabled:opacity-50"
            >
              <Send size={16} /> Ask
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border-2 border-ink bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-ink">
              <Wand2 size={17} />
              <h3 className="font-display font-bold">Demo moments</h3>
            </div>
            <div className="space-y-2">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPrompt(chip)}
                  className="block w-full rounded-lg bg-canvas px-3 py-2 text-left text-xs font-medium text-ink2 transition hover:bg-violet_bg hover:text-signal"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-go bg-go_bg p-5 text-go">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <CheckCircle2 size={17} /> Works locally
            </div>
            <p className="text-xs leading-5 text-ink2">AssistFlow recognizes demo intents and uses your PostgreSQL data.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function AssistantCard({ result, fallback }: { result?: AssistantResponse; fallback: string }) {
  if (!result) return <p>{fallback}</p>;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {result.action ? <CheckCircle2 size={16} className="text-go" /> : <Bot size={16} className="text-signal" />}
        <p className="font-bold text-ink">{result.title}</p>
      </div>
      <p className="leading-6 text-ink2">{result.answer}</p>
      {result.lines?.length ? (
        <ul className="mt-3 space-y-1.5 border-l-2 border-ink/10 pl-3 text-xs text-ink3">
          {result.lines.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}