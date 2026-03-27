#!/usr/bin/env node

import {
  getToken,
  getGlobalConfig,
  saveGlobalConfig,
  getLocalConfig,
  saveLocalConfig,
  getServerUrl,
  writeMcpJson,
  clean,
  reset,
  DEFAULT_SERVER,
} from './config.js';
import { success, info, error, heading, summary, ask, select, selectRole } from './ui.js';
import { login } from './commands/login.js';
import { selectFeature } from './commands/connect.js';
import { createTeam, joinTeam } from './commands/team.js';

const VERSION = '0.2.0';
const ROLES = ['backend', 'frontend', 'web', 'mobile', 'ios', 'android', 'infra', 'data', 'qa', 'design'];

async function main() {
  const args = process.argv.slice(2);
  const flag = args[0];

  try {
    if (flag === '--help' || flag === '-h') {
      printHelp();
    } else if (flag === '--version' || flag === '-v') {
      console.log(VERSION);
    } else if (flag === '--reset') {
      await reset(process.cwd());
    } else if (flag === '--disconnect') {
      await clean(process.cwd());
    } else if (flag === '--reconfigure') {
      await handleSetup(true);
    } else if (flag === '--set') {
      await handleSet(args[1], args[2]);
    } else if (!flag) {
      await handleSetup(false);
    } else {
      error(`Unknown flag: ${flag}`);
      printHelp();
      process.exit(1);
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

async function handleSetup(force: boolean) {
  const cwd = process.cwd();

  // Step 1: Ensure logged in
  let token: string;
  try {
    token = await getToken();
  } catch {
    console.log('');
    info('Not logged in — opening browser...');
    await login(DEFAULT_SERVER);
    token = await getToken();
  }

  const server = await getServerUrl();
  const global = await getGlobalConfig();

  // Step 2: Ensure team
  if (!global.team || force) {
    // Check server for existing team membership
    if (!global.team) {
      try {
        const res = await fetch(`${server}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = (await res.json()) as { team: { name: string } | null };
        if (me.team) {
          global.team = me.team.name;
          await saveGlobalConfig(global);
          success(`Team: ${me.team.name}`);
        }
      } catch {
        // offline or error
      }
    }

    if (!global.team || force) {
      console.log('');
      const { value } = await select('Team setup', ['Create a new team', 'Join with invite code']);

      if (value === 'Create a new team') {
        const name = await ask('Team name: ');
        await createTeam(name);
        const updated = await getGlobalConfig();
        global.team = updated.team;
      } else {
        const code = await ask('Invite code: ');
        await joinTeam(code);
        const updated = await getGlobalConfig();
        global.team = updated.team;
      }
    }
  }

  // Step 3: Ensure role
  if (!global.role || force) {
    console.log('');
    const role = await selectRole(global.role);
    global.role = role;
    await saveGlobalConfig(global);
    success(`Role: ${role}`);
  }

  // Step 4: Feature for this project
  const local = await getLocalConfig(cwd);

  if (local.feature && !force) {
    // Already connected — show status
    console.log('');
    success('Connected');
    summary({
      Team: global.team!,
      Feature: local.feature,
      Role: global.role!,
      Server: server,
    });
    info('Run with --reconfigure to change settings.\n');
    return;
  }

  // Select feature and write .mcp.json
  console.log('');
  const feature = await selectFeature(server, token, local.feature);
  await saveLocalConfig(cwd, { ...local, feature });
  await writeMcpJson(cwd);

  summary({
    Team: global.team!,
    Feature: feature,
    Role: global.role!,
  });
  success('Wrote .mcp.json');
  info('Restart Claude Code to connect.\n');
}

async function handleSet(key: string, value: string) {
  if (!key || !value) {
    error('Usage: bridgellm --set <key> <value>');
    info('Keys: team, role, feature');
    process.exit(1);
  }

  const cwd = process.cwd();

  if (key === 'team') {
    const global = await getGlobalConfig();
    await saveGlobalConfig({ ...global, team: value });
    success(`Team updated to "${value}"`);
  } else if (key === 'role') {
    const normalized = value.toLowerCase().trim();
    if (!ROLES.includes(normalized)) {
      error(`Invalid role "${value}". Must be one of: ${ROLES.join(', ')}`);
      process.exit(1);
    }
    const global = await getGlobalConfig();
    await saveGlobalConfig({ ...global, role: normalized });
    success(`Role updated to "${normalized}"`);
  } else if (key === 'feature') {
    const local = await getLocalConfig(cwd);
    await saveLocalConfig(cwd, { ...local, feature: value });
    success(`Feature updated to "${value}"`);
  } else {
    error(`Unknown key "${key}". Use: team, role, feature`);
    process.exit(1);
  }

  // Update .mcp.json if possible
  try {
    await writeMcpJson(cwd);
    success('.mcp.json updated');
  } catch {
    // not fully configured yet — that's fine
  }
}

function printHelp() {
  console.log(`
  bridgellm — let AI coding agents talk to each other

  Usage:
    bridgellm                        Set up or show status
    bridgellm --set <key> <value>    Change a setting (team, role, feature)
    bridgellm --reconfigure          Re-run full setup
    bridgellm --disconnect           Remove project config
    bridgellm --reset                Wipe all local config

  Examples:
    bridgellm                        First-time setup or show status
    bridgellm --set role frontend    Switch role
    bridgellm --set feature checkout Switch feature
    bridgellm --reconfigure          Change team, role, or feature
`);
}

main();
