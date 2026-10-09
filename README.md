# Stewrd: Multi-Source Data Sync & Masking Agent

<p align="center">
  <img src="docs/assets/mainBanner.jpeg" alt="Stewrd Orchestrator Engine with Stats" width="800"/>
</p>


<p align="center">
    <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-PolyForm_Noncommercial-blue.svg" alt="License">
  </a>
</p>

Stewrd is an advanced data synchronization and masking tool migrating records from multiple sources to multiple destinations concurrently. It compiles into a single binary containing a Go backend, React UI, SQLite checkpointing, and SSM/SSH tunnels.

## 📖 Table of Contents
- [Stewrd: Multi-Source Data Sync \& Masking Agent](#stewrd-multi-source-data-sync--masking-agent)
  - [📖 Table of Contents](#-table-of-contents)
  - [🏗️ General Architecture](#️-general-architecture)
  - [✨ Key Features](#-key-features)
  - [📂 Project Structure (Monorepo)](#-project-structure-monorepo)
  - [🚀 Deployment and Execution](#-deployment-and-execution)
    - [Standard Deployment](#standard-deployment)
  - [🛠️ Development Standards \& Commits](#️-development-standards--commits)
  - [⚖️ License](#️-license)

## 🏗️ General Architecture

Stewrd operates as a self-contained agent. The frontend SPA is built with React and Zustand, and it is injected directly into the Go binary using `go:embed` as a Virtual File System.

```mermaid
flowchart TB
    %% Styling definitions for better visual grouping
    classDef browserBox fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#000
    classDef goBox fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef pipelineBox fill:#c8e6c9,stroke:#2e7d32,stroke-width:1px,stroke-dasharray: 4 4,color:#000
    classDef awsBox fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef extBox fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#000
    classDef dbNode fill:#ffcc80,stroke:#e65100,stroke-width:2px,color:#000
    classDef sqliteNode fill:#b3e5fc,stroke:#0277bd,stroke-width:2px,color:#000

    subgraph LocalEnvironment ["🖥️ Local Machine / Bastion Host"]
        direction TB
        
        subgraph Browser ["🌐 Web Browser (Frontend SPA)"]
            direction TB
            ReactUI["React + Vite\n(Main UI Components)"]
            ReactFlow["React Flow\n(Interactive Schema DAG & Rule Mapper)"]
            Zustand["Zustand\n(State & WebSocket Client Manager)"]
            
            ReactUI <--> ReactFlow
            ReactUI <--> Zustand
        end
        class Browser browserBox

        subgraph GoBinary ["⚙️ Go Agent (Single Executable Binary)"]
            direction TB
            
            EmbedVFS["📦 go:embed\n(Virtual File System with React Build)"]
            HTTPServer["🌐 HTTP / REST Router\n(Echo / Fiber / net/http)"]
            WSServer["🔌 WebSocket Upgrader\n(Real-time Telemetry & Logs)"]
            
            Orchestrator["🧠 Orchestrator\n(Schema Analyzer & Execution Planner)"]
            
            JobDB[("🗃️ SQLite\n(Job & State Persistence)")]:::sqliteNode
            
            subgraph Pipeline ["⚡ Concurrent Execution Engine (Goroutines)"]
                direction LR
                DBReader["📖 DB Reader Worker\n(Chunked SELECTs)"]
                Transformers["🎭 Transformer Pool\n(Data Masking, Hashing & Subsetting)"]
                DBWriter["✍️ DB Writer Worker\n(Batched Bulk INSERTs)"]
                
                DBReader -- "Raw Rows\n(Go Channel)" --> Transformers
                Transformers -- "Masked Rows\n(Go Channel)" --> DBWriter
            end
            class Pipeline pipelineBox

            EmbedVFS -. "Serves Static Assets" .-> HTTPServer
            HTTPServer <--> Orchestrator
            WSServer <--> Orchestrator
            
            %% Persistence flow
            Orchestrator <-->|Reads/Updates state| JobDB
            Orchestrator --> Pipeline
            Pipeline -. "Reports progress" .-> Orchestrator
        end
        class GoBinary goBox

        AWSTunnel["🔐 AWS SSM Session Manager\n(Local Port Forwarding, e.g., localhost:5432)"]
        
        %% Internal Local Connections
        Browser -- "1. Request App (HTTP GET)" --> HTTPServer
        Browser -- "2. Sync Config & Mapping (REST)" --> HTTPServer
        Browser -- "3. Stream Progress & Logs (WSS)" --> WSServer
    end

    subgraph AWSCloud ["☁️ AWS Cloud Environment (Private VPC)"]
        direction TB
        ProdDB[("🗄️ Production DB\n(PostgreSQL / SQL Server)")]:::dbNode
        TargetDB[("🗄️ Dev/QA DB\n(Target Destination)")]:::dbNode
    end
    class AWSCloud awsBox

    subgraph ExternalAPI ["🤖 External AI Services"]
        LLM["LLM Provider\n(OpenAI / Anthropic API)"]
    end
    class ExternalAPI extBox

    %% External Connections
    Orchestrator -- "4. Send DDL & Context\nReceive Masking Plan (HTTPS)" --> LLM
    DBReader -- "TCP (localhost)" --> AWSTunnel
    AWSTunnel -- "Encrypted WebSocket Tunnel" --> ProdDB
    DBWriter -- "TCP Connection (Direct or Tunneled)" --> TargetDB
```

## ✨ Key Features

*   **Single File Deployment:** The system compiles into a single executable binary, requiring no external web servers like Nginx.
*   **Multiple Connection Methods:** Natively supports Local Port Forwarding via AWS SSM Session Manager, standard SSH tunnels, and direct connections.
*   **Resilient Checkpointing:** Uses a `TABLE_TASK` table in SQLite to track exact row progress, enabling resumption of failed or interrupted tasks without starting over.

## 📂 Project Structure (Monorepo)

The project separates responsibilities strictly based on SOLID principles:

*   `/cmd/stewrd`: Entry point that initializes configuration, server, and engine.
*   `/internal/server`: HTTP layer (REST) and WebSocket Upgrader for telemetry.
*   `/internal/engine`: The core engine, divided into `connection`, `executor` (Workers), and `orchestrator`.
*   `/internal/errors` & `/internal/logger`: Standardized `AppError` and structured telemetry.
*   `/internal/helpers`: Pure, transversal utility functions.
*   `/frontend`: React SPA folder. Strictly organized into `components` (visual) and `containers` (logic/state), alongside a `constants` folder.

## 🚀 Deployment and Execution

### Standard Deployment
Deploying Stewrd requires only two files:
1.  The Go compiled binary.
2.  The `appsettings.yaml` configuration file.

## 🛠️ Development Standards & Commits

To maintain code quality, the project strictly enforces the following rules:

*   **Frontend SOLID & DRY Rules:** Absolute prohibition of duplicated code. All logic must use strictly typed TypeScript interfaces. Avoid hardcoded strings by extracting them into constant files. Use `extends` in interfaces whenever possible.
*   **Conventional Commits:** Every commit must follow the structure: `type(scope): description`.
    *   **Types:** `feat`, `fix`, `refactor`, `perf`, `test`, `chore`, `docs`.
    *   **Scopes:** `frontend` (React UI), `engine` (Go Orchestrator/Workers), `server` (HTTP/WebSockets), `db` (SQLite/JobDB), `config` (YAML mapping).
    *   *Example:* `feat(engine): add ssh tunnel support for mysql connections`

## ⚖️ License

**Source-Available (Non-Commercial Use)**.
This project is licensed under the **PolyForm Noncommercial License 1.0.0**. The source code is open for reading, auditing, and educational use; however, **any commercial use is strictly prohibited**. It may not be sold, monetized, or integrated into paid SaaS products by third parties.
