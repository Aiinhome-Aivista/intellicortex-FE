# IntelliCortex Frontend Project Summary

This project, **IntelliCortex**, is a modern frontend React application built to serve as the user interface for an **AI Decision System**. It interacts with a backend API to manage and visualize various AI agents, decision feeds, and data warehouse metrics across multiple business domains.

## Technology Stack
- **Core Framework**: React 18, Vite (for fast building and hot-module replacement).
- **Routing**: React Router DOM for single-page application (SPA) navigation.
- **Styling**: Tailwind CSS for utility-first styling and a custom design system.
- **Data Visualization**: Recharts and D3.js are used for rendering metrics, KPIs, and potentially complex relationship graphs.
- **Icons**: Lucide React for consistent UI iconography.
- **Data Fetching**: Custom API client using `fetch` with Bearer token authentication, including custom Server-Sent Events (SSE) logic to stream real-time AI decision outputs.

## Architecture & Key Features
The application is structured into several core modules accessible via a sidebar navigation shell:

1. **Overview (Home)**: A general dashboard giving an overview of the system's state.
2. **Agent Console (Ask)**: An interface where users can query specific AI agents and receive answers.
3. **Decision Feed**: A real-time stream of decisions made by the AI system. This is implemented using custom SSE stream handlers to parse chunks of data as they arrive from the backend.
4. **Graph Explorer**: A visual interface (likely utilizing D3) to explore relationships, data schemas, and entity traces within the warehouse.
5. **Warehouse**: A comprehensive interface to view enterprise data, KPIs, and metrics. It includes specific endpoints for tracking:
   - Stockouts and underperforming outlets
   - Overall Equipment Effectiveness (OEE) and work orders
   - Late shipments and lane performance
   - Financial metrics like AR Aging and DSO
   - Insurance claims, HR attrition, and procurement risks
6. **Domain Views**: Dedicated views for 12 distinct business domains including Supply Chain, Sales, Planning, Production, Procurement, Logistics, Order-to-Cash (O2C), Finance, BFSI, Insurance, Risk, and HR.
7. **Ingestion**: Tools to trigger data seeding or reset operations on the backend warehouse.

## Project Structure
- `src/App.jsx`: The main entry point that sets up the routes and the `Shell` layout.
- `src/components/`: Contains shared UI components like the `Shell` (sidebar and layout) and UI `Primitives`.
- `src/pages/`: Contains the main route views (`Home.jsx`, `AgentConsole.jsx`, `DecisionFeed.jsx`, `Warehouse.jsx`, etc.).
- `src/lib/api.js`: The central API client that handles all communication with the backend (`/api`), including standard REST calls and streaming endpoints.
- `src/hooks/`: Contains custom React hooks (e.g., `useFetch.js`) for data fetching and state management.

Overall, it's a highly modular and data-heavy enterprise dashboard designed to surface AI-driven insights and complex business metrics in a clean, dark-themed UI.
