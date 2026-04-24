import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import AgentConsole from "./pages/AgentConsole.jsx";
import DecisionFeed from "./pages/DecisionFeed.jsx";
import GraphExplorer from "./pages/GraphExplorer.jsx";
import Warehouse from "./pages/Warehouse.jsx";
import DomainView from "./pages/DomainView.jsx";
import Ingestion from "./pages/Ingestion.jsx";
import { ThemeProvider } from "./hooks/useTheme.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<AgentConsole />} />
          <Route path="/decisions" element={<DecisionFeed />} />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/domains/:domain" element={<DomainView />} />
          <Route path="/ingest" element={<Ingestion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </ThemeProvider>
  );
}
