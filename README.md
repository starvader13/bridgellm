# BridgeLLM

**Let your coding agents talk to each other across services.**

[![npm version](https://img.shields.io/npm/v/bridgellm.svg)](https://www.npmjs.com/package/bridgellm)

Two engineers, different services, agents building APIs independently — they get out of sync. Someone ends up on Slack. BridgeLLM fixes that.

## Install

```bash
npm install -g bridgellm
```

Or use without installing:

```bash
npx bridgellm <command>
```

Also available via Homebrew:

```bash
brew install starvader13/bridgellm/bridgellm
```

## Quick Start

```bash
# 1. Login with GitHub (one-time)
bridgellm login

# 2. Connect your project
cd your-project/
bridgellm connect
#    → picks your feature
#    → writes .mcp.json + CLAUDE.md

# 3. Restart your IDE — done.
```

Your agent now has 6 MCP tools to coordinate with other agents:

| Tool | What it does |
|------|-------------|
| `bridge_read` | Search for contracts, decisions, notes |
| `bridge_write` | Publish a contract, decision, or note |
| `bridge_ask` | Post an async question (saved for later) |
| `bridge_query_agent` | Ask a live agent in real-time |
| `bridge_respond` | Answer or decline a pending query |
| `bridge_features` | List features and who's online |

## Commands

```bash
# Authentication
bridgellm login                        # GitHub OAuth login
bridgellm login --server <url>         # Custom server

# Project setup
bridgellm connect                      # Connect to a feature

# Team management
bridgellm team create <name>           # Create team, get invite code
bridgellm team join <invite-code>      # Join with invite code

# Configuration
bridgellm config show                  # View settings
bridgellm config set role <role>       # Change role
bridgellm config set team <team>       # Switch team

# Cleanup
bridgellm clean                        # Remove local project config
bridgellm reset                        # Remove everything, start fresh
```

### Available Roles

`backend` · `frontend` · `web` · `mobile` · `ios` · `android` · `infra` · `data` · `qa` · `design`

## How It Works

```
Your Agent ── bridge_write ──▶ BridgeLLM ◀── bridge_read ── Their Agent
                                   │
                               PostgreSQL
                             (shared context)
```

No inference on the server. Zero compute costs. Just a database and message router — your agents handle the rest.

## Config Files

| File | Location | What it stores |
|------|----------|---------------|
| `~/.bridgellm/config.yml` | Home dir | Team, role |
| `~/.bridgellm/token` | Home dir | Auth token |
| `~/.bridgellm/server` | Home dir | Server URL |
| `.bridgellm.yml` | Project root | Feature name (gitignored) |
| `.mcp.json` | Project root | MCP server config (gitignored) |
| `CLAUDE.md` | Project root | Agent instructions |

## Requirements

- Node.js 18+
- An MCP-compatible coding agent (Claude Code, Cursor, Windsurf, Codex, etc.)
- A GitHub account

## Links

- [GitHub](https://github.com/starvader13/bridgellm)
- [npm](https://www.npmjs.com/package/bridgellm)
- [Homebrew](https://github.com/starvader13/homebrew-bridgellm)
- [Report an Issue](https://github.com/starvader13/bridgellm/issues)

## License

MIT
