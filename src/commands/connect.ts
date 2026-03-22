import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getMergedConfig, getLocalConfig, saveLocalConfig } from "../config.js";
import { heading, info, success, ask, select, summary } from "../ui.js";

const CLAUDE_MD_START = "<!-- bridgellm:start -->";
const CLAUDE_MD_END = "<!-- bridgellm:end -->";

async function apiFetch(serverUrl: string, token: string, path: string) {
  const res = await fetch(`${serverUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json()) as { error: string };
    throw new Error(data.error);
  }
  return res.json();
}

export async function connect(cwd: string): Promise<void> {
  const config = await getMergedConfig(cwd);

  if (!config.team) {
    throw new Error("No team configured. Run `bridgellm login` first.");
  }
  if (!config.role) {
    throw new Error("No role configured. Run `bridgellm login` first.");
  }

  heading("BridgeLLM Connect");
  info(`Team: ${config.team}  •  Role: ${config.role}`);

  // Determine feature
  let feature = config.feature;

  if (!feature) {
    try {
      const { features } = (await apiFetch(
        config.server,
        config.token,
        "/api/features",
      )) as {
        features: Array<{
          name: string;
          context_count: number;
          active_sessions: number;
        }>;
      };

      if (features.length > 0) {
        const labels = features.map(
          (f) =>
            `${f.name} (${f.context_count} contexts, ${f.active_sessions} online)`,
        );
        const result = await select("Select feature", labels, {
          newLabel: "Create new feature",
        });
        feature = result.value;
      } else {
        feature = await ask("No features yet. Feature name: ");
      }
    } catch {
      feature = await ask("Feature name: ");
    }
  }

  if (!feature) throw new Error("Feature name is required.");

  // Save local config
  const local = await getLocalConfig(cwd);
  await saveLocalConfig(cwd, { ...local, feature });

  // Write .mcp.json
  const mcpConfig = {
    mcpServers: {
      bridgellm: {
        type: "http",
        url: `${config.server}/mcp`,
        headers: {
          Authorization: `Bearer ${config.token}`,
          "X-BridgeLLM-Feature": feature,
          "X-BridgeLLM-Role": config.role,
        },
      },
    },
  };

  const mcpPath = join(cwd, ".mcp.json");
  await writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2) + "\n");

  // Write CLAUDE.md
  const claudeBlock = `${CLAUDE_MD_START}
## BridgeLLM

Connected to **${config.team}** | Feature: **${feature}** | Role: **${config.role}**

- BEFORE writing cross-service code, call \`bridge_read\` first
- After creating/modifying interfaces, use \`bridge_write\` to publish
- Use \`bridge_query_agent\` for live queries, \`bridge_ask\` for async
- Your feature is "${feature}" and role is "${config.role}"
${CLAUDE_MD_END}`;

  const claudePath = join(cwd, "CLAUDE.md");
  let claudeContent = "";
  try {
    claudeContent = await readFile(claudePath, "utf-8");
  } catch {
    // doesn't exist
  }

  if (claudeContent.includes(CLAUDE_MD_START)) {
    const regex = new RegExp(
      `${escapeRegex(CLAUDE_MD_START)}[\\s\\S]*?${escapeRegex(CLAUDE_MD_END)}`,
    );
    claudeContent = claudeContent.replace(regex, claudeBlock);
  } else {
    claudeContent =
      claudeContent +
      (claudeContent.endsWith("\n") ? "\n" : "\n\n") +
      claudeBlock +
      "\n";
  }
  await writeFile(claudePath, claudeContent);

  summary({ Team: config.team, Feature: feature, Role: config.role });
  success("Wrote .bridgellm.yml, .mcp.json, CLAUDE.md");
  info("Restart Claude Code to connect.\n");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
