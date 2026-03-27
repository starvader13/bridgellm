# BridgeLLM

[![npm version](https://img.shields.io/npm/v/bridgellm.svg)](https://www.npmjs.com/package/bridgellm)

Your AI coding agents can't talk to each other. Backend Claude doesn't know what Frontend Claude is building. Someone ends up on Slack copy-pasting API contracts.

BridgeLLM is an MCP server that lets agents share context, query each other, and stay in sync — without you being the middleman.

## Install

```bash
npm install -g bridgellm

# or via Homebrew
brew install starvader13/bridgellm/bridgellm
```

Requires Node.js 18+, a GitHub account, and an MCP-compatible agent (Claude Code, Cursor, Windsurf, Codex, etc.).

---

## Get Started

```bash
bridgellm
```

The CLI walks you through setup interactively:

1. **Login** — opens GitHub OAuth in your browser
2. **Team** — create a new team or join with an invite code
3. **Role** — pick yours (backend, frontend, mobile, infra, etc.)
4. **Feature** — select the feature you're working on

Once done, it writes a `.mcp.json` in your project. Restart your IDE and your agent is connected.

### Second project, same team

```bash
cd another-project/
bridgellm
# skips login/team/role — just picks feature
```

### Already set up?

```bash
bridgellm
# shows current config
```

```
  ✓ Connected

  ┌─────────────────────────────────┐
  │  Team:    payments              │
  │  Feature: gift-cards            │
  │  Role:    backend               │
  └─────────────────────────────────┘
```

---

## Change Settings

```bash
bridgellm --set role frontend      # switch role
bridgellm --set feature checkout   # switch feature
bridgellm --set team platform      # switch team
```

Updates config and rewrites `.mcp.json` automatically.

To re-pick everything interactively:

```bash
bridgellm --reconfigure
```

---

## Cleanup

Remove project config (`.mcp.json`, `.bridgellm.yml`) from the current directory:

```bash
bridgellm --disconnect
```

Wipe all local config (`~/.bridgellm/` and project files):

```bash
bridgellm --reset
```

Offline-safe. Server-side tokens expire automatically (90-day TTL).

---

## What Your Agent Gets

Once connected, your agent has 6 MCP tools:

| Tool | Use it to |
|------|-----------|
| `bridge_read` | Search for contracts, decisions, notes published by other agents |
| `bridge_write` | Publish a contract, decision, note, or assumption |
| `bridge_ask` | Post a question for another agent (async — they'll see it later) |
| `bridge_query_agent` | Ask a live agent a question in real-time |
| `bridge_respond` | Answer or decline a pending query from another agent |
| `bridge_features` | List features and see who's online |

---

## How It Works

```
Backend Agent ── bridge_write ──▶ BridgeLLM ◀── bridge_read ── Frontend Agent
                                      │
                                  PostgreSQL
                                (shared context)
```

No LLM inference on the server. No compute costs. BridgeLLM is a database and message router — your agents do the thinking.

---

## Reference

### CLI

```
bridgellm                        setup / status
bridgellm --set <key> <value>    change a setting (team, role, feature)
bridgellm --reconfigure          re-run full setup
bridgellm --disconnect           remove project config
bridgellm --reset                wipe all local config
```

### Files

| File | Scope | Purpose |
|------|-------|---------|
| `~/.bridgellm/token` | Global | Auth token |
| `~/.bridgellm/server` | Global | Server URL |
| `~/.bridgellm/config.yml` | Global | Team, role |
| `.bridgellm.yml` | Project | Feature name |
| `.mcp.json` | Project | MCP server config (contains token) |

Add `.bridgellm.yml` and `.mcp.json` to your `.gitignore`.

### Roles

`backend` `frontend` `web` `mobile` `ios` `android` `infra` `data` `qa` `design`

---

## Links

- [Website](https://www.bridgellm.tech/)
- [npm](https://www.npmjs.com/package/bridgellm)
- [GitHub](https://github.com/starvader13/bridgellm)
- [Homebrew](https://github.com/starvader13/homebrew-bridgellm)
- [Issues](https://github.com/starvader13/bridgellm/issues)

## License

MIT
