# @openclaw/memory-agentmemo

OpenClaw memory plugin that connects to an external [AgentMemo](https://github.com/yxjsxy/agentMemo) HTTP service for semantic memory search, auto-recall, and auto-capture.

Canonical default port is **8790** (`http://localhost:8790`). Do not use port 8000.

## Why AgentMemo?

Unlike the built-in memory system (which embeds local Markdown files), AgentMemo provides:

- **Hybrid semantic search** — dense + sparse + temporal decay
- **Version history** — every memory write is recorded with full provenance
- **Multi-agent namespaces** — isolate memories by user, agent, or project
- **REST API** — self-hostable, language-agnostic
- **Persistence across node restarts** without re-embedding

## Installation

```bash
openclaw install @openclaw/memory-agentmemo
```

## Setup

### 1. Start AgentMemo server

Follow the [AgentMemo README](https://github.com/yxjsxy/agentMemo) to start the HTTP service:

```bash
# Example (defaults to port 8790)
cd agentMemo
python -m agentmemo.server
```

### 2. Probe the backend (recommended on first run)

ClawHub first-run used to hang when AgentMemo was down or the fetch never returned. Run the doctor script (5s timeout, exit 1 on failure):

```bash
npm run doctor
# or: node scripts/doctor.mjs
# or: node scripts/doctor.mjs http://localhost:8790/health
```

If the probe fails, start AgentMemo first: https://github.com/yxjsxy/agentMemo

### 3. Configure the plugin in `openclaw.json`

See `examples/openclaw.json` for a ready-to-copy local config.

**Minimal (local server, no auth):**

```json
{
  "plugins": {
    "memory-agentmemo": {}
  }
}
```

**Full configuration:**

```json
{
  "plugins": {
    "memory-agentmemo": {
      "serverUrl": "http://localhost:8790",
      "apiKey": "${AGENTMEMO_API_KEY}",
      "userId": "karl",
      "autoRecall": true,
      "autoCapture": false
    }
  }
}
```

**Remote server:**

```json
{
  "plugins": {
    "memory-agentmemo": {
      "serverUrl": "https://memo.yourdomain.com",
      "apiKey": "${AGENTMEMO_API_KEY}",
      "userId": "myagent",
      "autoRecall": true,
      "autoCapture": true
    }
  }
}
```

## Configuration Reference

| Field        | Type    | Required | Default                   | Description                                          |
|--------------|---------|----------|---------------------------|------------------------------------------------------|
| `serverUrl`  | string  | No       | `http://localhost:8790`   | Base URL of AgentMemo HTTP service                   |
| `apiKey`     | string  | No       | —                         | Bearer token for authenticated instances. Supports `${ENV_VAR}` |
| `userId`     | string  | No       | —                         | User/namespace ID for scoping memories               |
| `autoRecall` | boolean | No       | `true`                    | Inject relevant memories before agent starts         |
| `autoCapture`| boolean | No       | `false`                   | Auto-store important user messages after conversation |

## API Endpoints Used

| Feature       | Endpoint              | Method |
|---------------|-----------------------|--------|
| Semantic search | `POST /memories/search` | POST |
| Add memory    | `POST /memories/`     | POST   |
| Health probe  | `GET /health`         | GET    |

All three plugin fetches use `AbortSignal.timeout` with `FETCH_TIMEOUT_MS = 5000` so a hung AgentMemo process cannot stall OpenClaw.

## How It Works

### Auto-Recall

Before each agent turn, the plugin searches AgentMemo for memories relevant to the user's prompt and injects them into the system context as an untrusted `<relevant-memories>` block. Injected memory text is HTML-escaped (`&`, `<`, `>`, `"`, `'`) so stored content cannot break out of the wrapper or act as instructions.

### Auto-Capture

After each conversation turn, if `autoCapture: true`, the plugin analyzes user messages for memorable content (preferences, facts, decisions) and stores them to AgentMemo automatically.

English triggers (remember / prefer / always / my X is / decided / email) sit alongside Chinese cues for bilingual users:

- `记住|记得|别忘|记一下`
- `我(喜欢|不喜欢|讨厌|习惯|经常|从不|总是)`
- `我(决定|打算|以后用|改用)`
- `我的.{0,8}(是|叫)`

## Hardware notes (16GB Mac mini)

On a **16GB Mac mini**, do **not** coreside a 14B LLM with AgentMemo. The memory service needs RAM headroom for embeddings and search; a 14B model on the same machine will contend for memory and can hang or OOM health/search requests. Run the LLM elsewhere, or use a smaller local model.

## Background

This plugin was refactored from a core PR ([openclaw/openclaw#54712](https://github.com/openclaw/openclaw/pull/54712)) into a standalone ClawHub external plugin, following OpenClaw's recommended extension architecture.

## License

MIT — Copyright 2026 Karl Yang (yxjsxy)
