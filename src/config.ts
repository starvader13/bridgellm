import { readFile, writeFile, mkdir, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const DEFAULT_SERVER = 'https://bridgellm-bridge-411567362585.asia-south1.run.app';

const BRIDGELLM_DIR = join(homedir(), '.bridgellm');

export interface GlobalConfig {
  team?: string;
  role?: string;
}

export interface LocalConfig {
  feature?: string;
  team?: string;
}

export interface MergedConfig {
  token: string;
  server: string;
  team?: string;
  role?: string;
  feature?: string;
}

async function ensureDir(): Promise<void> {
  await mkdir(BRIDGELLM_DIR, { recursive: true });
}

// ── Token ──

export async function saveToken(token: string): Promise<void> {
  await ensureDir();
  await writeFile(join(BRIDGELLM_DIR, 'token'), token, { mode: 0o600 });
}

export async function getToken(): Promise<string> {
  try {
    return (await readFile(join(BRIDGELLM_DIR, 'token'), 'utf-8')).trim();
  } catch {
    throw new Error('Not logged in.');
  }
}

// ── Server ──

export async function saveServerUrl(url: string): Promise<void> {
  await ensureDir();
  await writeFile(join(BRIDGELLM_DIR, 'server'), url, { mode: 0o600 });
}

export async function getServerUrl(): Promise<string> {
  try {
    return (await readFile(join(BRIDGELLM_DIR, 'server'), 'utf-8')).trim();
  } catch {
    return DEFAULT_SERVER;
  }
}

// ── Global config ──

export async function getGlobalConfig(): Promise<GlobalConfig> {
  try {
    const raw = await readFile(join(BRIDGELLM_DIR, 'config.yml'), 'utf-8');
    return parseSimpleYaml(raw);
  } catch {
    return {};
  }
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  await ensureDir();
  const lines: string[] = [];
  if (config.team) lines.push(`team: ${config.team}`);
  if (config.role) lines.push(`role: ${config.role}`);
  await writeFile(join(BRIDGELLM_DIR, 'config.yml'), lines.join('\n') + '\n');
}

// ── Local config ──

export async function getLocalConfig(cwd: string): Promise<LocalConfig> {
  try {
    const raw = await readFile(join(cwd, '.bridgellm.yml'), 'utf-8');
    return parseSimpleYaml(raw);
  } catch {
    return {};
  }
}

export async function saveLocalConfig(cwd: string, config: LocalConfig): Promise<void> {
  const lines: string[] = [];
  if (config.feature) lines.push(`feature: ${config.feature}`);
  if (config.team) lines.push(`team: ${config.team}`);
  await writeFile(join(cwd, '.bridgellm.yml'), lines.join('\n') + '\n');
}

// ── Merged config ──

export async function getMergedConfig(cwd: string): Promise<MergedConfig> {
  const token = await getToken();
  const server = await getServerUrl();
  const global = await getGlobalConfig();
  const local = await getLocalConfig(cwd);

  return {
    token,
    server,
    team: local.team ?? global.team,
    role: global.role,
    feature: local.feature,
  };
}

// ── Write .mcp.json ──

export async function writeMcpJson(cwd: string): Promise<void> {
  const config = await getMergedConfig(cwd);

  if (!config.feature || !config.role) {
    throw new Error('Feature and role are required to write .mcp.json');
  }

  const mcpConfig = {
    mcpServers: {
      bridgellm: {
        type: 'http',
        url: `${config.server}/mcp`,
        headers: {
          Authorization: `Bearer ${config.token}`,
          'X-BridgeLLM-Feature': config.feature,
          'X-BridgeLLM-Role': config.role,
        },
      },
    },
  };

  await writeFile(join(cwd, '.mcp.json'), JSON.stringify(mcpConfig, null, 2) + '\n');
}

// ── Clean (project config only) ──

async function tryUnlink(path: string): Promise<boolean> {
  try {
    await unlink(path);
    return true;
  } catch {
    return false;
  }
}

export async function clean(cwd: string): Promise<void> {
  const removed: string[] = [];

  if (await tryUnlink(join(cwd, '.mcp.json'))) removed.push('.mcp.json');
  if (await tryUnlink(join(cwd, '.bridgellm.yml'))) removed.push('.bridgellm.yml');

  if (removed.length > 0) {
    console.log(`  Removed: ${removed.join(', ')}`);
  } else {
    console.log('  Nothing to clean.');
  }
}

// ── Reset (local + global, offline-safe) ──

export async function reset(cwd: string): Promise<void> {
  await clean(cwd);

  try {
    await rm(BRIDGELLM_DIR, { recursive: true, force: true });
    console.log('  Removed ~/.bridgellm/');
  } catch {
    // already gone
  }

  console.log('  Reset complete.');
}

function parseSimpleYaml(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+):\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }
  return result;
}
