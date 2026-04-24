import { useState, useRef } from "react";
import { Sparkles, StopCircle, MessageSquareCode } from "lucide-react";
import { api, streamDecision } from "../lib/api.js";
import { PageHeader, Chip, Spinner } from "../components/Primitives.jsx";
import { DOMAIN_LABELS, cn } from "../lib/utils.js";

const EXAMPLES = [
  "Why did East region revenue miss last month?",
  "Which distributors are at risk of credit default?",
  "Plant PLT-02 had a quality spike — what should we do?",
  "Attrition in Engineering crossed 20% — recommend an intervention.",
  "Claim fraud score rising on motor line — trace the cause.",
  "Open PO backlog with VND-105 — should we re-source?",
];

export default function AgentConsole() {
  const [question, setQuestion] = useState("");
  const [routing, setRouting] = useState(null);
  const [responses, setResponses] = useState([]);
  const [synthesis, setSynthesis] = useState(null);
  const [decision, setDecision] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = () => {
    setRouting(null);
    setResponses([]);
    setSynthesis(null);
    setDecision(null);
    setError(null);
  };

  const run = () => {
    if (!question.trim()) return;
    reset();
    setRunning(true);
    abortRef.current = streamDecision(
      question,
      {},
      {
        routing: (p) => setRouting(p),
        agent: (p) => setResponses((r) => [...r, p]),
        agent_error: (p) =>
          setResponses((r) => [
            ...r,
            { agent: p.agent, decision: "error", rationale: p.error, confidence: 0 },
          ]),
        synthesis: (p) => setSynthesis(p),
        decision: (p) => setDecision(p),
        error: (e) => setError(e.message || String(e)),
        done: () => setRunning(false),
        end: () => setRunning(false),
      }
    );
  };

  const stop = () => {
    abortRef.current?.();
    setRunning(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Ask the decision system"
        title="What do you need to decide?"
        subtitle="The router picks specialist agents, each reasons over its slice of the Intelligence Warehouse, and the synthesizer produces one coordinated enterprise decision."
      />

      <div className="px-8 py-6 space-y-6">
        {/* Prompt box */}
        <div className="card p-5">
          <label className="kpi-label mb-2 block">Business question</label>
          <textarea
            className="input min-h-[96px] font-body text-[15px] leading-relaxed resize-none"
            placeholder="e.g. Why did South region underperform this quarter?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-slate-400 dark:text-ink-500 font-display">
              ⌘/Ctrl + Enter to ask
            </div>
            <div className="flex gap-2">
              {running ? (
                <button className="btn btn-ghost" onClick={stop}>
                  <StopCircle size={14} /> Stop
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={run}
                  disabled={!question.trim()}
                >
                  <Sparkles size={14} /> Ask
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-ink-800">
            <div className="kpi-label mb-2">Try an example</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  className="text-xs text-slate-500 dark:text-ink-400 hover:text-slate-900 dark:text-ink-100 px-3 py-1.5 rounded-full border border-slate-200 dark:border-ink-700 hover:border-slate-300 dark:border-ink-500 transition-colors"
                  onClick={() => setQuestion(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="card p-4 border-signal-red/40 bg-signal-red/5 text-signal-red text-sm">
            {error}
          </div>
        )}

        {/* Routing */}
        {routing && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="kpi-label">Routing</div>
              {running && <Spinner label="Agents working…" />}
            </div>
            <div className="text-[15px] text-slate-900 dark:text-ink-100 mb-3">{routing.rationale}</div>
            <div className="flex flex-wrap gap-2">
              {routing.agents.map((a) => {
                const done = responses.find((r) => r.agent === a);
                return (
                  <Chip key={a} tone={done ? "green" : "ink-700"}>
                    <MessageSquareCode size={11} />
                    {DOMAIN_LABELS[a] || a}
                    {done ? " ✓" : " …"}
                  </Chip>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-agent responses */}
        {responses.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {responses.map((r, i) => (
              <AgentCard key={i} response={r} />
            ))}
          </div>
        )}

        {/* Synthesis */}
        {synthesis && <SynthesisCard synthesis={synthesis} decision={decision} />}
      </div>
    </>
  );
}

function AgentCard({ response }) {
  const conf = (response.confidence || 0) * 100;
  const tone =
    response.decision === "error" ? "red" :
    conf >= 75 ? "green" : conf >= 50 ? "amber" : "ink-700";
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Chip tone={tone}>{DOMAIN_LABELS[response.agent] || response.agent}</Chip>
        <span className="text-[11px] font-display text-slate-400 dark:text-ink-500 uppercase tracking-wider">
          {conf.toFixed(0)}% confidence
        </span>
      </div>
      <div className="text-slate-900 dark:text-ink-100 font-medium text-[15px] leading-snug">
        {response.decision || "—"}
      </div>
      {response.rationale && (
        <div className="text-slate-500 dark:text-ink-400 text-sm leading-relaxed border-l-2 border-slate-200 dark:border-ink-700 pl-3">
          {response.rationale}
        </div>
      )}
      {response.actions && response.actions.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-ink-800">
          <div className="kpi-label mb-2">Actions</div>
          <ul className="space-y-1.5">
            {response.actions.map((a, i) => (
              <li key={i} className="text-[13px] text-slate-900 dark:text-ink-100 flex gap-2">
                <span
                  className={cn(
                    "mt-1.5 w-1 h-1 rounded-full shrink-0",
                    a.priority === "high" ? "bg-signal-red" :
                    a.priority === "med" ? "bg-signal-amber" : "bg-ink-500"
                  )}
                />
                <span>
                  <span className="font-display text-[10px] uppercase tracking-wider text-slate-500 dark:text-ink-400 mr-2">
                    {a.type}
                  </span>
                  {JSON.stringify(a.payload || {}).slice(0, 140)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SynthesisCard({ synthesis, decision }) {
  return (
    <div className="card p-6 border-accent/30 bg-accent/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.25em] text-accent">
            Enterprise decision
          </div>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-ink-100 font-light mt-1 tracking-tightest">
            Coordinated recommendation
          </h3>
        </div>
        <Chip tone="accent">
          {(synthesis.confidence * 100).toFixed(0)}% confidence
        </Chip>
      </div>

      <div className="text-slate-900 dark:text-ink-100 text-[15px] leading-relaxed mb-5">
        {synthesis.enterprise_decision}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="kpi-label mb-2">Root cause</div>
          <div className="text-sm text-slate-600 dark:text-ink-300 leading-relaxed">{synthesis.root_cause}</div>
        </div>
        <div>
          <div className="kpi-label mb-2">Coordinated actions</div>
          <ul className="space-y-2">
            {(synthesis.coordinated_actions || []).map((a, i) => (
              <li key={i} className="text-sm flex gap-2.5 items-start">
                <Chip tone={a.priority === "high" ? "red" : a.priority === "med" ? "amber" : "ink-700"}>
                  {a.priority}
                </Chip>
                <span className="text-slate-900 dark:text-ink-100">
                  <span className="text-slate-500 dark:text-ink-400 font-display text-[11px] uppercase mr-1.5">
                    {DOMAIN_LABELS[a.owner] || a.owner}:
                  </span>
                  {a.action}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {synthesis.disagreements && synthesis.disagreements.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-ink-800">
          <div className="kpi-label mb-2">Disagreements</div>
          <ul className="space-y-1 text-sm text-signal-amber">
            {synthesis.disagreements.map((d, i) => (
              <li key={i}>· {d}</li>
            ))}
          </ul>
        </div>
      )}

      {decision?._id && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-ink-800 text-[11px] font-display text-slate-400 dark:text-ink-500 uppercase tracking-wider">
          Persisted: {decision._id}
        </div>
      )}
    </div>
  );
}
