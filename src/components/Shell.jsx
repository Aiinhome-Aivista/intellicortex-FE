import { NavLink } from "react-router-dom";
import {
  Home, MessageSquareCode, GitBranch, Layers, Database,
  Activity, ArrowUpRight, Sparkles,
} from "lucide-react";
import { DOMAIN_LABELS } from "../lib/utils.js";
import ThemeToggle from "./ThemeToggle.jsx";
const nav = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/ask", label: "Ask", icon: MessageSquareCode },
  { to: "/decisions", label: "Decisions", icon: Sparkles },
  { to: "/graph", label: "Graph explorer", icon: GitBranch },
  { to: "/warehouse", label: "Warehouse", icon: Database },
  { to: "/ingest", label: "Ingestion", icon: Layers },
];

const domains = [
  "supply_chain", "sales", "planning", "production", "procurement",
  "logistics", "o2c", "finance", "bfsi", "insurance", "risk", "hr",
];

export default function Shell({ children }) {
  return (
    <div className="min-h-screen flex text-slate-900 dark:text-ink-100 relative z-10">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-ink-800 bg-slate-50/40 dark:bg-ink-900/40 flex flex-col">
        <div className="px-5 pt-6 pb-5 border-b border-slate-200 dark:border-ink-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/40 grid place-items-center">
              <div className="w-1.5 h-1.5 bg-accent rounded-full pulse-dot" />
            </div>
            <div className="font-display text-[15px] font-semibold tracking-tight">
              intelli<span className="text-accent dark:text-accent">cortex</span>
              <span className="text-accent dark:text-accent">.</span>
            </div>
          </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-ink-400 mt-3 font-display">
            AI Decision System
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-accent/20 dark:bg-accent/10 text-slate-900 dark:text-accent border border-accent/40 dark:border-accent/20"
                    : "text-slate-600 dark:text-ink-400 hover:text-slate-900 dark:hover:text-ink-100 hover:bg-slate-200/60 dark:hover:bg-ink-800/60 border border-transparent"
                }`
              }
            >
              <Icon size={15} strokeWidth={1.75} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}

          <div className="pt-5 pb-2 px-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-ink-500 font-display">
              Domains
            </div>
          </div>
          {domains.map((d) => (
            <NavLink
              key={d}
              to={`/domains/${d}`}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                  isActive
                    ? "text-slate-900 dark:text-ink-100 bg-slate-200 dark:bg-ink-800/80"
                    : "text-slate-600 dark:text-ink-400 hover:text-slate-900 dark:hover:text-ink-100 hover:bg-slate-200/60 dark:hover:bg-ink-800/60"
                }`
              }
            >
              <span>{DOMAIN_LABELS[d]}</span>
              <ArrowUpRight size={11} className="opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-ink-800 px-5 py-3 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 dark:text-ink-500 font-display uppercase tracking-wider flex items-center gap-2">
            <Activity size={10} className="text-signal-green" />
            <span>Connected</span>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
