// API client. Uses the dev-token by default; swap to real auth in prod.
const BASE = "/api";
const TOKEN = import.meta.env.VITE_API_TOKEN || "dev-token";

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  // health & metrics
  ready: () => request("/health/ready"),
  counts: () => request("/metrics/counts"),
  domainSummary: () => request("/metrics/domain-summary"),

  // agents
  listAgents: () => request("/agents/"),
  runAgent: (name, question, shared = {}) =>
    request(`/agents/${name}/run`, { method: "POST", body: { question, shared } }),

  // decisions
  ask: (question, shared = {}) =>
    request("/decisions/ask", { method: "POST", body: { question, shared } }),
  routeOnly: (question) =>
    request("/decisions/route", { method: "POST", body: { question } }),
  history: (agent, limit = 20) => {
    const qs = new URLSearchParams();
    if (agent) qs.set("agent", agent);
    qs.set("limit", String(limit));
    return request(`/decisions/?${qs}`);
  },

  // warehouse
  schema: () => request("/warehouse/schema"),
  kpis: (domain) => request(`/warehouse/kpis${domain ? `?domain=${domain}` : ""}`),
  entity: (id) => request(`/warehouse/entity/${encodeURIComponent(id)}`),
  trace: (entityId, depth = 3) =>
    request(`/warehouse/graph/trace?entity_id=${encodeURIComponent(entityId)}&depth=${depth}`),
  stockouts: (region, minDays = 0) => {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    qs.set("min_days", String(minDays));
    return request(`/warehouse/stockouts?${qs}`);
  },
  underperformingOutlets: (region = "PAN_IN", threshold = -10) =>
    request(`/warehouse/outlets/underperforming?region=${region}&threshold_pct=${threshold}`),
  oee: (plant = "PLT-01") => request(`/warehouse/production/oee?plant=${plant}`),
  workOrders: (plant) =>
    request(`/warehouse/production/work-orders${plant ? `?plant=${plant}` : ""}`),
  lateShipments: (carrier) =>
    request(`/warehouse/logistics/late-shipments${carrier ? `?carrier=${carrier}` : ""}`),
  lanePerf: () => request("/warehouse/logistics/lane-performance"),
  arAging: (bucket = 30) => request(`/warehouse/o2c/ar-aging?bucket_days=${bucket}`),
  dso: () => request("/warehouse/o2c/dso"),
  suspiciousTx: () => request("/warehouse/bfsi/suspicious-transactions"),
  claimRatio: (pl) =>
    request(`/warehouse/insurance/claim-ratio${pl ? `?product_line=${pl}` : ""}`),
  highRiskClaims: () => request("/warehouse/insurance/high-risk-claims"),
  riskRegister: (minScore = 0) => request(`/warehouse/risk/register?min_score=${minScore}`),
  openIncidents: () => request("/warehouse/risk/open-incidents"),
  attritionHotspots: (threshold = 12) =>
    request(`/warehouse/hr/attrition-hotspots?threshold_pct=${threshold}`),
  openRequisitions: () => request("/warehouse/hr/open-requisitions"),
  openPos: () => request("/warehouse/procurement/open-pos"),
  vendorRisk: (id) => request(`/warehouse/procurement/vendor-risk/${id}`),

  // ingestion
  seed: (vertical = "all") =>
    request("/ingest/seed", { method: "POST", body: { vertical } }),
  reset: () => request("/ingest/reset", { method: "POST" }),
};

// Server-sent events helper for streaming decisions.
// Because EventSource can't set custom headers, we include the token as
// a query parameter (back-end accepts it in either form in practice).
export function streamDecision(question, shared, handlers) {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(`${BASE}/decisions/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ question, shared }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() || "";
        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          const event = (lines.find((l) => l.startsWith("event:")) || "").slice(6).trim();
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!event || !dataLine) continue;
          try {
            const payload = JSON.parse(dataLine.slice(5).trim());
            handlers[event]?.(payload);
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
      handlers.end?.();
    } catch (e) {
      if (e.name !== "AbortError") handlers.error?.(e);
    }
  })();
  return () => ctrl.abort();
}
