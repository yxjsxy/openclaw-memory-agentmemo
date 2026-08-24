---
name: memory-agentmemo
description: OpenClaw external memory plugin for AgentMemo. Enables semantic memory search and auto-capture via a self-hosted AgentMemo server. Install to use AgentMemo as your memory backend instead of the default file-based memory.
---

# Memory (AgentMemo)

External memory plugin for OpenClaw that delegates semantic memory storage and retrieval to a self-hosted [AgentMemo](https://github.com/yxjsxy/agentMemo) server.

Canonical default port is **8790** (`http://localhost:8790`), not 8000.

## Install

```bash
openclaw install @openclaw/memory-agentmemo
```

Or via ClawHub:

```bash
clawhub install memory-agentmemo
```

## Configuration

In your `openclaw.json`, add the plugin config:

```json
{
  "plugins": {
    "memory-agentmemo": {
      "serverUrl": "http://localhost:8790",
      "apiKey": "${AGENTMEMO_API_KEY}",
      "userId": "openclaw",
      "autoRecall": true,
      "autoCapture": false
    }
  }
}
```

See `examples/openclaw.json` for a copy-paste starting point.

### Config Options

| Field | Required | Description |
|-------|----------|-------------|
| `serverUrl` | ❌ | AgentMemo HTTP server URL (default `http://localhost:8790`) |
| `apiKey` | ❌ | API key if your server requires auth. Supports `${ENV_VAR}` |
| `userId` | ❌ | User ID for memory namespacing |
| `autoCapture` | ❌ | Auto-capture memories from conversations (default: false) |
| `autoRecall` | ❌ | Auto-inject relevant memories into context (default: true) |

## AgentMemo Server

Run your own AgentMemo server: https://github.com/yxjsxy/agentMemo

```bash
# Default port is 8790
cd agentMemo
python -m agentmemo.server
```

Before ClawHub first-run, probe the backend (5s timeout):

```bash
npm run doctor
# or: node scripts/doctor.mjs http://localhost:8790/health
```

Search / add / health fetches in the plugin also abort after **5 seconds** so a hung AgentMemo process cannot stall OpenClaw.

Auto-capture matches English *and* Chinese cues (`记住|记得|别忘|记一下`, preferences, decisions, identity facts). Injected memories are HTML-escaped inside an untrusted `<relevant-memories>` wrapper.

On a **16GB Mac mini**, do not coreside a 14B LLM with AgentMemo — RAM contention will stall or OOM the memory service.
